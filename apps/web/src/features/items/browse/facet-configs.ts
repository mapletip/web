/**
 * Facet configurations and context mappings for Items Browse.
 *
 * Declarative tables defining available categorical and range facets
 * and the facet sets active in each category context.
 */
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import { formatAttackValue } from './column-format';
import {
  ITEM_FUNCTION_LABELS,
  ITEM_TYPE_LABELS,
  SCROLL_STAT_LABELS,
  SCROLL_STAT_ORDER,
  UPGRADE_SPECIAL_LABELS,
  UPGRADE_TARGET_LABELS,
  UPGRADE_TIER_LABELS,
  type ItemRelationshipKind,
} from './labels';
import { RELATIONSHIP_COUNT_FIELDS, type ItemRow } from './project';

export function getItemRelationships(
  row: ItemRow,
): readonly ItemRelationshipKind[] {
  return RELATIONSHIP_COUNT_FIELDS.filter(
    ([, key]) => typeof row[key] === 'number' && row[key] > 0,
  ).map(([kind]) => kind);
}

export interface CategoricalContext {
  readonly coverage: ItemBrowseCoverage;
  readonly petLabels: ReadonlyMap<string, string>;
  readonly relationshipLabels: ReadonlyMap<string, string>;
}

export interface CategoricalFacetConfig {
  readonly field: string;
  readonly label: string;
  readonly values: (row: ItemRow) => readonly string[];
  readonly optionLabel:
    | Readonly<Record<string, string>>
    | ((value: string, ctx: CategoricalContext) => string | undefined);
  readonly sortOrder?:
    readonly string[] | ((a: string, b: string) => number) | undefined;
  readonly quick?: boolean | undefined;
}

export interface RangeFacetConfig {
  readonly field: string;
  readonly label: string;
  readonly getValue: (row: ItemRow) => number | undefined;
  readonly unit?: string | undefined;
  readonly formatValue?: ((value: number) => string) | undefined;
  readonly quick?: boolean | undefined;
}

export const CATEGORICAL_FACETS: readonly CategoricalFacetConfig[] = [
  {
    field: 'types',
    label: 'Item type',
    values: (row) => row.types ?? [],
    optionLabel: ITEM_TYPE_LABELS,
    quick: true,
  },
  {
    field: 'functions',
    label: 'Effect',
    values: (row) =>
      row.functions ? row.functions.filter((fn) => fn !== 'pet') : [],
    optionLabel: ITEM_FUNCTION_LABELS,
  },
  {
    field: 'rel',
    label: 'Relationship',
    values: (row) => getItemRelationships(row),
    optionLabel: (val, ctx) => ctx.relationshipLabels.get(val),
  },
  {
    field: 'scrollTarget',
    label: 'Equipment type',
    values: (row) => (row.targetLabel ? [row.targetLabel] : []),
    optionLabel: UPGRADE_TARGET_LABELS,
    quick: true,
  },
  {
    field: 'scrollStat',
    label: 'Stats Improved',
    values: (row) => (row.stats ? Object.keys(row.stats) : []),
    optionLabel: SCROLL_STAT_LABELS,
    sortOrder: SCROLL_STAT_ORDER,
    quick: true,
  },
  {
    field: 'scrollSuccess',
    label: 'Success rate',
    values: (row) => (row.success !== undefined ? [String(row.success)] : []),
    optionLabel: (val) => `${val}%`,
    sortOrder: (a, b) => Number(a) - Number(b),
  },
  {
    field: 'scrollRisk',
    label: 'Destruction risk',
    values: (row) =>
      row.cursed === undefined ? ['none'] : [String(row.cursed)],
    optionLabel: (val) =>
      val === 'none' ? '-' : `${val}% on failure`,
    sortOrder: (a, b) => {
      if (a === 'none') return -1;
      if (b === 'none') return 1;
      return Number(a) - Number(b);
    },
  },
  {
    field: 'scrollTier',
    label: 'Tier',
    values: (row) => (row.tier ? [row.tier] : []),
    optionLabel: (val, ctx) =>
      ctx.coverage.scrollTier === 'unsupported'
        ? undefined
        : UPGRADE_TIER_LABELS[val],
  },
  {
    field: 'scrollSpecial',
    label: 'Special',
    values: (row) => row.specials ?? [],
    optionLabel: UPGRADE_SPECIAL_LABELS,
  },
  {
    field: 'scrollDirect',
    label: 'Targets',
    values: (row) => (row.directTargetCount ? ['verified'] : []),
    optionLabel: () => 'Verified equipment targets',
  },
  {
    field: 'pet',
    label: 'Compatible pets',
    values: (row) => [
      ...(row.petTargets?.map((t) => t.key) ?? []),
      ...(row.unresolvedPetTargets?.map((id) => `unresolved:${id}`) ?? []),
    ],
    optionLabel: (val, ctx) =>
      val.startsWith('unresolved:')
        ? `Unresolved target ${val.slice(11)}`
        : (ctx.petLabels.get(val) ?? val),
    quick: true,
  },
  {
    field: 'kind',
    label: 'Kind',
    values: (row) =>
      row.itemClass === 'pet' || row.itemClass === 'cash'
        ? [row.itemClass]
        : [],
    optionLabel: { pet: 'Pet', cash: 'Cash Item' },
    quick: true,
  },
  {
    field: 'questFlag',
    label: 'Quest item',
    values: (row) => (row.questFlag ? ['quest-flagged'] : []),
    optionLabel: () => 'Marked as a quest item',
    quick: true,
  },
];

export const RANGE_FACETS: readonly RangeFacetConfig[] = [
  {
    field: 'hp',
    label: 'HP Recovered',
    getValue: (r) => r.hp,
    quick: true,
  },
  {
    field: 'mp',
    label: 'MP Recovered',
    getValue: (r) => r.mp,
    quick: true,
  },
  {
    field: 'hpPercent',
    label: 'HP Recovered %',
    getValue: (r) => r.hpPercent,
    unit: '%',
  },
  {
    field: 'mpPercent',
    label: 'MP Recovered %',
    getValue: (r) => r.mpPercent,
    unit: '%',
  },
  {
    field: 'attack',
    label: 'Attack',
    getValue: (r) => r.attack,
    formatValue: formatAttackValue,
    quick: true,
  },
  {
    field: 'closeness',
    label: 'Closeness',
    getValue: (r) => r.closeness,
    quick: true,
  },
  { field: 'fullness', label: 'Fullness', getValue: (r) => r.fullness },
  { field: 'tameness', label: 'Tameness', getValue: (r) => r.tameness },
  {
    field: 'seatHp',
    label: 'HP per 10 sec',
    getValue: (r) => r.seatHp,
    quick: true,
  },
  {
    field: 'seatMp',
    label: 'MP per 10 sec',
    getValue: (r) => r.seatMp,
  },
];

export const CATEGORICAL_FACET_MAP = new Map(
  CATEGORICAL_FACETS.map((facet) => [facet.field, facet]),
);

export const RANGE_FACET_MAP = new Map(
  RANGE_FACETS.map((facet) => [facet.field, facet]),
);

export const DEFAULT_FACETS = ['functions', 'rel'] as const;

export const SCROLL_FACETS = [
  'scrollTarget',
  'scrollStat',
  'scrollSuccess',
  'scrollRisk',
  'scrollTier',
  'scrollSpecial',
  'scrollDirect',
  'rel',
] as const;

export const PET_FEEDING_FACETS = [
  'pet',
  'closeness',
  'fullness',
  'tameness',
  ...DEFAULT_FACETS,
] as const;

export const CONTEXT_FACETS: Readonly<Record<string, readonly string[]>> = {
  all: DEFAULT_FACETS,
  use: DEFAULT_FACETS,
  'use:recovery': ['hp', 'mp', 'hpPercent', 'mpPercent', ...DEFAULT_FACETS],
  'use:upgrade-scrolls': SCROLL_FACETS,
  'use:throwing-stars': ['attack', ...DEFAULT_FACETS],
  'use:arrows': ['attack', ...DEFAULT_FACETS],
  'use:bullets': ['attack', ...DEFAULT_FACETS],
  'use:pet-food': PET_FEEDING_FACETS,
  etc: ['questFlag', ...DEFAULT_FACETS],
  'etc:quest-items': ['questFlag', ...DEFAULT_FACETS],
  'etc:crafting': DEFAULT_FACETS,
  setup: ['seatHp', 'seatMp', ...DEFAULT_FACETS],
  'setup:chairs': ['seatHp', 'seatMp', ...DEFAULT_FACETS],
  cash: ['kind', ...PET_FEEDING_FACETS],
  'cash:cash-items': PET_FEEDING_FACETS,
};
