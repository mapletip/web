import { useDebouncedCallback } from '@mantine/hooks';
import type {
  BrowseState,
  BrowseSortOption,
  StateChangeDetails,
} from '@mapletip/component-library';
import { useCallback, useMemo, useState } from 'react';

import {
  browseStateToUrl,
  urlToBrowseState,
  type ItemBrowseSearch,
} from '../search-params';

export interface OnSearchChangeOptions {
  readonly search: ItemBrowseSearch;
  readonly replace: boolean;
}

export interface UseItemBrowseUrlStateOptions {
  readonly search: ItemBrowseSearch;
  readonly onSearchChange: (options: OnSearchChangeOptions) => void;
  readonly contextKey: string;
  readonly defaultHiddenColumns: readonly string[];
  readonly sortOptions: readonly BrowseSortOption[];
}

export interface UseItemBrowseUrlStateResult {
  readonly browseState: BrowseState;
  readonly handleStateChange: (
    nextState: BrowseState,
    details?: StateChangeDetails,
  ) => void;
}

const SEARCH_DEBOUNCE_MS = 150;

/** Keeps FacetedBrowser state synchronized with typed route search params. */
export function useItemBrowseUrlState({
  search,
  onSearchChange,
  contextKey,
  defaultHiddenColumns,
  sortOptions,
}: UseItemBrowseUrlStateOptions): UseItemBrowseUrlStateResult {
  const urlState = useMemo(
    () => urlToBrowseState({ search, sortOptions }),
    [search, sortOptions],
  );
  const [localSearchState, setLocalSearchState] = useState(() => ({
    urlSearch: urlState.search,
    value: urlState.search,
  }));
  const [hiddenColumnsByContext, setHiddenColumnsByContext] = useState<
    Readonly<Record<string, readonly string[]>>
  >(() => ({ [contextKey]: defaultHiddenColumns }));
  const hiddenColumns =
    hiddenColumnsByContext[contextKey] ?? defaultHiddenColumns;
  const localSearch =
    localSearchState.urlSearch === urlState.search
      ? localSearchState.value
      : urlState.search;

  const emitDebouncedSearchChange = useDebouncedCallback(
    (nextSearch: ItemBrowseSearch) => {
      onSearchChange({ search: nextSearch, replace: true });
    },
    { delay: SEARCH_DEBOUNCE_MS },
  );

  const browseState = useMemo(
    () => ({ ...urlState, search: localSearch, hiddenColumns }),
    [hiddenColumns, localSearch, urlState],
  );

  const handleStateChange = useCallback(
    (nextState: BrowseState, details?: StateChangeDetails) => {
      setHiddenColumnsByContext((previous) => ({
        ...previous,
        [contextKey]: nextState.hiddenColumns,
      }));
      const searchChanged = nextState.search !== localSearch;
      const nextSearch = browseStateToUrl({ state: nextState, sortOptions });

      if (searchChanged) {
        setLocalSearchState({
          urlSearch: urlState.search,
          value: nextState.search,
        });
        emitDebouncedSearchChange(nextSearch);
        return;
      }

      emitDebouncedSearchChange.cancel();
      onSearchChange({
        search: nextSearch,
        replace: details?.reason === 'clamp',
      });
    },
    [
      contextKey,
      emitDebouncedSearchChange,
      localSearch,
      onSearchChange,
      sortOptions,
      urlState.search,
    ],
  );

  return { browseState, handleStateChange };
}
