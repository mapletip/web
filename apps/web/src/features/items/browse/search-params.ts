/** Items Browse address: the shared browse search with Items' sorts. */
import { defineBrowseSearch } from '@/features/browse/search-params';

export const ITEM_SORT_OPTIONS = [
  { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
  { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
] as const;

export const itemBrowseSearch = defineBrowseSearch({
  sortOptions: ITEM_SORT_OPTIONS,
});
