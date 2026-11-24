import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/RouterLinks', () => ({
  recordCardLinkRenderer: (
    destination: { readonly href: string },
    props: { readonly className: string; readonly children: ReactNode },
  ) => (
    <a href={destination.href} className={props.className}>
      {props.children}
    </a>
  ),
}));

import { MapRecordCard, type MapRecordCardView } from '../MapRecordCard';

function mapView({
  withoutMinimap = false,
  withoutStage = false,
  withSprite = false,
  withDestination = false,
}: {
  readonly withoutMinimap?: boolean;
  readonly withoutStage?: boolean;
  readonly withSprite?: boolean;
  readonly withDestination?: boolean;
} = {}): MapRecordCardView {
  return {
    key: 'fixture:map:practice',
    name: 'Practice Meadow',
    ...(withoutMinimap ? {} : { minimapUrl: '/practice-minimap.png' }),
    ...(withSprite
      ? {
          minimapSprite: {
            url: '/monster-sprite.png',
            width: 32,
            height: 48,
          },
        }
      : {}),
    ...(withoutStage || withoutMinimap
      ? {}
      : {
          minimapStage: {
            width: 100,
            height: 200,
            scale: 0.0625,
            spawnPoints: [
              { x: 25, y: 40 },
              { x: 75, y: 160 },
            ],
          },
        }),
    footerParts: [],
    ...(withDestination ? { destination: { href: '/practice-meadow' } } : {}),
  };
}

function matchMedia(isDesktop: boolean): void {
  window.matchMedia = (query: string) =>
    ({
      matches: isDesktop && query.includes('min-width'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

function renderCard(map: MapRecordCardView) {
  return render(
    <MantineProvider env="test">
      <MapRecordCard map={map} />
    </MantineProvider>,
  );
}

async function waitForPreview(): Promise<void> {
  await waitFor(() => {
    expect(
      screen.getByRole('dialog', {
        name: 'Practice Meadow',
      }),
    ).toBeVisible();
  });
}

describe('MapRecordCard', () => {
  it('renders one spawn dot per point at its image percentage position', () => {
    renderCard(mapView());

    const stage = screen.getByRole('group', {
      name: 'Practice Meadow minimap',
    });
    const markers = stage.querySelectorAll('[data-marker-position]');
    expect(markers).toHaveLength(2);
    expect(markers[0]).toHaveStyle({ left: '25%', top: '20%' });
    expect(markers[1]).toHaveStyle({ left: '75%', top: '80%' });
    expect(
      stage.querySelectorAll('[data-marker-visual="monster-dot"]'),
    ).toHaveLength(2);
  });

  it('leaves the minimap to the card link when its preview is off', () => {
    renderCard({
      ...mapView({ withDestination: true }),
      minimapPreview: false,
    });

    expect(
      screen.queryByRole('button', { name: /Enlarge .* minimap/u }),
    ).toBeNull();
    expect(document.querySelector('[data-map-minimap="true"]')).not.toBeNull();
    expect(
      screen.getByRole('link', { name: 'Practice Meadow' }),
    ).toHaveAttribute('href', '/practice-meadow');
  });

  it('shows no media well when the map has no minimap', () => {
    renderCard(mapView({ withoutMinimap: true }));

    expect(document.querySelector('[data-map-minimap="true"]')).toBeNull();
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('keeps the plain lazy image for cards without stage points', () => {
    renderCard(mapView({ withoutStage: true }));

    const image = screen.getByRole('img', {
      name: 'Practice Meadow minimap',
    });
    expect(image).toHaveAttribute('src', '/practice-minimap.png');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(screen.queryByRole('group')).toBeNull();
    expect(document.querySelector('[data-marker-position]')).toBeNull();
  });

  it('opens a desktop popover on click and returns focus after Escape', async () => {
    matchMedia(true);
    const user = userEvent.setup();
    renderCard(mapView());

    expect(
      screen.getByRole('img', { name: 'Practice Meadow minimap' }),
    ).toBeInTheDocument();

    const trigger = await screen.findByRole('button', {
      name: 'Enlarge Practice Meadow minimap',
    });
    await user.click(trigger);
    await waitForPreview();
    expect(
      screen.getByRole('img', {
        name: 'Practice Meadow minimap enlarged',
      }),
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-marker-visual="monster-dot"]'),
    ).toHaveLength(4);
    const expandedStage = screen.getByRole('group', {
      name: 'Practice Meadow minimap enlarged',
    });
    const inlineStage = screen.getByRole('group', {
      name: 'Practice Meadow minimap',
    });
    expect(
      [...expandedStage.querySelectorAll('[data-marker-position]')].every(
        (marker) => marker.getAttribute('data-selected') === 'true',
      ),
    ).toBe(true);
    expect(inlineStage.querySelector('[data-selected="true"]')).toBeNull();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', {
          name: 'Practice Meadow',
        }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it('opens the enlarged map in a phone modal with a title and close button', async () => {
    matchMedia(false);
    const user = userEvent.setup();
    renderCard(mapView());

    const trigger = await screen.findByRole('button', {
      name: 'Enlarge Practice Meadow minimap',
    });
    await user.click(trigger);
    const modal = await screen.findByRole('dialog', {
      name: 'Practice Meadow',
    });
    expect(
      screen.getByRole('img', { name: 'Practice Meadow minimap enlarged' }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Close enlarged minimap' }),
    );
    await waitFor(() => expect(modal).not.toBeInTheDocument());
  });

  it('scales bottom-anchored sprites only in the enlarged map', async () => {
    matchMedia(true);
    const user = userEvent.setup();
    renderCard(mapView({ withSprite: true }));

    const inlineStage = screen.getByRole('group', {
      name: 'Practice Meadow minimap',
    });
    expect(
      inlineStage.querySelectorAll('[data-marker-visual="monster-dot"]'),
    ).toHaveLength(2);
    expect(
      inlineStage.querySelectorAll('[data-marker-visual="monster-sprite"]'),
    ).toHaveLength(0);
    expect(inlineStage.querySelector('[data-selected="true"]')).toBeNull();

    await user.click(
      screen.getByRole('button', { name: 'Enlarge Practice Meadow minimap' }),
    );
    const expandedStage = screen.getByRole('group', {
      name: 'Practice Meadow minimap enlarged',
    });
    const markers = expandedStage.querySelectorAll('[data-marker-position]');
    expect(markers).toHaveLength(2);
    expect(
      [...markers].every(
        (marker) => marker.getAttribute('data-selected') === 'true',
      ),
    ).toBe(true);
    expect(markers[0]?.getAttribute('style')).toMatch(
      /width:\s*max\(2%,\s*var\(--map-marker-min-size,\s*0px\)\)/u,
    );
    expect(markers[0]).toHaveStyle({
      aspectRatio: '2 / 3',
      transform: 'translate(-50%, -100%)',
    });
    expect(
      expandedStage.querySelectorAll('[data-marker-visual="monster-sprite"]'),
    ).toHaveLength(2);
    expect(
      expandedStage.querySelectorAll('[data-marker-visual="monster-dot"]'),
    ).toHaveLength(0);
    const sprite = expandedStage.querySelector(
      '[data-marker-visual="monster-sprite"]',
    );
    expect(sprite).toHaveAttribute('alt', '');
    expect(sprite).not.toHaveAttribute('aria-hidden');
    expect(sprite?.closest('[data-marker-position]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('keeps the card link available when the minimap button is clicked', async () => {
    matchMedia(true);
    const user = userEvent.setup();
    renderCard(mapView({ withDestination: true }));
    const link = screen.getByRole('link', { name: 'Practice Meadow' });
    const trigger = screen.getByRole('button', {
      name: 'Enlarge Practice Meadow minimap',
    });

    await user.click(trigger);

    expect(link).toHaveAttribute('href', '/practice-meadow');
    expect(window.location.pathname).toBe('/');
    await waitForPreview();
  });

  it('server-renders the positioned dots', () => {
    const html = renderToString(
      <MantineProvider>
        <MapRecordCard map={mapView()} />
      </MantineProvider>,
    );

    expect(html).toContain('data-marker-position="0"');
    expect(html).toContain('data-marker-position="1"');
    expect(html).toContain('left:25%;top:20%');
    expect(html).toContain('left:75%;top:80%');
    expect(html.match(/data-marker-visual="monster-dot"/gu)).toHaveLength(2);
  });
});
