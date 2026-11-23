import { render } from '@testing-library/react';
import { createElement, Profiler, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { StaticMap } from '@/components/StaticMap';

vi.mock('@mantine/core', () => ({
  Image: ({
    src,
    alt,
    width,
    height,
    className,
    onError,
  }: {
    readonly src: string;
    readonly alt: string;
    readonly width: number;
    readonly height: number;
    readonly className?: string;
    readonly onError?: () => void;
  }) => createElement('img', { src, alt, width, height, className, onError }),
  Text: ({
    children,
    className,
  }: {
    readonly children: ReactNode;
    readonly className?: string;
  }) => createElement('p', { className }, children),
}));

vi.mock('react-zoom-pan-pinch', () => {
  throw new Error('StaticMap must not import react-zoom-pan-pinch.');
});

describe('StaticMap isolation', () => {
  it('renders once on mount and does not subscribe to matchMedia', () => {
    const onRender = vi.fn();
    const matchMedia = vi.spyOn(window, 'matchMedia');

    render(
      <Profiler id="static-map" onRender={onRender}>
        <StaticMap
          image={{
            src: '/synthetic-image.svg',
            width: 400,
            height: 200,
            alt: 'Synthetic landscape',
          }}
          markers={[]}
          unavailableMessage="Image unavailable."
        />
      </Profiler>,
    );

    expect(onRender).toHaveBeenCalledTimes(1);
    expect(matchMedia).not.toHaveBeenCalled();
    matchMedia.mockRestore();
  });

  it('can be imported without evaluating react-zoom-pan-pinch', async () => {
    await expect(
      import('@/components/StaticMap/StaticMap'),
    ).resolves.toHaveProperty('StaticMap');
  });
});
