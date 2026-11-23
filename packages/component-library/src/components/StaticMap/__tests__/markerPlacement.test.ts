import { describe, expect, it } from 'vitest';

import { markerStyle } from '@/components/StaticMap/markerPlacement';

const point = {
  x: 100,
  y: 50,
  imageWidth: 400,
  imageHeight: 200,
};

describe('markerStyle', () => {
  it('sizes markers by image percentage and applies a static minimum width', () => {
    expect(
      markerStyle({
        ...point,
        size: { width: 80, height: 40 },
      }),
    ).toEqual({
      left: '25%',
      top: '25%',
      width: 'max(20%, var(--map-marker-min-size, 0px))',
      aspectRatio: '80 / 40',
      '--interactive-map-marker-ring-diameter': '100%',
      transform: 'translate(-50%, -50%)',
    });
  });

  it('floors zoomed markers in screen pixels and supports a bottom anchor', () => {
    expect(
      markerStyle({
        ...point,
        size: { width: 80, height: 40 },
        anchor: 'bottom',
        scaleAwareMinimum: true,
      }),
    ).toEqual({
      left: '25%',
      top: '25%',
      width:
        'max(20%, calc(var(--map-marker-min-size, 0px) / var(--map-zoom, 1)))',
      aspectRatio: '80 / 40',
      '--interactive-map-marker-ring-diameter': '100%',
      transform: 'translate(-50%, -100%)',
    });
  });

  it('ignores anchor for unsized markers', () => {
    expect(markerStyle(point)).toEqual({ left: '25%', top: '25%' });
    expect(markerStyle({ ...point, anchor: 'bottom' })).toEqual({
      left: '25%',
      top: '25%',
    });
  });

  it('sets the ring diameter from the larger side of a tall marker', () => {
    expect(
      markerStyle({
        ...point,
        size: { width: 40, height: 80 },
      })['--interactive-map-marker-ring-diameter'],
    ).toBe('200%');
  });
});
