/**
 * Sort options and default sort for Items Browse.
 */
import { SCROLL_STAT_ORDER } from './labels';
import type { ItemRow } from './project';

export const DEFAULT_ITEM_SORT = {
  field: 'name',
  direction: 'asc',
} as const;

/**
 * In MapleStory (GMS v83 / Classic World), the largest single scroll delta is +140
 * (e.g. Max HP/MP deltas). A multiplier of 10,000 strictly exceeds 140, guaranteeing
 * that higher-priority stats (e.g. Weapon ATT over Magic ATT) always sort above
 * lower-priority stats regardless of delta amount, while deltas within the same stat
 * priority group sort predictably by amount.
 */
export const STAT_PRIORITY_MULTIPLIER = 10_000;

/**
 * Client-side query-field accessor computing a numeric sort score for scroll stats.
 * Uses stat priority order followed by delta amount. Missing/empty stats return undefined
 * so they sort last in both directions.
 */
export function computeScrollStatsSortValue(row: ItemRow): number | undefined {
  const stats = row.stats;
  if (!stats) return undefined;
  let priority = SCROLL_STAT_ORDER.length;
  for (const key of SCROLL_STAT_ORDER) {
    const delta = stats[key];
    if (delta !== undefined && delta !== null) {
      return priority * STAT_PRIORITY_MULTIPLIER + delta;
    }
    priority -= 1;
  }
  return undefined;
}
