import { useHydrated, useLocation, useRouter } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

export interface RouteOverlayState {
  readonly type: string;
}

export interface RouteOverlayOptions<T extends RouteOverlayState> {
  /** State field kept private to the route feature. */
  readonly stateKey: string;
  readonly parse: (value: unknown) => T | undefined;
  readonly same: (left: T | undefined, right: T) => boolean;
}

export interface RouteOverlayController<T extends RouteOverlayState> {
  readonly overlay: T | undefined;
  readonly open: (overlay: T) => void;
  readonly dismiss: (type: T['type']) => void;
  readonly release: (type: T['type']) => Promise<void>;
  readonly invalidate: (type: T['type']) => Promise<void>;
  readonly apply: (
    type: T['type'],
    commit: () => void | Promise<void>,
  ) => Promise<void>;
}

/**
 * Owns one transient route overlay entry without exposing router state to UI
 * components. Opening pushes a same-URL entry; Back closes it, and dismissal
 * consumes that entry while preserving the route's search, hash and scroll.
 */
export function useRouteOverlay<T extends RouteOverlayState>(
  options: RouteOverlayOptions<T>,
): RouteOverlayController<T> {
  const { stateKey, parse, same } = options;
  const router = useRouter();
  const location = useLocation();
  const hydrated = useHydrated();
  const readOverlay = useCallback(
    (state: unknown): T | undefined => {
      if (state === null || typeof state !== 'object') return undefined;
      return parse((state as Record<string, unknown>)[stateKey]);
    },
    [parse, stateKey],
  );

  // Browser history state is unavailable to the server renderer. Keep the
  // first client render closed too, then restore a persisted overlay once the
  // router has hydrated.
  const overlay = hydrated ? readOverlay(location.state) : undefined;

  const open = useCallback(
    (next: T) => {
      const current = readOverlay(router.state.location.state);
      if (same(current, next)) return;
      void router.navigate({
        to: '.',
        search: true,
        hash: true,
        replace: current !== undefined,
        resetScroll: false,
        hashScrollIntoView: false,
        state: (previous) => ({ ...previous, [stateKey]: next }),
      });
    },
    [readOverlay, router, same, stateKey],
  );

  const dismiss = useCallback(
    (type: T['type']) => {
      const current = readOverlay(router.state.location.state);
      if (current?.type !== type) return;
      router.history.back();
    },
    [readOverlay, router],
  );

  const release = useCallback(
    async (type: T['type']) => {
      const current = readOverlay(router.state.location.state);
      if (current?.type !== type) return;

      await router.navigate({
        to: '.',
        search: true,
        hash: true,
        replace: true,
        resetScroll: false,
        hashScrollIntoView: false,
        state: (previous) => {
          if (previous === null || typeof previous !== 'object') return {};
          const nextState = { ...previous } as Record<string, unknown>;
          delete nextState[stateKey];
          return nextState;
        },
      });
    },
    [readOverlay, router, stateKey],
  );

  const invalidate = useCallback(
    async (type: T['type']) => {
      const current = readOverlay(router.state.location.state);
      if (current?.type !== type) return;

      const expectedHref = router.state.location.href;

      // Browser history cannot delete a Forward entry. Neutralize this
      // overlay before going back so Forward returns to a closed route.
      await release(type);

      if (
        readOverlay(router.state.location.state) === undefined &&
        router.state.location.href === expectedHref
      ) {
        router.history.back();
      }
    },
    [readOverlay, release, router],
  );

  const apply = useCallback(
    async (type: T['type'], commit: () => void | Promise<void>) => {
      const current = readOverlay(router.state.location.state);
      if (current?.type !== type) return;

      await commit();

      if (readOverlay(router.state.location.state)?.type === type) {
        router.history.back();
      }
    },
    [readOverlay, router],
  );

  return useMemo(
    () => ({ overlay, open, dismiss, release, invalidate, apply }),
    [overlay, open, dismiss, release, invalidate, apply],
  );
}
