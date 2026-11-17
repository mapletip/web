import type { RouteOverlayOptions } from '@/features/route-overlay/useRouteOverlay';

interface MapDetailOverlay {
  readonly type: 'explore';
  readonly openedFocus: string | undefined;
}

function parseMapDetailOverlay(value: unknown): MapDetailOverlay | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const candidate = value as {
    readonly type?: unknown;
    readonly openedFocus?: unknown;
  };
  if (candidate.type !== 'explore') return undefined;
  if (
    candidate.openedFocus !== undefined &&
    typeof candidate.openedFocus !== 'string'
  ) {
    return undefined;
  }
  return { type: 'explore', openedFocus: candidate.openedFocus };
}

function sameMapDetailOverlay(
  left: MapDetailOverlay | undefined,
  right: MapDetailOverlay,
): boolean {
  return left?.type === right.type;
}

/** Explore view state for the shared route overlay controller. */
export const mapDetailOverlayOptions: RouteOverlayOptions<MapDetailOverlay> = {
  stateKey: 'mapDetailOverlay',
  parse: parseMapDetailOverlay,
  same: sameMapDetailOverlay,
};
