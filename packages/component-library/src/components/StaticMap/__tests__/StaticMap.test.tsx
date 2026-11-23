import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import '@/styles.css';
import { StaticMap } from '@/components/StaticMap';
import type { StaticMapProps } from '@/components/StaticMap';

const syntheticImage = {
  src: '/synthetic-static-image.svg',
  width: 400,
  height: 200,
  alt: 'Synthetic landscape',
};

function mount(props: Partial<StaticMapProps> = {}) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <StaticMap
        image={syntheticImage}
        markers={[]}
        unavailableMessage="Image unavailable."
        {...props}
      />
    </MantineProvider>,
  );
}

describe('StaticMap', () => {
  it('renders the image, marker positions and connector lines', () => {
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

    expect(
      screen.getByRole('img', { name: 'Synthetic landscape' }),
    ).toHaveAttribute('src', syntheticImage.src);
    expect(
      container.querySelector('[data-marker-position="first"]'),
    ).toHaveStyle({
      left: '25%',
      top: '25%',
    });
    expect(
      container.querySelector('[data-marker-position="second"]'),
    ).toHaveStyle({
      left: '75%',
      top: '75%',
    });
    expect(container.querySelector('svg line')).toHaveAttribute('x1', '100');
    expect(container.querySelector('svg line')).toHaveAttribute('y2', '150');
  });

  it('groups coincident markers into one aria-hidden marker', () => {
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
          x: 100,
          y: 50,
          label: 'Second point',
          content: <span>Second</span>,
        },
      ],
    });
    const target = container.querySelector('[data-marker-position="first"]');

    expect(container.querySelectorAll('[data-marker-position]')).toHaveLength(
      1,
    );
    expect(target).toHaveAttribute('data-marker-ids', 'first second');
    expect(target).toHaveAttribute('aria-hidden', 'true');
    expect(target).toHaveAttribute('inert');
    expect(target).toHaveTextContent('FirstSecond');
  });

  it('shows the unavailable state when no image is supplied', () => {
    const { container } = mount({ image: undefined });

    expect(screen.getByText('Image unavailable.')).toBeVisible();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('[data-unavailable="true"]')).not.toBeNull();
  });

  it('shows the unavailable state after an image error', () => {
    const { container } = mount();

    fireEvent.error(screen.getByRole('img'));

    expect(screen.getByText('Image unavailable.')).toBeVisible();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('[data-unavailable="true"]')).not.toBeNull();
  });
});
