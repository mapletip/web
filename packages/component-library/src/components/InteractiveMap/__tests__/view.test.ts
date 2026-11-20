import { describe, expect, it } from 'vitest';

import type { InteractiveMapView } from '@/components/InteractiveMap/types';
import {
  transformToView,
  viewToTransform,
} from '@/components/InteractiveMap/view';

const view: InteractiveMapView = { zoom: 2.5, centerX: 130, centerY: 72 };
const image = { imageWidth: 400, imageHeight: 200 };

describe('InteractiveMap view conversion', () => {
  it.each([
    { stageWidth: 400, stageHeight: 200 },
    { stageWidth: 800, stageHeight: 400 },
    { stageWidth: 1200, stageHeight: 600 },
  ])('round-trips at $stageWidth by $stageHeight', (stage) => {
    const transform = viewToTransform({ ...stage, ...image, view });
    const restored = transformToView({ ...stage, ...image, ...transform });

    expect(restored.zoom).toBeCloseTo(view.zoom);
    expect(restored.centerX).toBeCloseTo(view.centerX);
    expect(restored.centerY).toBeCloseTo(view.centerY);
  });

  it.each([
    {
      stage: { stageWidth: 800, stageHeight: 400 },
      image: { imageWidth: 200, imageHeight: 400 },
      view: { zoom: 2, centerX: 100, centerY: 240 },
      expected: { zoom: 2, centerX: 100, centerY: 240 },
    },
    {
      stage: { stageWidth: 400, stageHeight: 800 },
      image: { imageWidth: 400, imageHeight: 200 },
      view: { zoom: 2, centerX: 160, centerY: 100 },
      expected: { zoom: 2, centerX: 160, centerY: 100 },
    },
  ])(
    'round-trips a saved view with letterboxing',
    ({ stage, image, view, expected }) => {
      const transform = viewToTransform({ ...stage, ...image, view });
      const restored = transformToView({ ...stage, ...image, ...transform });

      expect(restored.zoom).toBeCloseTo(expected.zoom);
      expect(restored.centerX).toBeCloseTo(expected.centerX);
      expect(restored.centerY).toBeCloseTo(expected.centerY);
    },
  );

  it('clamps zoom and keeps the image inside the stage', () => {
    const stage = { stageWidth: 800, stageHeight: 400 };
    const zoomedOut = viewToTransform({
      ...stage,
      ...image,
      view: { zoom: 0.1, centerX: -100, centerY: 500 },
    });
    const zoomedIn = viewToTransform({
      ...stage,
      ...image,
      view: { zoom: 20, centerX: -100, centerY: 500 },
    });

    expect(transformToView({ ...stage, ...image, ...zoomedOut })).toEqual({
      zoom: 0.5,
      centerX: 200,
      centerY: 100,
    });
    expect(transformToView({ ...stage, ...image, ...zoomedIn })).toEqual({
      zoom: 8,
      centerX: 25,
      centerY: 187.5,
    });
  });
});
