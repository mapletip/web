import type { RouteOverlayOptions } from '@/features/route-overlay/useRouteOverlay';

interface MapDetailOverlay {
  readonly type: 'explore';
}

function parseMapDetailOverlay(value: unknown): MapDetailOverlay | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const candidate = value as { readonly type?: unknown };
  if (candidate.type !== 'explore') return undefined;
  return { type: 'explore' };
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
