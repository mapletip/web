/**
 * Column configuration table for Items Browse.
 *
 * Each column defines its key, accessor, title, presentation flags, and string projection.
 */
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import {
  RELATIONSHIP_COUNT_FIELDS,
  type ItemRelationshipKind,
  type ItemRow,
} from '../project';

import {
  formatAttack,
  formatCursed,
  formatFunctions,
  formatNum,
  formatPets,
  formatQuestFlag,
  formatRelCount,
  formatSpecials,
  formatStats,
  formatSuccess,
  formatTargetLabel,
  formatTier,
  SCOPE_LABELS,
} from './format';

export interface ColumnConfig {
  readonly key: string;
  readonly accessor: keyof ItemRow;
  readonly title: string;
  readonly fullLabel?: string;
  readonly width?: number;
  readonly nowrap?: boolean;
  readonly alwaysShow?: boolean;
  readonly numeric?: boolean;
  readonly sortable?: boolean;
  readonly firstSortDirection?: 'asc' | 'desc';
  readonly sortLabels?: { readonly asc: string; readonly desc: string };
  readonly relationshipKind?: ItemRelationshipKind;
  readonly value: (
    row: ItemRow,
    coverage: ItemBrowseCoverage,
  ) => string | undefined;
}

function col<K extends keyof ItemRow>({
  key,
  title,
  value,
  ...extra
}: {
  readonly key: K;
  readonly title: string;
  readonly value: (
    row: ItemRow,
    coverage: ItemBrowseCoverage,
  ) => string | undefined;
} & Omit<
  Partial<ColumnConfig>,
  'key' | 'accessor' | 'title' | 'value'
>): ColumnConfig {
  return { key, accessor: key, title, value, ...extra };
}

type NumericItemRowKey = {
  [K in keyof ItemRow]-?: ItemRow[K] extends number | undefined ? K : never;
}[keyof ItemRow];

function numCol<K extends NumericItemRowKey>({
  key,
  title,
  unit = '',
  options,
}: {
  readonly key: K;
  readonly title: string;
  readonly unit?: string;
  readonly options?: Pick<ColumnConfig, 'nowrap' | 'width' | 'sortLabels'>;
}): ColumnConfig {
  return col({
    key,
    title,
    value: (row) => formatNum(row[key], unit),
    numeric: true,
    ...options,
  });
}

const numericColumns = {
  hp: numCol({ key: 'hp', title: 'HP Recovered' }),
  mp: numCol({ key: 'mp', title: 'MP Recovered' }),
  hpPercent: numCol({ key: 'hpPercent', title: 'HP Recovered %', unit: '%' }),
  mpPercent: numCol({ key: 'mpPercent', title: 'MP Recovered %', unit: '%' }),
  closeness: numCol({ key: 'closeness', title: 'Closeness' }),
  fullness: numCol({ key: 'fullness', title: 'Fullness' }),
  tameness: numCol({ key: 'tameness', title: 'Tameness' }),
  seatHp: numCol({
    key: 'seatHp',
    title: 'HP Recovered / 10s',
    options: {
      width: 190,
      nowrap: true,
      sortLabels: {
        asc: 'HP / 10s: low to high',
        desc: 'HP / 10s: high to low',
      },
    },
  }),
  seatMp: numCol({
    key: 'seatMp',
    title: 'MP Recovered / 10s',
    options: {
      width: 190,
      nowrap: true,
      sortLabels: {
        asc: 'MP / 10s: low to high',
        desc: 'MP / 10s: high to low',
      },
    },
  }),
};

const REL_TITLES: Readonly<Record<ItemRelationshipKind, string>> = {
  'needed-for-quest': 'Needed for quests',
  'quest-reward': 'Quest rewards',
  'used-in-recipe': 'Used in recipes',
  'made-by-recipe': 'Made by recipes',
  'monster-drop': 'Monster drops',
  'found-in-container': 'Found in containers',
  'cash-shop-listing': 'Cash shop listings',
};

function relCol({
  relKind,
  fieldKey,
  width = 140,
  fullLabel,
}: {
  readonly relKind: ItemRelationshipKind;
  readonly fieldKey: (typeof RELATIONSHIP_COUNT_FIELDS)[number][1];
  readonly width?: number;
  readonly fullLabel?: string;
}): ColumnConfig {
  return col({
    key: fieldKey,
    title: REL_TITLES[relKind],
    value: (row, coverage) =>
      formatRelCount(row[fieldKey], coverage.relationships[relKind]),
    width,
    numeric: true,
    sortable: false,
    relationshipKind: relKind,
    ...(fullLabel ? { fullLabel } : {}),
  });
}

const relationshipColumns = {
  neededForQuestCount: relCol({
    relKind: 'needed-for-quest',
    fieldKey: 'neededForQuestCount',
  }),
  questRewardCount: relCol({
    relKind: 'quest-reward',
    fieldKey: 'questRewardCount',
  }),
  usedInRecipeCount: relCol({
    relKind: 'used-in-recipe',
    fieldKey: 'usedInRecipeCount',
  }),
  madeByRecipeCount: relCol({
    relKind: 'made-by-recipe',
    fieldKey: 'madeByRecipeCount',
  }),
  monsterDropCount: relCol({
    relKind: 'monster-drop',
    fieldKey: 'monsterDropCount',
    width: 140,
    fullLabel: 'Monster drops (lower bound)',
  }),
  foundInContainerCount: relCol({
    relKind: 'found-in-container',
    fieldKey: 'foundInContainerCount',
    width: 160,
  }),
  cashShopListingCount: relCol({
    relKind: 'cash-shop-listing',
    fieldKey: 'cashShopListingCount',
    width: 160,
  }),
};

const STATS_SORT_LABELS = {
  desc: 'Stats Improved: strongest',
  asc: 'Stats Improved: weakest',
} as const;

export const COLUMNS = {
  name: col({
    key: 'name',
    title: 'Name',
    value: (row) => row.name ?? 'Unnamed item',
    ...{
      sortable: true,
      firstSortDirection: 'asc',
    },
  }),
  itemClass: col({
    key: 'itemClass',
    title: 'Inventory',
    value: (row) => SCOPE_LABELS[row.itemClass] ?? row.itemClass,
    ...{ width: 120, sortable: true },
  }),
  functions: col({
    key: 'functions',
    title: 'Effect',
    value: formatFunctions,
    ...{ width: 150 },
  }),
  targetLabel: col({
    key: 'targetLabel',
    title: 'Equipment type',
    value: (row) => formatTargetLabel(row.targetLabel),
    ...{ width: 130, nowrap: true, sortable: true },
  }),
  stats: col({
    key: 'stats',
    title: 'Stats Improved',
    value: (row) => formatStats(row.stats),
    ...{
      width: 170,
      sortable: true,
      firstSortDirection: 'desc',
      sortLabels: STATS_SORT_LABELS,
    },
  }),
  success: col({
    key: 'success',
    title: 'Success',
    value: (row) => formatSuccess(row.success),
    ...{
      width: 80,
      numeric: true,
    },
  }),
  cursed: col({
    key: 'cursed',
    title: 'Destruction risk',
    value: (row) => formatCursed(row.cursed),
    ...{
      width: 120,
      numeric: true,
      firstSortDirection: 'asc',
      alwaysShow: true,
      sortLabels: {
        asc: 'Risk: low to high',
        desc: 'Risk: high to low',
      },
    },
  }),
  tier: col({
    key: 'tier',
    title: 'Tier',
    value: (row, coverage) => formatTier(row.tier, coverage),
    ...{
      width: 90,
      sortable: true,
    },
  }),
  specials: col({
    key: 'specials',
    title: 'Special',
    value: formatSpecials,
    ...{ width: 110 },
  }),
  directTargetCount: col({
    key: 'directTargetCount',
    title: 'Verified targets',
    value: (row) =>
      row.directTargetCount ? String(row.directTargetCount) : undefined,
    ...{
      width: 90,
      numeric: true,
      sortable: false,
      fullLabel:
        'Verified equipment targets (count; equipment type is title-derived)',
    },
  }),
  attack: col({
    key: 'attack',
    title: 'Attack',
    value: (row) => formatAttack(row.attack),
    ...{
      width: 80,
      numeric: true,
    },
  }),
  petTargets: col({
    key: 'petTargets',
    title: 'Compatible pets',
    value: formatPets,
    ...{ width: 180 },
  }),
  questFlag: col({
    key: 'questFlag',
    title: 'Quest item flag',
    value: (row) => formatQuestFlag(row.questFlag),
    ...{
      width: 120,
      sortable: false,
      fullLabel:
        'Whether source data marks this as a quest item; it does not show a recorded quest requirement.',
    },
  }),
  ...numericColumns,
  ...relationshipColumns,
} as const satisfies Record<string, ColumnConfig>;

export type ColumnKey = keyof typeof COLUMNS;

export * from './contexts';
