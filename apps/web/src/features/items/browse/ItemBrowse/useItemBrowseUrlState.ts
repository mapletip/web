import type {
  BrowseState,
  StateChangeDetails,
} from '@mapletip/component-library';
import { useRouter } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  browseStateToUrl,
  urlToBrowseState,
  type BrowseContext,
  type ItemBrowseSearch,
} from '../search-params';

export interface UseItemBrowseUrlStateOptions {
  readonly searchProp?: ItemBrowseSearch | undefined;
  readonly browseContext: BrowseContext;
  readonly stateResetKey: string;
  readonly onSearchChange?:
    | ((nextSearch: Record<string, unknown>, replace: boolean) => void)
    | undefined;
}

export interface UseItemBrowseUrlStateResult {
  readonly browseState: BrowseState;
  readonly localSearch: string;
  readonly urlSearch: ItemBrowseSearch;
  readonly handleStateChange: (
    nextState: BrowseState,
    details?: StateChangeDetails,
  ) => void;
  readonly getPageHref: (page: number, nextState: BrowseState) => string;
}

const SEARCH_DEBOUNCE_MS = 150;
const EMPTY_HIDDEN_COLUMNS: readonly string[] = [];

export function useItemBrowseUrlState({
  searchProp,
  browseContext,
  stateResetKey,
  onSearchChange,
}: UseItemBrowseUrlStateOptions): UseItemBrowseUrlStateResult {
  const router = useRouter();
  const urlSearch = useMemo(() => searchProp ?? {}, [searchProp]);

  const urlDerivedState = useMemo(
    () => urlToBrowseState(urlSearch, browseContext),
    [urlSearch, browseContext],
  );

  const defaultHidden =
    browseContext.defaultHiddenColumns ?? EMPTY_HIDDEN_COLUMNS;
  const [prevDefaultHidden, setPrevDefaultHidden] = useState(defaultHidden);
  const [hiddenColumns, setHiddenColumns] =
    useState<readonly string[]>(defaultHidden);

  if (prevDefaultHidden !== defaultHidden) {
    setPrevDefaultHidden(defaultHidden);
    setHiddenColumns(defaultHidden);
  }

  const syncKey = JSON.stringify([stateResetKey, urlSearch]);
  const syncKeyRef = useRef(syncKey);
  const [pendingBrowseState, setPendingBrowseState] = useState<
    { readonly syncKey: string; readonly state: BrowseState } | undefined
  >(undefined);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    syncKeyRef.current = syncKey;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
  }, [syncKey]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const browseState = useMemo<BrowseState>(
    () => ({
      ...urlDerivedState,
      ...(pendingBrowseState?.syncKey === syncKey
        ? pendingBrowseState.state
        : {}),
      hiddenColumns,
    }),
    [urlDerivedState, pendingBrowseState, syncKey, hiddenColumns],
  );
  const localSearch = browseState.search;

  const handleStateChange = useCallback(
    (nextState: BrowseState, details?: StateChangeDetails) => {
      setPendingBrowseState({ syncKey, state: nextState });
      if (nextState.hiddenColumns !== hiddenColumns) {
        setHiddenColumns(nextState.hiddenColumns);
      }

      const searchChanged = nextState.search !== browseState.search;
      if (searchChanged) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        const scheduledSyncKey = syncKey;
        debounceRef.current = setTimeout(() => {
          debounceRef.current = undefined;
          if (syncKeyRef.current !== scheduledSyncKey) return;
          const nextUrl = browseStateToUrl(nextState, browseContext);
          onSearchChange?.(nextUrl, true);
        }, SEARCH_DEBOUNCE_MS);
      } else {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        const nextUrl = browseStateToUrl(nextState, browseContext);
        const shouldReplace = details?.reason === 'clamp';
        onSearchChange?.(nextUrl, shouldReplace);
      }
    },
    [browseContext, browseState, hiddenColumns, onSearchChange, syncKey],
  );

  const getPageHref = useCallback(
    (page: number, nextState: BrowseState): string => {
      const nextSearch = browseStateToUrl(
        { ...nextState, page },
        browseContext,
      );
      return router.buildLocation({
        to: '.',
        search: nextSearch,
      }).href;
    },
    [browseContext, router],
  );

  return {
    browseState,
    localSearch,
    urlSearch,
    handleStateChange,
    getPageHref,
  };
}
