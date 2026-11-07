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

export function useItemBrowseUrlState({
  searchProp,
  browseContext,
  onSearchChange,
}: UseItemBrowseUrlStateOptions): UseItemBrowseUrlStateResult {
  const router = useRouter();
  const urlSearch = useMemo(() => searchProp ?? {}, [searchProp]);

  const urlDerivedState = useMemo(
    () => urlToBrowseState(urlSearch, browseContext),
    [urlSearch, browseContext],
  );

  const [prevUrlSearch, setPrevUrlSearch] = useState(urlDerivedState.search);
  const [localSearch, setLocalSearch] = useState(urlDerivedState.search);
  const [hiddenColumns, setHiddenColumns] = useState<readonly string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  if (prevUrlSearch !== urlDerivedState.search) {
    setPrevUrlSearch(urlDerivedState.search);
    setLocalSearch(urlDerivedState.search);
  }

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
      search: localSearch,
      hiddenColumns,
    }),
    [urlDerivedState, localSearch, hiddenColumns],
  );

  const handleStateChange = useCallback(
    (nextState: BrowseState, details?: StateChangeDetails) => {
      if (nextState.hiddenColumns !== hiddenColumns) {
        setHiddenColumns(nextState.hiddenColumns);
      }

      const searchChanged = nextState.search !== localSearch;
      if (searchChanged) {
        setLocalSearch(nextState.search);
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
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
    [browseContext, hiddenColumns, localSearch, onSearchChange],
  );

  const getPageHref = useCallback(
    (_page: number, nextState: BrowseState): string => {
      const nextSearch = browseStateToUrl(nextState, browseContext);
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
