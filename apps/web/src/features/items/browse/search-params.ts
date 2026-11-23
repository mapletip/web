/** Items Browse address: the shared browse search with Items' sorts. */
import {
  defineBrowseSearch,
  type BrowseSearch,
} from '@/features/browse/search-params';

import { ITEM_SORT_OPTIONS } from './sort';

export { PAGE_SIZE_OPTIONS } from '@/features/browse/search-params';

export const itemBrowseSearch = defineBrowseSearch({
  sortOptions: ITEM_SORT_OPTIONS,
});

/** Standard Schema validator for the Items Browse route's search params. */
export const itemBrowseSearchSchema = itemBrowseSearch.schema;
export const ITEM_BROWSE_DEFAULT_SEARCH = itemBrowseSearch.defaultSearch;
export const ITEM_BROWSE_DEFAULT_STATE = itemBrowseSearch.defaultState;
export const { urlToBrowseState, browseStateToUrl } = itemBrowseSearch;

export type ItemBrowseSearch = BrowseSearch;
