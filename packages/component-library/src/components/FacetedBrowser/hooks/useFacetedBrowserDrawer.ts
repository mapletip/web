import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  EMPTY_FILTERS,
  browseStatesEqual,
  filtersEqual,
  normalizeFilters,
  withFilterValue,
  type BrowseState,
} from './browseState';
import type { FacetFilterValue } from './filterTypes';

export interface DraftEvaluation {
  readonly matchingCount: number;
  readonly matchingRecords: readonly unknown[];
  readonly getFacetValues: (field: string) => Map<string, number>;
}

interface DraftSession {
  readonly baseState: BrowseState;
  readonly filters: Record<string, FacetFilterValue>;
}

export interface UseFacetedBrowserDrawerOptions {
  readonly opened: boolean;
  readonly onOpenedChange: (opened: boolean) => void;
  readonly committedState: BrowseState;
  readonly statusActive: boolean;
  readonly filterIsInvalid: (
    filters: Readonly<Record<string, FacetFilterValue>>,
  ) => boolean;
  readonly evaluateDraft: (
    filters: Record<string, FacetFilterValue>,
  ) => DraftEvaluation;
  readonly commitFilters: (filters: Record<string, FacetFilterValue>) => void;
}

function snapshotState(state: BrowseState): BrowseState {
  return {
    search: state.search,
    filters: normalizeFilters(state.filters),
    page: state.page,
    pageSize: state.pageSize,
    hiddenColumns: [...state.hiddenColumns],
    ...(state.sort ? { sort: { ...state.sort } } : {}),
  };
}

function createSession(state: BrowseState): DraftSession {
  const baseState = snapshotState(state);
  return { baseState, filters: { ...baseState.filters } };
}

export interface UseFacetedBrowserDrawerReturn {
  readonly opened: boolean;
  readonly draftFilters: Record<string, FacetFilterValue>;
  readonly focusedFacetId: string | null;
  readonly pendingCount: number | undefined;
  readonly invalidDraft: boolean;
  readonly getDraftFacetValues: (field: string) => ReadonlyMap<string, number>;
  readonly open: (facetId: string | null) => void;
  readonly close: () => void;
  readonly backToOverview: () => void;
  readonly reset: () => void;
  readonly apply: () => void;
  readonly setValue: (field: string, value: FacetFilterValue) => void;
}

/** Owns the transient drawer draft, its evaluation and stale-session dismissal. */
export function useFacetedBrowserDrawer({
  opened,
  onOpenedChange,
  committedState,
  statusActive,
  filterIsInvalid,
  evaluateDraft,
  commitFilters,
}: UseFacetedBrowserDrawerOptions): UseFacetedBrowserDrawerReturn {
  const [session, setSession] = useState<DraftSession | null>(() =>
    opened ? createSession(committedState) : null,
  );
  const sessionRef = useRef<DraftSession | null>(session);
  const openedRef = useRef(opened);
  const [focusedFacetId, setFocusedFacetId] = useState<string | null>(null);

  const replaceSession = useCallback((next: DraftSession | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  // A host may restore committed state while the drawer is open. The draft is
  // derived as closed before the host's close callback lands, so it can never
  // be applied against the new state. A closed drawer's session is discarded
  // lazily by the next open event.
  const activeSession = useMemo(
    () => session ?? (opened ? createSession(committedState) : null),
    [committedState, opened, session],
  );
  const sessionMatches =
    activeSession === null ||
    browseStatesEqual(activeSession.baseState, committedState);
  const effectiveOpened = opened && sessionMatches;
  const draftFilters =
    activeSession !== null && sessionMatches
      ? activeSession.filters
      : EMPTY_FILTERS;

  const resetSession = useCallback(() => {
    replaceSession(null);
    setFocusedFacetId(null);
  }, [replaceSession]);

  // Drawer visibility can be controlled externally (for example by browser
  // Back). Keep the draft session synchronized with that prop, not with a
  // local event that may not exist.
  /* eslint-disable react-hooks/set-state-in-effect -- external drawer prop sync */
  useEffect(() => {
    if (!opened) {
      openedRef.current = false;
      resetSession();
      return;
    }
    if (session === null) {
      openedRef.current = true;
      replaceSession(createSession(committedState));
      return;
    }
    openedRef.current = sessionMatches;
    if (!sessionMatches) onOpenedChange(false);
  }, [
    committedState,
    onOpenedChange,
    opened,
    replaceSession,
    resetSession,
    session,
    sessionMatches,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const draftEvaluation = useMemo(() => {
    if (!effectiveOpened || statusActive || activeSession === null) {
      return undefined;
    }
    return evaluateDraft(activeSession.filters);
  }, [activeSession, effectiveOpened, evaluateDraft, statusActive]);

  const invalidDraft = filterIsInvalid(draftFilters);

  const updateSession = useCallback(
    (nextFilters: Record<string, FacetFilterValue>) => {
      if (!openedRef.current) return;
      const base = sessionRef.current ?? createSession(committedState);
      replaceSession(
        filtersEqual(nextFilters, base.filters)
          ? base
          : { ...base, filters: nextFilters },
      );
    },
    [committedState, replaceSession],
  );

  const open = useCallback(
    (facetId: string | null) => {
      openedRef.current = true;
      replaceSession(createSession(committedState));
      setFocusedFacetId(facetId);
      onOpenedChange(true);
    },
    [committedState, onOpenedChange, replaceSession],
  );

  const close = useCallback(() => {
    openedRef.current = false;
    replaceSession(null);
    setFocusedFacetId(null);
    onOpenedChange(false);
  }, [onOpenedChange, replaceSession]);

  const apply = useCallback(() => {
    const currentSession = sessionRef.current;
    if (
      !openedRef.current ||
      currentSession === null ||
      !browseStatesEqual(currentSession.baseState, committedState) ||
      filterIsInvalid(currentSession.filters)
    ) {
      return;
    }
    openedRef.current = false;
    commitFilters(currentSession.filters);
    replaceSession(null);
    setFocusedFacetId(null);
    onOpenedChange(false);
  }, [
    commitFilters,
    committedState,
    filterIsInvalid,
    onOpenedChange,
    replaceSession,
  ]);

  const setValue = useCallback(
    (field: string, value: FacetFilterValue) => {
      if (!openedRef.current) return;
      const base = sessionRef.current ?? createSession(committedState);
      const filters = withFilterValue(base.filters, field, value);
      replaceSession(
        filtersEqual(filters, base.filters) ? base : { ...base, filters },
      );
    },
    [committedState, replaceSession],
  );

  const getDraftFacetValues = useCallback(
    (field: string) =>
      draftEvaluation?.getFacetValues(field) ?? new Map<string, number>(),
    [draftEvaluation],
  );

  const reset = useCallback(() => updateSession({}), [updateSession]);
  const backToOverview = useCallback(() => setFocusedFacetId(null), []);

  return {
    opened: effectiveOpened,
    draftFilters,
    focusedFacetId,
    pendingCount: draftEvaluation?.matchingCount,
    invalidDraft,
    getDraftFacetValues,
    open,
    close,
    backToOverview,
    reset,
    apply,
    setValue,
  };
}
