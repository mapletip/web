import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import '@/styles.css';
import { InteractiveMap } from '@/components/InteractiveMap';
import type {
  InteractiveMapImage,
  InteractiveMapProps,
} from '@/components/InteractiveMap';

const syntheticImage: InteractiveMapImage = {
  src: '/synthetic-image.svg',
  width: 400,
  height: 200,
  alt: 'Synthetic landscape',
};

function mount(props: Partial<InteractiveMapProps> = {}) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <InteractiveMap
        image={syntheticImage}
        markers={[]}
        unavailableMessage="Image unavailable."
        {...props}
      />
    </MantineProvider>,
  );
}

describe('InteractiveMap', () => {
  it('renders a labeled group and gives the image its accessible name', () => {
    mount();

    expect(
      screen.getByRole('group', { name: 'Synthetic landscape' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Synthetic landscape' }),
    ).toHaveAttribute('src', syntheticImage.src);
  });

  it('keeps the image aspect ratio in a CSS variable before the image loads', () => {
    const { container } = mount();

    const stage = container.querySelector<HTMLElement>('[role="group"]');
    expect(stage).not.toBeNull();
    expect(stage!.style.aspectRatio).toBe('');
    expect(
      stage!.style.getPropertyValue('--interactive-map-image-aspect-ratio'),
    ).toBe('2');
    expect(screen.getByRole('img')).toHaveAttribute('width', '400');
    expect(screen.getByRole('img')).toHaveAttribute('height', '200');
  });

  it('places marker anchors at image percentage coordinates', () => {
    const { container } = mount({
      markers: [
        {
          id: 'first',
          x: 100,
          y: 50,
          label: 'First point',
          content: <span>First</span>,
        },
        {
          id: 'second',
          x: 300,
          y: 150,
          label: 'Second point',
          content: <span>Second</span>,
        },
      ],
    });

    const first = container.querySelector('[data-marker-position="first"]');
    const second = container.querySelector('[data-marker-position="second"]');
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first).toHaveStyle({
      left: '25%',
      top: '25%',
    });
    expect(second).toHaveStyle({
      left: '75%',
      top: '75%',
    });
  });

  it('renders sized visuals outside KeepScale and centers the target on them', () => {
    const { container } = mount({
      markers: [
        {
          id: 'sprite',
          x: 100,
          y: 50,
          label: 'Sprite',
          size: { width: 80, height: 40 },
          anchor: 'bottom',
          content: <span>Sprite content</span>,
        },
      ],
    });
    const marker = container.querySelector<HTMLElement>(
      '[data-marker-position="sprite"]',
    );
    const visual = marker?.querySelector('[data-marker-visual="true"]');
    const target = screen.getByRole('button', { name: 'Sprite' });
    const keepScale = target.parentElement;

    expect(marker).toHaveStyle({
      left: '25%',
      top: '25%',
      width:
        'max(20%, calc(var(--map-marker-min-size, 0px) / var(--map-zoom, 1)))',
      aspectRatio: '80 / 40',
      transform: 'translate(-50%, -100%)',
    });
    expect(marker).toHaveAttribute('data-sized', 'true');
    expect(visual).toHaveTextContent('Sprite content');
    expect(visual?.parentElement).toBe(marker);
    expect(visual?.closest('button')).toBeNull();
    expect(keepScale?.style.left).toBe('');
    expect(keepScale?.style.top).toBe('');
    expect(keepScale).toHaveAttribute('data-sized', 'true');
    expect(target).toHaveAttribute('data-sized', 'true');
    expect(target.style.width).toBe('');
    expect(target.style.height).toBe('');
    expect(target).not.toHaveTextContent('Sprite content');
  });

  it('keeps unsized marker content centered when anchor is supplied', () => {
    const { container } = mount({
      markers: [
        {
          id: 'bottom',
          x: 100,
          y: 50,
          label: 'Bottom point',
          anchor: 'bottom',
          content: <span>Content</span>,
        },
      ],
    });
    const marker = container.querySelector<HTMLElement>(
      '[data-marker-position="bottom"]',
    );
    const target = screen.getByRole('button', { name: 'Bottom point' });

    expect(marker).not.toHaveAttribute('data-sized');
    expect(marker?.querySelector('[data-marker-visual]')).toBeNull();
    expect(marker?.style.cssText).toBe('left: 25%; top: 25%;');
    expect(target).not.toHaveAttribute('data-anchor');
    expect(target).toHaveTextContent('Content');
  });

  it('draws decorative lines between the named marker coordinates', () => {
    const { container } = mount({
      markers: [
        {
          id: 'first',
          x: 100,
          y: 50,
          label: 'First point',
          content: <span>First</span>,
        },
        {
          id: 'second',
          x: 300,
          y: 150,
          label: 'Second point',
          content: <span>Second</span>,
        },
      ],
      connectors: [{ id: 'first-second', from: 'first', to: 'second' }],
    });

    const overlay = container.querySelector('svg');
    const line = container.querySelector('svg line');
    expect(overlay).toHaveAttribute('viewBox', '0 0 400 200');
    expect(overlay).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(overlay).toHaveAttribute('focusable', 'false');
    expect(overlay).toHaveAttribute('pointer-events', 'none');
    expect(line).toHaveAttribute('x1', '100');
    expect(line).toHaveAttribute('y1', '50');
    expect(line).toHaveAttribute('x2', '300');
    expect(line).toHaveAttribute('y2', '150');
  });

  it('skips connector pairs with a missing marker', () => {
    const { container } = mount({
      markers: [
        {
          id: 'first',
          x: 100,
          y: 50,
          label: 'First point',
          content: <span>First</span>,
        },
      ],
      connectors: [
        { id: 'missing-start', from: 'missing', to: 'first' },
        { id: 'missing-end', from: 'first', to: 'missing' },
      ],
    });

    expect(container.querySelectorAll('svg line')).toHaveLength(0);
  });

  it('reports activation without changing the host-controlled selection', () => {
    const onActivate = vi.fn();
    mount({
      markers: [
        {
          id: 'first',
          x: 100,
          y: 50,
          label: 'First point',
          content: <span>First</span>,
        },
        {
          id: 'second',
          x: 300,
          y: 150,
          label: 'Second point',
          content: <span>Second</span>,
        },
      ],
      selectedIds: ['first'],
      onActivate,
    });

    const first = screen.getByRole('button', { name: 'First point' });
    const second = screen.getByRole('button', { name: 'Second point' });
    fireEvent.click(second);

    expect(onActivate).toHaveBeenCalledExactlyOnceWith(['second']);
    expect(first).toHaveAttribute('aria-pressed', 'true');
    expect(second).toHaveAttribute('aria-pressed', 'false');
  });

  it('uses one target for two markers at the same point', () => {
    const onActivate = vi.fn();
    mount({
      markers: [
        {
          id: 'first',
          x: 100,
          y: 50,
          label: 'First point',
          content: <span>First</span>,
        },
        {
          id: 'second',
          x: 100,
          y: 50,
          label: 'Second point',
          content: <span>Second</span>,
        },
      ],
      selectedIds: ['second'],
      onActivate,
    });

    const target = screen.getByRole('button', {
      name: 'First point, Second point (2)',
    });
    expect(document.querySelectorAll('button[data-marker-ids]')).toHaveLength(
      1,
    );
    expect(target).toHaveAttribute('data-marker-ids', 'first second');
    expect(target).toHaveAttribute('data-selected', 'true');
    expect(target).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(target);
    expect(onActivate).toHaveBeenCalledExactlyOnceWith(['first', 'second']);
  });

  it('uses one target for three markers at the same point', () => {
    const onActivate = vi.fn();
    mount({
      markers: [
        {
          id: 'first',
          x: 100,
          y: 50,
          label: 'First point',
          content: <span>First</span>,
        },
        {
          id: 'second',
          x: 100,
          y: 50,
          label: 'Second point',
          content: <span>Second</span>,
        },
        {
          id: 'third',
          x: 100,
          y: 50,
          label: 'Third point',
          content: <span>Third</span>,
        },
      ],
      onActivate,
    });

    const target = screen.getByRole('button', {
      name: 'First point, Second point, Third point (3)',
    });
    expect(document.querySelectorAll('button[data-marker-ids]')).toHaveLength(
      1,
    );
    expect(target).toHaveAttribute('data-marker-ids', 'first second third');
    fireEvent.click(target);
    expect(onActivate).toHaveBeenCalledExactlyOnceWith([
      'first',
      'second',
      'third',
    ]);
  });

  it('renders static markers without focus stops or activation', () => {
    const onActivate = vi.fn();
    const { container } = mount({
      interactive: false,
      markers: [
        {
          id: 'static',
          x: 100,
          y: 50,
          label: 'Static point',
          content: <span>Static</span>,
        },
      ],
      selectedIds: ['static'],
      onActivate,
    });

    const marker = container.querySelector('[data-marker-position="static"]');
    const target = container.querySelector('[data-marker-id="static"]');
    expect(marker).not.toBeNull();
    expect(target).not.toBeNull();
    expect(container.querySelectorAll('span[data-marker-ids]')).toHaveLength(1);
    expect(marker).toHaveAttribute('data-selected', 'true');
    expect(marker).toHaveAttribute('data-marker-ids', 'static');
    expect(target).toHaveAttribute('data-marker-ids', 'static');
    expect(target).toHaveAttribute('data-selected', 'true');
    expect(target).toHaveAttribute('inert');
    expect(
      container.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]',
      ),
    ).toHaveLength(0);

    fireEvent.click(target!);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('does not render or request marker details in static mode', () => {
    const renderDetails = vi.fn(() => <p>Marker details</p>);
    mount({
      interactive: false,
      markers: [
        {
          id: 'static',
          x: 100,
          y: 50,
          label: 'Static point',
          content: <span>Static</span>,
        },
      ],
      renderDetails,
    });

    expect(screen.queryByText('Marker details')).not.toBeInTheDocument();
    expect(renderDetails).not.toHaveBeenCalled();
  });

  it('requests details only for the activated marker group', () => {
    const renderDetails = vi.fn((markerIds: readonly string[]) => (
      <p>Details for {markerIds.join(', ')}</p>
    ));
    mount({
      markers: [
        {
          id: 'first',
          x: 100,
          y: 50,
          label: 'First point',
          content: <span>First</span>,
        },
        {
          id: 'second',
          x: 300,
          y: 150,
          label: 'Second point',
          content: <span>Second</span>,
        },
      ],
      renderDetails,
    });

    expect(renderDetails).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'First point' }));
    expect(renderDetails.mock.calls.map(([markerIds]) => markerIds)).toEqual([
      ['first'],
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Second point' }));
    expect(renderDetails.mock.calls.map(([markerIds]) => markerIds)).toEqual([
      ['first'],
      ['second'],
    ]);
  });

  it('shows the host message without markers when the image is missing', () => {
    const { container } = mount({
      image: undefined,
      markers: [
        {
          id: 'hidden',
          x: 10,
          y: 20,
          label: 'Hidden point',
          content: <span>Hidden</span>,
        },
      ],
    });

    expect(screen.getByText('Image unavailable.')).toBeVisible();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('[data-marker-id]')).toBeNull();
    expect(container.querySelector('[data-unavailable="true"]')).not.toBeNull();
  });

  it('shows the host message without markers when the image fails to load', () => {
    const { container } = mount({
      markers: [
        {
          id: 'hidden',
          x: 10,
          y: 20,
          label: 'Hidden point',
          content: <span>Hidden</span>,
        },
      ],
    });

    fireEvent.error(screen.getByRole('img'));

    expect(screen.getByText('Image unavailable.')).toBeVisible();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('[data-marker-id]')).toBeNull();
    expect(container.querySelector('[data-unavailable="true"]')).not.toBeNull();
  });
});
