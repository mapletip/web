/**
 * Column configuration table and context sets for Items Browse.
 *
 * Each column defines its key, title, presentation flags, and a pure string projection.
 */
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import { ITEM_SCOPES } from './categories';
import {
  ITEM_FUNCTION_LABELS,
  ITEM_TYPE_LABELS,
  SCROLL_STAT_LABELS,
  SCROLL_STAT_ORDER,
  UPGRADE_SPECIAL_LABELS,
  UPGRADE_TARGET_LABELS,
  UPGRADE_TIER_LABELS,
} from './labels';
import type { ItemBrowseClass, ItemRow } from './project';

export type ItemBrowseCoverageState = ItemBrowseCoverage['scrollTier'];

export interface ColumnConfig {
  readonly key: string;
  readonly title: string;
  readonly fullLabel?: string;
  readonly width?: number;
  readonly numeric?: boolean;
  readonly sortable?: boolean;
  readonly firstSortDirection?: 'asc' | 'desc';
  readonly value: (
    row: ItemRow,
    coverage: ItemBrowseCoverage,
  ) => string | undefined;
}

export const SCOPE_LABELS: Readonly<Record<ItemBrowseClass, string>> = {
  consume: ITEM_SCOPES.use.label,
  etc: ITEM_SCOPES.etc.label,
  setup: ITEM_SCOPES.setup.label,
  cash: ITEM_SCOPES.cash.label,
  pet: ITEM_SCOPES.cash.label,
};

function formatRelCount(
  count: number | undefined,
  state: ItemBrowseCoverageState,
): string {
  if (state === 'unsupported') return 'Unavailable';
  if (state === 'complete') return String(count ?? 0);
  return count ? `${count}+` : 'None recorded';
}

function formatStats(stats: ItemRow['stats']): string | undefined {
  if (!stats) return undefined;
  const parts = SCROLL_STAT_ORDER.filter(
    (key) => stats[key] !== undefined && stats[key] !== null,
  ).map(
    (key) =>
      `${SCROLL_STAT_LABELS[key] ?? key} ${stats[key]! >= 0 ? `+${stats[key]}` : stats[key]}`,
  );
  return parts.length > 0 ? parts.join(', ') : undefined;
}

function formatPets(row: ItemRow): string | undefined {
  const named =
    row.petTargets?.map((target) => target.name ?? target.key) ?? [];
  const unresolved =
    row.unresolvedPetTargets?.map((targetId) => `Unresolved ${targetId}`) ?? [];
  const all = [...named, ...unresolved];
  return all.length > 0 ? all.join(', ') : undefined;
}

const formatList = (
  items: readonly string[] | undefined,
  labels: Readonly<Record<string, string>>,
) =>
  items && items.length > 0
    ? items.map((item) => labels[item] ?? item).join(', ')
    : undefined;

const formatNum = (value: number | undefined, unit = '') =>
  value !== undefined ? `${value.toLocaleString('en-US')}${unit}` : undefined;

function formatAttack(attack: number | undefined): string | undefined {
  if (attack === undefined) return undefined;
  return attack > 0 ? `+${attack}` : String(attack);
}

function formatKind(itemClass: ItemBrowseClass): string | undefined {
  if (itemClass === 'pet') return 'Pet';
  if (itemClass === 'cash') return 'Cash Item';
  return undefined;
}

function formatQuestFlag(flag: boolean | undefined): string | undefined {
  if (flag === true) return 'Yes';
  if (flag === false) return 'No';
  return undefined;
}

export const COLUMNS = {
  name: {
    key: 'name',
    title: 'Name',
    sortable: true,
    firstSortDirection: 'asc',
    value: (row) => row.name ?? 'Unnamed item',
  },
  itemClass: {
    key: 'itemClass',
    title: 'Inventory',
    width: 120,
    sortable: true,
    value: (row) => SCOPE_LABELS[row.itemClass] ?? row.itemClass,
  },
  types: {
    key: 'types',
    title: 'Type',
    width: 150,
    value: (row) => formatList(row.types, ITEM_TYPE_LABELS),
  },
  functions: {
    key: 'functions',
    title: 'Effect',
    width: 150,
    value: (row) => formatList(row.functions, ITEM_FUNCTION_LABELS),
  },
  targetLabel: {
    key: 'targetLabel',
    title: 'Equipment type',
    width: 160,
    sortable: true,
    value: (row) =>
      row.targetLabel
        ? (UPGRADE_TARGET_LABELS[row.targetLabel] ?? row.targetLabel)
        : undefined,
  },
  stats: {
    key: 'stats',
    title: 'Stats',
    width: 220,
    sortable: true,
    firstSortDirection: 'desc',
    value: (row) => formatStats(row.stats),
  },
  success: {
    key: 'success',
    title: 'Success',
    width: 100,
    numeric: true,
    value: (row) => (row.success !== undefined ? `${row.success}%` : undefined),
  },
  cursed: {
    key: 'cursed',
    title: 'Destruction risk',
    width: 140,
    numeric: true,
    firstSortDirection: 'asc',
    value: (row) =>
      row.cursed === undefined
        ? 'No recorded risk'
        : `${row.cursed}% on failure`,
  },
  tier: {
    key: 'tier',
    title: 'Tier',
    width: 110,
    sortable: true,
    value: (row, coverage) =>
      coverage.scrollTier !== 'unsupported' && row.tier
        ? (UPGRADE_TIER_LABELS[row.tier] ?? row.tier)
        : undefined,
  },
  specials: {
    key: 'specials',
    title: 'Special',
    width: 150,
    value: (row) => formatList(row.specials, UPGRADE_SPECIAL_LABELS),
  },
  directTargetCount: {
    key: 'directTargetCount',
    title: 'Verified targets',
    width: 140,
    numeric: true,
    firstSortDirection: 'desc',
    fullLabel:
      'Verified equipment targets (count; equipment type is title-derived)',
    value: (row) =>
      row.directTargetCount ? String(row.directTargetCount) : undefined,
  },
  hp: {
    key: 'hp',
    title: 'HP',
    numeric: true,
    value: (row) => formatNum(row.hp, ' HP'),
  },
  mp: {
    key: 'mp',
    title: 'MP',
    numeric: true,
    value: (row) => formatNum(row.mp, ' MP'),
  },
  hpPercent: {
    key: 'hpPercent',
    title: 'HP %',
    numeric: true,
    value: (row) => formatNum(row.hpPercent, '%'),
  },
  mpPercent: {
    key: 'mpPercent',
    title: 'MP %',
    numeric: true,
    value: (row) => formatNum(row.mpPercent, '%'),
  },
  attack: {
    key: 'attack',
    title: 'Attack',
    numeric: true,
    value: (row) => formatAttack(row.attack),
  },
  closeness: {
    key: 'closeness',
    title: 'Closeness',
    numeric: true,
    value: (row) => formatNum(row.closeness),
  },
  fullness: {
    key: 'fullness',
    title: 'Fullness',
    numeric: true,
    value: (row) => formatNum(row.fullness),
  },
  tameness: {
    key: 'tameness',
    title: 'Tameness',
    numeric: true,
    value: (row) => formatNum(row.tameness),
  },
  petTargets: {
    key: 'petTargets',
    title: 'Compatible pets',
    width: 180,
    value: (row) => formatPets(row),
  },
  seatHp: {
    key: 'seatHp',
    title: 'Seated HP',
    numeric: true,
    value: (row) => formatNum(row.seatHp, ' HP'),
  },
  seatMp: {
    key: 'seatMp',
    title: 'Seated MP',
    numeric: true,
    value: (row) => formatNum(row.seatMp, ' MP'),
  },
  kind: {
    key: 'kind',
    title: 'Kind',
    width: 110,
    sortable: true,
    value: (row) => formatKind(row.itemClass),
  },
  questFlag: {
    key: 'questFlag',
    title: 'Quest flag',
    width: 110,
    sortable: true,
    value: (row) => formatQuestFlag(row.questFlag),
  },
  neededForQuestCount: {
    key: 'neededForQuestCount',
    title: 'Needed for quests',
    width: 140,
    numeric: true,
    value: (row, coverage) =>
      formatRelCount(
        row.neededForQuestCount,
        coverage.relationships['needed-for-quest'],
      ),
  },
  questRewardCount: {
    key: 'questRewardCount',
    title: 'Quest rewards',
    width: 140,
    numeric: true,
    value: (row, coverage) =>
      formatRelCount(
        row.questRewardCount,
        coverage.relationships['quest-reward'],
      ),
  },
  usedInRecipeCount: {
    key: 'usedInRecipeCount',
    title: 'Used in recipes',
    width: 140,
    numeric: true,
    value: (row, coverage) =>
      formatRelCount(
        row.usedInRecipeCount,
        coverage.relationships['used-in-recipe'],
      ),
  },
  madeByRecipeCount: {
    key: 'madeByRecipeCount',
    title: 'Made by recipes',
    width: 140,
    numeric: true,
    value: (row, coverage) =>
      formatRelCount(
        row.madeByRecipeCount,
        coverage.relationships['made-by-recipe'],
      ),
  },
  monsterDropCount: {
    key: 'monsterDropCount',
    title: 'Monster drops',
    width: 140,
    numeric: true,
    value: (row, coverage) =>
      formatRelCount(
        row.monsterDropCount,
        coverage.relationships['monster-drop'],
      ),
  },
  foundInContainerCount: {
    key: 'foundInContainerCount',
    title: 'Found in containers',
    width: 160,
    numeric: true,
    value: (row, coverage) =>
      formatRelCount(
        row.foundInContainerCount,
        coverage.relationships['found-in-container'],
      ),
  },
  cashShopListingCount: {
    key: 'cashShopListingCount',
    title: 'Cash shop listings',
    width: 160,
    numeric: true,
    value: (row, coverage) =>
      formatRelCount(
        row.cashShopListingCount,
        coverage.relationships['cash-shop-listing'],
      ),
  },
  family: {
    key: 'family',
    title: 'Source family',
    width: 140,
    sortable: true,
    firstSortDirection: 'asc',
    fullLabel: 'Family (source metadata)',
    value: (row) =>
      row.family && row.family.length > 0 ? row.family : undefined,
  },
} as const satisfies Record<string, ColumnConfig>;

export type ColumnKey = keyof typeof COLUMNS;

export interface ContextColumnConfig {
  readonly visible: readonly ColumnKey[];
  readonly optional?: readonly ColumnKey[];
}

const GENERIC_OPTIONAL: readonly ColumnKey[] = [
  'neededForQuestCount',
  'questRewardCount',
  'usedInRecipeCount',
  'madeByRecipeCount',
  'monsterDropCount',
  'foundInContainerCount',
  'cashShopListingCount',
  'family',
];

const FEEDING_COLUMNS: readonly ColumnKey[] = [
  'closeness',
  'fullness',
  'tameness',
  'petTargets',
];

const generic: ContextColumnConfig = {
  visible: ['name', 'itemClass', 'types', 'functions'],
  optional: GENERIC_OPTIONAL,
};

const projectile: ContextColumnConfig = {
  visible: ['name', 'attack', 'types', 'functions'],
};

const chairs: ContextColumnConfig = {
  visible: ['name', 'seatHp', 'seatMp', 'types', 'functions'],
};

const cash: ContextColumnConfig = {
  visible: ['name', 'kind', 'types', 'functions'],
  optional: [...FEEDING_COLUMNS, ...GENERIC_OPTIONAL],
};

export const CONTEXT_COLUMNS: Readonly<Record<string, ContextColumnConfig>> = {
  all: generic,
  use: generic,
  'use:upgrade-scrolls': {
    visible: [
      'name',
      'targetLabel',
      'stats',
      'success',
      'cursed',
      'tier',
      'specials',
      'directTargetCount',
    ],
  },
  'use:recovery': {
    visible: [
      'name',
      'hp',
      'mp',
      'hpPercent',
      'mpPercent',
      'types',
      'functions',
    ],
  },
  'use:throwing-stars': projectile,
  'use:arrows': projectile,
  'use:bullets': projectile,
  'use:pet-food': {
    visible: ['name', ...FEEDING_COLUMNS, 'types', 'functions'],
  },
  etc: {
    visible: ['name', 'questFlag', 'types', 'functions'],
    optional: GENERIC_OPTIONAL,
  },
  'etc:quest-items': {
    visible: [
      'name',
      'neededForQuestCount',
      'questRewardCount',
      'questFlag',
      'types',
      'functions',
    ],
  },
  'etc:crafting': {
    visible: [
      'name',
      'usedInRecipeCount',
      'madeByRecipeCount',
      'types',
      'functions',
    ],
  },
  setup: {
    ...chairs,
    optional: GENERIC_OPTIONAL,
  },
  'setup:chairs': chairs,
  cash,
  'cash:cash-items': cash,
  'cash:pets': cash,
};
