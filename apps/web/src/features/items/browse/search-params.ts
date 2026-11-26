/** Items Browse address: the shared browse search with Items' sorts. */
import { defineBrowseSearch } from '@/features/browse/search-params';

import { ITEM_KINDS } from '../kinds';
import type { ItemKind } from '../kinds/types';

export const ITEM_SORT_OPTIONS = [
  { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
  { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
] as const;

export const itemBrowseSearch = defineBrowseSearch({
  sortOptions: [
    ...ITEM_SORT_OPTIONS,
    ...ITEM_KINDS.flatMap((kind: ItemKind) => kind.card?.sortOptions ?? []),
  ],
});
