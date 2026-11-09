/**
 * Pure formatters and scope label mapping for Items Browse column values.
 */
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import { ITEM_SCOPES } from '../categories';
import {
  ITEM_FUNCTION_LABELS,
  ITEM_TYPE_LABELS,
  SCROLL_STAT_LABELS,
  SCROLL_STAT_ORDER,
  UPGRADE_SPECIAL_LABELS,
  UPGRADE_TARGET_LABELS,
  UPGRADE_TIER_LABELS,
} from '../labels';
import type {
  ItemBrowseClass,
  ItemBrowseUpgradeTarget,
  ItemBrowseUpgradeTier,
  ItemRow,
} from '../project';

export type ItemBrowseCoverageState = ItemBrowseCoverage['scrollTier'];

const LIST_VALUE_SEPARATOR = '\n';

export const SCOPE_LABELS: Readonly<Record<ItemBrowseClass, string>> = {
  consume: ITEM_SCOPES.use.label,
  etc: ITEM_SCOPES.etc.label,
  setup: ITEM_SCOPES.setup.label,
  cash: ITEM_SCOPES.cash.label,
  pet: ITEM_SCOPES.cash.label,
};

export function formatRelCount(
  count: number | undefined,
  state: ItemBrowseCoverageState,
): string | undefined {
  if (state === 'unsupported') return undefined;
  if (state === 'complete') return String(count ?? 0);
  return count !== undefined ? String(count) : 'None recorded';
}

export function formatStats(stats: ItemRow['stats']): string | undefined {
  if (!stats) return undefined;
  const parts: string[] = [];
  for (const key of SCROLL_STAT_ORDER) {
    const value = stats[key];
    if (value !== undefined && value !== null) {
      const label = SCROLL_STAT_LABELS[key] ?? key;
      const signed = value >= 0 ? `+${value}` : `${value}`;
      parts.push(`${label} ${signed}`);
    }
  }
  return parts.length > 0 ? parts.join(LIST_VALUE_SEPARATOR) : undefined;
}

export function formatPets(row: ItemRow): string | undefined {
  const named =
    row.petTargets?.map((target) => target.name ?? target.key) ?? [];
  const unresolved =
    row.unresolvedPetTargets?.map((targetId) => `Unresolved ${targetId}`) ?? [];
  const all = [...named, ...unresolved];
  return all.length > 0 ? all.join(LIST_VALUE_SEPARATOR) : undefined;
}

export function formatList(
  items: readonly string[] | undefined,
  labels: Readonly<Record<string, string>>,
): string | undefined {
  if (!items || items.length === 0) return undefined;
  return items.map((item) => labels[item] ?? item).join(LIST_VALUE_SEPARATOR);
}

export const formatTypes = (row: ItemRow) =>
  formatList(row.types, ITEM_TYPE_LABELS);

export const formatFunctions = (row: ItemRow) =>
  formatList(row.functions, ITEM_FUNCTION_LABELS);

export const formatSpecials = (row: ItemRow) =>
  formatList(row.specials, UPGRADE_SPECIAL_LABELS);

export function formatTargetLabel(
  targetLabel: ItemBrowseUpgradeTarget | undefined,
): string | undefined {
  if (!targetLabel) return undefined;
  return UPGRADE_TARGET_LABELS[targetLabel] ?? targetLabel;
}

export function formatTier(
  tier: ItemBrowseUpgradeTier | undefined,
  coverage: ItemBrowseCoverage,
): string | undefined {
  if (coverage.scrollTier === 'unsupported' || !tier) return undefined;
  return UPGRADE_TIER_LABELS[tier] ?? tier;
}

export function formatSuccess(success: number | undefined): string | undefined {
  if (success === undefined) return undefined;
  return `${success}%`;
}

export function formatCursed(cursed: number | undefined): string | undefined {
  if (cursed === undefined) return '-';
  return `${cursed}% on failure`;
}

export function formatNum(
  value: number | undefined,
  unit = '',
): string | undefined {
  if (value === undefined) return undefined;
  return `${value.toLocaleString('en-US')}${unit}`;
}

export function formatAttackValue(attack: number): string {
  return attack >= 0 ? `+${attack}` : String(attack);
}

export function formatAttack(attack: number | undefined): string | undefined {
  if (attack === undefined) return undefined;
  return formatAttackValue(attack);
}

export function formatKind(itemClass: ItemBrowseClass): string | undefined {
  if (itemClass === 'pet') return 'Pet';
  if (itemClass === 'cash') return 'Cash Item';
  return undefined;
}

export function formatQuestFlag(flag: boolean | undefined): string | undefined {
  if (flag === true) return 'Yes';
  if (flag === false) return 'No';
  return undefined;
}
