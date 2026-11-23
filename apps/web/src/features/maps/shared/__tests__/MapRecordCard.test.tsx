import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MapRecordCard, type MapRecordCardView } from '../MapRecordCard';

function mapView({
  withoutMinimap = false,
  withoutStage = false,
}: {
  readonly withoutMinimap?: boolean;
  readonly withoutStage?: boolean;
} = {}): MapRecordCardView {
  return {
    key: 'fixture:map:practice',
    name: 'Practice Meadow',
    ...(withoutMinimap ? {} : { minimapUrl: '/practice-minimap.png' }),
    ...(withoutStage || withoutMinimap
      ? {}
      : {
          minimapStage: {
            width: 100,
            height: 200,
            spawnPoints: [
              { x: 25, y: 40 },
              { x: 75, y: 160 },
            ],
          },
        }),
    footerParts: [],
  };
}

function matchDesktopMedia(): void {
  window.matchMedia = (query: string) =>
    ({
      matches:
        query.includes('hover: hover') && query.includes('pointer: fine'),
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
      screen.getByRole('tooltip', {
        name: 'Practice Meadow full-size minimap preview',
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

  it('opens the preview with the same dots on hover', async () => {
    matchDesktopMedia();
    const user = userEvent.setup();
    renderCard(mapView());

    expect(
      screen.getByRole('img', { name: 'Practice Meadow minimap' }),
    ).toBeInTheDocument();

    const trigger = await screen.findByRole('button', {
      name: 'Enlarge Practice Meadow minimap',
    });
    await user.hover(trigger);
    await waitForPreview();
    expect(
      screen.getByRole('img', {
        name: 'Practice Meadow minimap enlarged',
      }),
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-marker-visual="monster-dot"]'),
    ).toHaveLength(4);
  });

  it('opens the preview with the same dots on keyboard focus', async () => {
    matchDesktopMedia();
    const user = userEvent.setup();
    renderCard(mapView());

    const trigger = await screen.findByRole('button', {
      name: 'Enlarge Practice Meadow minimap',
    });
    await user.tab();
    expect(trigger).toHaveFocus();
    await waitForPreview();
    expect(
      document.querySelectorAll('[data-marker-visual="monster-dot"]'),
    ).toHaveLength(4);
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
