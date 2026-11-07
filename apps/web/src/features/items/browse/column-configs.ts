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

const NUMERIC_COLUMNS_DEF = [
  ['hp', 'HP', ''],
  ['mp', 'MP', ''],
  ['hpPercent', 'HP %', '%'],
  ['mpPercent', 'MP %', '%'],
  ['closeness', 'Closeness', ''],
  ['fullness', 'Fullness', ''],
  ['tameness', 'Tameness', ''],
  ['seatHp', 'Seated HP', ''],
  ['seatMp', 'Seated MP', ''],
] as const;

type NumericColumnKey = (typeof NUMERIC_COLUMNS_DEF)[number][0];

const generatedNumericColumns = Object.fromEntries(
  NUMERIC_COLUMNS_DEF.map(([fieldKey, title, unit]) => [
    fieldKey,
    col(fieldKey, title, (row) => formatNum(row[fieldKey], unit), {
      numeric: true,
    }),
  ]),
) as Record<NumericColumnKey, ColumnConfig>;

const REL_TITLES: Readonly<Record<ItemRelationshipKind, string>> = {
  'needed-for-quest': 'Needed for quests',
  'quest-reward': 'Quest rewards',
  'used-in-recipe': 'Used in recipes',
  'made-by-recipe': 'Made by recipes',
  'monster-drop': 'Monster drops',
  'found-in-container': 'Found in containers',
  'cash-shop-listing': 'Cash shop listings',
};

type RelKey = (typeof RELATIONSHIP_COUNT_FIELDS)[number][1];

const generatedRelationshipColumns = Object.fromEntries(
  RELATIONSHIP_COUNT_FIELDS.map(([relKind, fieldKey]) => [
    fieldKey,
    col(
      fieldKey,
      REL_TITLES[relKind],
      (row, coverage) =>
        formatRelCount(row[fieldKey], coverage.relationships[relKind]),
      {
        width:
          fieldKey === 'cashShopListingCount' ||
          fieldKey === 'foundInContainerCount'
            ? 160
            : 140,
        numeric: true,
        relationshipKind: relKind,
        ...(relKind === 'monster-drop'
          ? { fullLabel: 'Monster drops (lower bound)' }
          : {}),
      },
    ),
  ]),
) as Record<RelKey, ColumnConfig>;

const STATS_SORT_LABELS = {
  desc: 'Stats: strongest first',
  asc: 'Stats: weakest first',
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
  stats: col('stats', 'Stats', (row) => formatStats(row.stats), {
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
    'Quest flag',
    (row) => formatQuestFlag(row.questFlag),
    { width: 100, sortable: true },
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
  ...generatedNumericColumns,
  ...generatedRelationshipColumns,
} as const satisfies Record<string, ColumnConfig>;

export type ColumnKey = keyof typeof COLUMNS;

export * from './column-contexts';
