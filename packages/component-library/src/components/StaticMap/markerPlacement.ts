import type { CSSProperties } from 'react';

import type { InteractiveMapMarker } from '@/components/InteractiveMap/types';

interface MarkerStyleOptions {
  readonly x: number;
  readonly y: number;
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly size?: NonNullable<InteractiveMapMarker['size']> | undefined;
  readonly anchor?: InteractiveMapMarker['anchor'] | undefined;
  readonly scaleAwareMinimum?: boolean | undefined;
}

type MarkerCSSProperties = CSSProperties & {
  readonly '--interactive-map-marker-ring-diameter'?: string;
};

export function markerStyle({
  x,
  y,
  imageWidth,
  imageHeight,
  size,
  anchor = 'center',
  scaleAwareMinimum = false,
}: MarkerStyleOptions): MarkerCSSProperties {
  const style: MarkerCSSProperties = {
    left: `${(x / imageWidth) * 100}%`,
    top: `${(y / imageHeight) * 100}%`,
  };

  if (size !== undefined) {
    const minimumWidth = scaleAwareMinimum
      ? 'calc(var(--map-marker-min-size, 0px) / var(--map-zoom, 1))'
      : 'var(--map-marker-min-size, 0px)';
    return {
      ...style,
      width: `max(${(size.width / imageWidth) * 100}%, ${minimumWidth})`,
      aspectRatio: `${size.width} / ${size.height}`,
      '--interactive-map-marker-ring-diameter': `${(Math.max(size.width, size.height) / size.width) * 100}%`,
      transform:
        anchor === 'bottom'
          ? 'translate(-50%, -100%)'
          : 'translate(-50%, -50%)',
    };
  }

  return style;
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
