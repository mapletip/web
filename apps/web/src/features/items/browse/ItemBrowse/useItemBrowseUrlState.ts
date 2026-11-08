import { useDebouncedCallback } from '@mantine/hooks';
import type {
  BrowseState,
  FacetDefinition,
  StateChangeDetails,
} from '@mapletip/component-library';
import { useCallback, useMemo, useState } from 'react';

import type { ItemRow } from '../project';
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
  readonly facets: readonly FacetDefinition<ItemRow>[];
  readonly onSearchChange: (options: OnSearchChangeOptions) => void;
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
  facets,
  onSearchChange,
}: UseItemBrowseUrlStateOptions): UseItemBrowseUrlStateResult {
  const urlState = useMemo(
    () => urlToBrowseState({ search, facets }),
    [facets, search],
  );
  const [localSearchState, setLocalSearchState] = useState(() => ({
    urlSearch: urlState.search,
    value: urlState.search,
  }));
  const [hiddenColumns, setHiddenColumns] = useState<readonly string[]>([]);
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
      setHiddenColumns(nextState.hiddenColumns);
      const searchChanged = nextState.search !== localSearch;
      const nextSearch = browseStateToUrl({ state: nextState, facets });

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
      emitDebouncedSearchChange,
      facets,
      localSearch,
      onSearchChange,
      urlState.search,
    ],
  );

  return { browseState, handleStateChange };
}
