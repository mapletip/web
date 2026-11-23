import { render } from '@testing-library/react';
import { createElement, Profiler, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { InteractiveMap } from '@/components/InteractiveMap';

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

describe('InteractiveMap static isolation', () => {
  it('renders once on mount without subscribing to matchMedia', () => {
    const onRender = vi.fn();
    const matchMedia = vi.spyOn(window, 'matchMedia');

    const { unmount } = render(
      <Profiler id="interactive-map-static" onRender={onRender}>
        <InteractiveMap
          interactive={false}
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
    unmount();
    matchMedia.mockRestore();
  });
});
