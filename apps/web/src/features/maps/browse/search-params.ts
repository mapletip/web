/** Map Browse address: the shared browse search with Map Browse's sorts. */
import { defineBrowseSearch } from '@/features/browse/search-params';

import { MAP_SORT_OPTIONS } from './facets';

export const mapBrowseSearch = defineBrowseSearch({
  sortOptions: MAP_SORT_OPTIONS,
});
