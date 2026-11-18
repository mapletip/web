import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import '@/styles.css';
import { MarkerStage } from '@/components/MarkerStage';
import type {
  MarkerStageImage,
  MarkerStageProps,
} from '@/components/MarkerStage';

const syntheticImage: MarkerStageImage = {
  src: '/synthetic-image.svg',
  width: 400,
  height: 200,
  alt: 'Synthetic landscape',
};

function mount(props: Partial<MarkerStageProps> = {}) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <MarkerStage
        image={syntheticImage}
        markers={[]}
        unavailableMessage="Image unavailable."
        {...props}
      />
    </MantineProvider>,
  );
}

describe('MarkerStage', () => {
  it('renders a labelled group and gives the image its accessible name', () => {
    mount();

    expect(
      screen.getByRole('group', { name: 'Synthetic landscape' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Synthetic landscape' }),
    ).toHaveAttribute('src', syntheticImage.src);
  });

  it('reserves the intrinsic aspect ratio before the image loads', () => {
    const { container } = mount();

    const stage = container.querySelector('[role="group"]');
    expect(stage).not.toBeNull();
    expect(stage).toHaveStyle({ aspectRatio: '400 / 200' });
    expect(screen.getByRole('img')).toHaveAttribute('width', '400');
    expect(screen.getByRole('img')).toHaveAttribute('height', '200');
  });

  it('places markers by image percentages with their bottom centre on the point', () => {
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

    const first = container.querySelector('[data-marker-id="first"]');
    const second = container.querySelector('[data-marker-id="second"]');
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
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(target).toHaveAttribute('data-marker-ids', 'first second');
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
    expect(screen.getAllByRole('button')).toHaveLength(1);
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

    const target = container.querySelector('[data-marker-id="static"]');
    expect(target).not.toBeNull();
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
