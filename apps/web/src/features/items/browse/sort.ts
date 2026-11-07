/**
 * Sort options and default sort for Items Browse.
 */
import type { BrowseSortOption } from '@mapletip/component-library';

export const ITEM_SORT_OPTIONS: readonly BrowseSortOption[] = [
  { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
  { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
  { label: 'ID', field: 'sourceId', direction: 'asc' },
  { label: 'ID (Z–A)', field: 'sourceId', direction: 'desc' },
];

export const DEFAULT_ITEM_SORT = {
  field: 'name',
  direction: 'asc',
} as const;
