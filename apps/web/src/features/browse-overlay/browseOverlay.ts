import type { RouteOverlayOptions } from '@/features/route-overlay/useRouteOverlay';

/** Transient browse UI represented in TanStack Router location state. */
export type BrowseOverlay =
  | { readonly type: 'filters' }
  | { readonly type: 'navigation' }
  | {
      readonly type: 'record-details';
      readonly recordId: string;
      readonly relation?: 'locations';
    };

function parseBrowseOverlay(value: unknown): BrowseOverlay | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const candidate = value as {
    readonly type?: unknown;
    readonly recordId?: unknown;
    readonly relation?: unknown;
  };
  if (candidate.type === 'filters' || candidate.type === 'navigation') {
    return { type: candidate.type };
  }
  if (
    candidate.type === 'record-details' &&
    typeof candidate.recordId === 'string'
  ) {
    if (candidate.relation !== undefined && candidate.relation !== 'locations')
      return undefined;
    return {
      type: 'record-details',
      recordId: candidate.recordId,
      ...(candidate.relation === 'locations'
        ? { relation: candidate.relation }
        : {}),
    };
  }
  return undefined;
}

function sameOverlay(
  left: BrowseOverlay | undefined,
  right: BrowseOverlay,
): boolean {
  if (left === undefined || left.type !== right.type) return false;
  if (left.type !== 'record-details' || right.type !== 'record-details') {
    return true;
  }
  return left.recordId === right.recordId && left.relation === right.relation;
}

/** Browse-specific location-state schema and equality for the shared controller. */
export const browseOverlayOptions: RouteOverlayOptions<BrowseOverlay> = {
  stateKey: 'browseOverlay',
  parse: parseBrowseOverlay,
  same: sameOverlay,
};
