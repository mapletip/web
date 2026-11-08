/** Player-facing sort options for Items Browse. */
import type { BrowseSortOption } from '@mapletip/component-library';

export const ITEM_SORT_OPTIONS = [
  { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
  { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
] as const satisfies readonly BrowseSortOption[];
