import type { CSSProperties } from 'react';

import type { InteractiveMapMarker } from '@/components/InteractiveMap/types';

interface MarkerStyleOptions {
  readonly x: number;
  readonly y: number;
  readonly imageWidth: number;
  readonly imageHeight: number;
}

export function markerStyle({
  x,
  y,
  imageWidth,
  imageHeight,
}: MarkerStyleOptions): CSSProperties {
  return {
    left: `${(x / imageWidth) * 100}%`,
    top: `${(y / imageHeight) * 100}%`,
  };
}

export function groupMarkers(
  markers: readonly InteractiveMapMarker[],
): InteractiveMapMarker[][] {
  const groups = new Map<string, InteractiveMapMarker[]>();

  for (const marker of markers) {
    const key = `${marker.x},${marker.y}`;
    let group = groups.get(key);
    if (group === undefined) {
      group = [];
      groups.set(key, group);
    }
    group.push(marker);
  }

  return [...groups.values()];
}
