/** Player-facing sort options for Items Browse. */
import type { BrowseSortOption } from '@mapletip/component-library';

import { SCROLL_STAT_ORDER } from './labels';
import type { ItemRow } from './project';

export const ITEM_SORT_OPTIONS = [
  { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
  { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
] as const satisfies readonly BrowseSortOption[];

const STAT_PRIORITY_MULTIPLIER = 10_000;

/** Sort scrolls by player-priority stat, then by that stat's signed delta. */
export function computeScrollStatsSortValue(row: ItemRow): number | undefined {
  if (!row.stats) return undefined;

  let priority = SCROLL_STAT_ORDER.length;
  for (const stat of SCROLL_STAT_ORDER) {
    const delta = row.stats[stat];
    if (delta !== undefined && delta !== null) {
      return priority * STAT_PRIORITY_MULTIPLIER + delta;
    }
    priority -= 1;
  }
  return undefined;
}
