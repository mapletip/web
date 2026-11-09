/**
 * Column configuration table for Items Browse.
 *
 * Each column defines its key, accessor, title, presentation flags, and string projection.
 */
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import {
  formatAttack,
  formatCursed,
  formatFunctions,
  formatKind,
  formatNum,
  formatPets,
  formatQuestFlag,
  formatRelCount,
  formatSpecials,
  formatStats,
  formatSuccess,
  formatTargetLabel,
  formatTier,
  formatTypes,
  SCOPE_LABELS,
} from './column-format';
import {
  RELATIONSHIP_COUNT_FIELDS,
  type ItemRelationshipKind,
  type ItemRow,
} from './project';

export interface ColumnConfig {
  readonly key: string;
  readonly accessor: keyof ItemRow;
  readonly title: string;
  readonly fullLabel?: string;
  readonly width?: number;
  readonly nowrap?: boolean;
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

function col<K extends keyof ItemRow>(
  key: K,
  title: string,
  value: (row: ItemRow, coverage: ItemBrowseCoverage) => string | undefined,
  extra?: Omit<Partial<ColumnConfig>, 'key' | 'accessor' | 'title' | 'value'>,
): ColumnConfig {
  return { key, accessor: key, title, value, ...extra };
}

type NumericItemRowKey = {
  [K in keyof ItemRow]-?: ItemRow[K] extends number | undefined ? K : never;
}[keyof ItemRow];

function numCol<K extends NumericItemRowKey>(
  key: K,
  title: string,
  unit = '',
): ColumnConfig {
  return col(key, title, (row) => formatNum(row[key], unit), {
    numeric: true,
  });
}

const numericColumns = {
  hp: numCol('hp', 'HP Recovered'),
  mp: numCol('mp', 'MP Recovered'),
  hpPercent: numCol('hpPercent', 'HP Recovered %', '%'),
  mpPercent: numCol('mpPercent', 'MP Recovered %', '%'),
  closeness: numCol('closeness', 'Closeness'),
  fullness: numCol('fullness', 'Fullness'),
  tameness: numCol('tameness', 'Tameness'),
  seatHp: numCol('seatHp', 'HP Recovered / 10s'),
  seatMp: numCol('seatMp', 'MP Recovered / 10s'),
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

function relCol(
  relKind: ItemRelationshipKind,
  fieldKey: (typeof RELATIONSHIP_COUNT_FIELDS)[number][1],
  width = 140,
  fullLabel?: string,
): ColumnConfig {
  return col(
    fieldKey,
    REL_TITLES[relKind],
    (row, coverage) =>
      formatRelCount(row[fieldKey], coverage.relationships[relKind]),
    {
      width,
      numeric: true,
      relationshipKind: relKind,
      ...(fullLabel ? { fullLabel } : {}),
    },
  );
}

const relationshipColumns = {
  neededForQuestCount: relCol('needed-for-quest', 'neededForQuestCount'),
  questRewardCount: relCol('quest-reward', 'questRewardCount'),
  usedInRecipeCount: relCol('used-in-recipe', 'usedInRecipeCount'),
  madeByRecipeCount: relCol('made-by-recipe', 'madeByRecipeCount'),
  monsterDropCount: relCol(
    'monster-drop',
    'monsterDropCount',
    140,
    'Monster drops (lower bound)',
  ),
  foundInContainerCount: relCol(
    'found-in-container',
    'foundInContainerCount',
    160,
  ),
  cashShopListingCount: relCol(
    'cash-shop-listing',
    'cashShopListingCount',
    160,
  ),
};

const STATS_SORT_LABELS = {
  desc: 'Stats Improved: strongest first',
  asc: 'Stats Improved: weakest first',
} as const;

export const COLUMNS = {
  name: col('name', 'Name', (row) => row.name ?? 'Unnamed item', {
    sortable: true,
    firstSortDirection: 'asc',
  }),
  itemClass: col(
    'itemClass',
    'Inventory',
    (row) => SCOPE_LABELS[row.itemClass] ?? row.itemClass,
    { width: 120, sortable: true },
  ),
  types: col('types', 'Type', formatTypes, { width: 150 }),
  functions: col('functions', 'Effect', formatFunctions, { width: 150 }),
  targetLabel: col(
    'targetLabel',
    'Equipment type',
    (row) => formatTargetLabel(row.targetLabel),
    { width: 130, nowrap: true, sortable: true },
  ),
  stats: col('stats', 'Stats Improved', (row) => formatStats(row.stats), {
    width: 170,
    sortable: true,
    firstSortDirection: 'desc',
    sortLabels: STATS_SORT_LABELS,
  }),
  success: col('success', 'Success', (row) => formatSuccess(row.success), {
    width: 80,
    numeric: true,
  }),
  cursed: col('cursed', 'Destruction risk', (row) => formatCursed(row.cursed), {
    width: 120,
    numeric: true,
    firstSortDirection: 'asc',
  }),
  tier: col('tier', 'Tier', (row, coverage) => formatTier(row.tier, coverage), {
    width: 90,
    sortable: true,
  }),
  specials: col('specials', 'Special', formatSpecials, { width: 110 }),
  directTargetCount: col(
    'directTargetCount',
    'Verified targets',
    (row) =>
      row.directTargetCount ? String(row.directTargetCount) : undefined,
    {
      width: 90,
      numeric: true,
      firstSortDirection: 'desc',
      fullLabel:
        'Verified equipment targets (count; equipment type is title-derived)',
    },
  ),
  attack: col('attack', 'Attack', (row) => formatAttack(row.attack), {
    width: 80,
    numeric: true,
  }),
  petTargets: col('petTargets', 'Compatible pets', formatPets, { width: 180 }),
  kind: {
    key: 'kind',
    accessor: 'itemClass',
    title: 'Kind',
    width: 110,
    sortable: true,
    value: (row) => formatKind(row.itemClass),
  },
  questFlag: col(
    'questFlag',
    'Quest item flag',
    (row) => formatQuestFlag(row.questFlag),
    {
      width: 120,
      sortable: true,
      fullLabel:
        'Whether source data marks this as a quest item; it does not show a recorded quest requirement.',
    },
  ),
  family: col(
    'family',
    'Source family',
    (row) => (row.family && row.family.length > 0 ? row.family : undefined),
    {
      width: 130,
      sortable: true,
      firstSortDirection: 'asc',
      fullLabel: 'Family (source metadata)',
    },
  ),
  ...numericColumns,
  ...relationshipColumns,
} as const satisfies Record<string, ColumnConfig>;

export type ColumnKey = keyof typeof COLUMNS;

export * from './column-contexts';
