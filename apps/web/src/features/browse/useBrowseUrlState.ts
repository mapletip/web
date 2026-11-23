import { useDebouncedCallback } from '@mantine/hooks';
import type {
  BrowseSortOption,
  BrowseState,
  StateChangeDetails,
} from '@mapletip/component-library';
import { useCallback, useMemo, useState } from 'react';

import type { BrowseSearch, BrowseSearchDefinition } from './search-params';

export interface OnSearchChangeOptions {
  readonly search: BrowseSearch;
  readonly replace: boolean;
}

export interface UseBrowseUrlStateOptions {
  readonly search: BrowseSearch;
  readonly onSearchChange: (
    options: OnSearchChangeOptions,
  ) => void | Promise<void>;
  /** The page's address definition from `defineBrowseSearch`. */
  readonly address: BrowseSearchDefinition;
  /** Sort options of the current context; defaults to the page's. */
  readonly sortOptions?: readonly BrowseSortOption[] | undefined;
  /** Table context whose column visibility is remembered separately. */
  readonly contextKey?: string;
  readonly defaultHiddenColumns?: readonly string[];
}

export interface UseBrowseUrlStateResult {
  readonly browseState: BrowseState;
  readonly handleStateChange: (
    nextState: BrowseState,
    details?: StateChangeDetails,
  ) => void | Promise<void>;
}

const SEARCH_DEBOUNCE_MS = 150;
const NO_HIDDEN_COLUMNS: readonly string[] = [];

/** Keeps FacetedBrowser state synchronized with typed route search params. */
export function useBrowseUrlState({
  search,
  onSearchChange,
  address,
  sortOptions,
  contextKey = 'default',
  defaultHiddenColumns = NO_HIDDEN_COLUMNS,
}: UseBrowseUrlStateOptions): UseBrowseUrlStateResult {
  const urlState = useMemo(
    () => address.urlToBrowseState({ search, sortOptions }),
    [address, search, sortOptions],
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
    (nextSearch: BrowseSearch) => {
      void onSearchChange({ search: nextSearch, replace: true });
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
      const nextSearch = address.browseStateToUrl({
        state: nextState,
        sortOptions,
      });

      if (searchChanged) {
        setLocalSearchState({
          urlSearch: urlState.search,
          value: nextState.search,
        });
        emitDebouncedSearchChange(nextSearch);
        return;
      }

      emitDebouncedSearchChange.cancel();
      return onSearchChange({
        search: nextSearch,
        replace: details?.reason === 'clamp' || details?.reason === 'apply',
      });
    },
    [
      address,
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
