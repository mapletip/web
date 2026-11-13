import { useLocation, useRouter } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

/** Transient browse UI represented in TanStack Router location state. */
export type BrowseOverlay =
  | { readonly type: 'filters' }
  | { readonly type: 'navigation' }
  | { readonly type: 'record-details'; readonly recordId: string };

interface OverlayLocationState {
  readonly browseOverlay?: unknown;
}

function parseBrowseOverlay(state: unknown): BrowseOverlay | undefined {
  if (state === null || typeof state !== 'object') return undefined;
  const overlay = (state as OverlayLocationState).browseOverlay;
  if (overlay === null || typeof overlay !== 'object') return undefined;
  const candidate = overlay as {
    readonly type?: unknown;
    readonly recordId?: unknown;
  };
  if (candidate.type === 'filters' || candidate.type === 'navigation') {
    return { type: candidate.type };
  }
  if (
    candidate.type === 'record-details' &&
    typeof candidate.recordId === 'string'
  ) {
    return { type: 'record-details', recordId: candidate.recordId };
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
  return left.recordId === right.recordId;
}

/**
 * Owns the single transient overlay entry for a browse route. Opening pushes
 * one same-URL entry; Back removes it; dismissing consumes it without leaving
 * a ghost entry. The Component Library never sees router state or history.
 */
export function useBrowseOverlay(): {
  readonly overlay: BrowseOverlay | undefined;
  readonly open: (overlay: BrowseOverlay) => void;
  readonly dismiss: (type: BrowseOverlay['type']) => void;
  readonly invalidate: (type: BrowseOverlay['type']) => void;
} {
  const router = useRouter();
  const location = useLocation();
  const overlay = useMemo(
    () => parseBrowseOverlay(location.state),
    [location.state],
  );

  const open = useCallback(
    (next: BrowseOverlay) => {
      const current = parseBrowseOverlay(router.state.location.state);
      if (sameOverlay(current, next)) return;
      void router.navigate({
        to: '.',
        search: true,
        hash: true,
        replace: current !== undefined,
        state: (previous) => ({ ...previous, browseOverlay: next }),
      });
    },
    [router],
  );

  const dismiss = useCallback(
    (type: BrowseOverlay['type']) => {
      const current = parseBrowseOverlay(router.state.location.state);
      if (current?.type !== type) return;
      router.history.back();
    },
    [router],
  );

  const invalidate = useCallback(
    (type: BrowseOverlay['type']) => {
      const current = parseBrowseOverlay(router.state.location.state);
      if (current?.type !== type) return;
      void router.navigate({
        to: '.',
        search: true,
        hash: true,
        replace: true,
        state: (previous) => {
          const nextState = { ...previous } as typeof previous & {
            browseOverlay?: unknown;
          };
          delete nextState.browseOverlay;
          return nextState;
        },
      });
    },
    [router],
  );

  return { overlay, open, dismiss, invalidate };
}
