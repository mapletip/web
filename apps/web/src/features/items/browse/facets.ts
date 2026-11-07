/**
 * Facet definitions and option derivation for Items Browse.
 *
 * Driven by flat typed tables for categorical and range facets,
 * generating both UI definitions and query field accessors.
 */
import type {
  FacetDefinition,
  FacetOption,
  QueryFieldDefinition,
} from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import {
  ITEM_FUNCTION_LABELS,
  ITEM_TYPE_LABELS,
  RELATIONSHIP_LABELS,
  SCROLL_STAT_LABELS,
  SCROLL_STAT_ORDER,
  UPGRADE_SPECIAL_LABELS,
  UPGRADE_TARGET_LABELS,
  UPGRADE_TIER_LABELS,
  type ItemRelationshipKind,
} from './labels';
import { buildPetLabels } from './pet-labels';
import {
  RELATIONSHIP_COUNT_FIELDS,
  type ItemBrowseUpgradeTier,
  type ItemRow,
} from './project';
import { buildRangeBuckets } from './range-buckets';
import type { ItemCategorySelection } from './routing';
import { matchSourceId } from './search';

export function getItemRelationships(
  row: ItemRow,
): readonly ItemRelationshipKind[] {
  return RELATIONSHIP_COUNT_FIELDS.filter(
    ([, key]) => typeof row[key] === 'number' && row[key] > 0,
  ).map(([kind]) => kind);
}

interface CategoricalContext {
  readonly coverage: ItemBrowseCoverage;
  readonly petLabels: ReadonlyMap<string, string>;
}

interface CategoricalFacetConfig {
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

interface RangeFacetConfig {
  readonly field: string;
  readonly label: string;
  readonly getValue: (row: ItemRow) => number | undefined;
  readonly unit?: string | undefined;
  readonly quick?: boolean | undefined;
}

const CATEGORICAL_FACETS: readonly CategoricalFacetConfig[] = [
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
    optionLabel: (val, ctx) => {
      const cov = ctx.coverage.relationships[val as ItemRelationshipKind];
      if (cov === 'unsupported') return undefined;
      const base = RELATIONSHIP_LABELS[val as ItemRelationshipKind];
      return cov === 'partial' ? `${base} (partial)` : base;
    },
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
    label: 'Stat',
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
      val === 'none' ? 'No recorded risk' : `${val}% on failure`,
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
        : UPGRADE_TIER_LABELS[val as ItemBrowseUpgradeTier],
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
    optionLabel: () => 'Quest-flagged item',
    quick: true,
  },
];

const RANGE_FACETS: readonly RangeFacetConfig[] = [
  { field: 'hp', label: 'HP', getValue: (r) => r.hp, quick: true },
  { field: 'mp', label: 'MP', getValue: (r) => r.mp, quick: true },
  {
    field: 'hpPercent',
    label: 'HP %',
    getValue: (r) => r.hpPercent,
    unit: '%',
  },
  {
    field: 'mpPercent',
    label: 'MP %',
    getValue: (r) => r.mpPercent,
    unit: '%',
  },
  { field: 'attack', label: 'Attack', getValue: (r) => r.attack, quick: true },
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
    label: 'Seated HP recovery',
    getValue: (r) => r.seatHp,
    quick: true,
  },
  { field: 'seatMp', label: 'Seated MP recovery', getValue: (r) => r.seatMp },
];

const CATEGORICAL_FACET_MAP = new Map(
  CATEGORICAL_FACETS.map((facet) => [facet.field, facet]),
);
const RANGE_FACET_MAP = new Map(
  RANGE_FACETS.map((facet) => [facet.field, facet]),
);

export const ITEM_QUERY_FIELDS: readonly QueryFieldDefinition<ItemRow>[] = [
  ...CATEGORICAL_FACETS.map((facet) => ({
    id: facet.field,
    accessor: facet.values,
    getUniqueValues: facet.values,
  })),
  ...RANGE_FACETS.map((facet) => ({
    id: facet.field,
    accessor: facet.getValue,
  })),
  {
    id: 'sourceId',
    accessor: (row) => row.sourceId,
    searchMatch: (val, query) =>
      typeof val === 'string' ? matchSourceId(val, query) : false,
  },
];

const DEFAULT_FACETS = ['types', 'functions', 'rel'] as const;
const SCROLL_FACETS = [
  'scrollTarget',
  'scrollStat',
  'scrollSuccess',
  'scrollRisk',
  'scrollTier',
  'scrollSpecial',
  'scrollDirect',
  'rel',
] as const;
const PET_FEEDING_FACETS = [
  'pet',
  'closeness',
  'fullness',
  'tameness',
  ...DEFAULT_FACETS,
] as const;

const CONTEXT_FACETS: Readonly<Record<string, readonly string[]>> = {
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

function deriveCategoricalFacet(
  cfg: CategoricalFacetConfig,
  scopedRows: readonly ItemRow[],
  ctx: CategoricalContext,
): FacetDefinition<ItemRow> | undefined {
  const total = scopedRows.length;
  if (total === 0) return undefined;

  const counts = new Map<string, number>();
  for (const row of scopedRows) {
    for (const val of cfg.values(row)) {
      counts.set(val, (counts.get(val) ?? 0) + 1);
    }
  }

  const options: FacetOption[] = [];
  for (const [val, count] of counts) {
    if (count > 0 && count < total) {
      const label =
        typeof cfg.optionLabel === 'function'
          ? cfg.optionLabel(val, ctx)
          : cfg.optionLabel[val];
      if (label !== undefined) options.push({ value: val, label });
    }
  }
  if (options.length === 0) return undefined;

  const sorter = cfg.sortOrder;
  if (typeof sorter === 'function') {
    options.sort((a, b) => sorter(a.value, b.value));
  } else if (Array.isArray(sorter)) {
    const order = new Map(sorter.map((v, i) => [v, i]));
    options.sort(
      (a, b) =>
        (order.get(a.value) ?? Infinity) - (order.get(b.value) ?? Infinity) ||
        a.label.localeCompare(b.label),
    );
  } else {
    options.sort((a, b) => a.label.localeCompare(b.label));
  }

  return {
    id: cfg.field,
    field: cfg.field,
    label: cfg.label,
    kind: 'multi-select',
    ...(cfg.quick ? { quick: true } : {}),
    options,
  };
}

function deriveRangeFacet(
  cfg: RangeFacetConfig,
  scopedRows: readonly ItemRow[],
): FacetDefinition<ItemRow> | undefined {
  const values = scopedRows
    .map((r) => cfg.getValue(r))
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const buckets = buildRangeBuckets(values, cfg.unit);
  if (!buckets) return undefined;
  return {
    id: cfg.field,
    field: cfg.field,
    label: cfg.label,
    kind: 'range',
    buckets,
    ...(cfg.quick ? { quick: true } : {}),
  };
}

export function getItemFacets(
  category: ItemCategorySelection,
  coverage: ItemBrowseCoverage,
  scopedRows: readonly ItemRow[],
  roster: readonly ItemRow[],
): readonly FacetDefinition<ItemRow>[] {
  const contextKey = category.child
    ? `${category.scope.slug}:${category.child.slug}`
    : category.scope.slug;

  const fieldNames = CONTEXT_FACETS[contextKey] ?? DEFAULT_FACETS;
  const ctx: CategoricalContext = {
    coverage,
    petLabels: buildPetLabels(roster),
  };

  const facets: FacetDefinition<ItemRow>[] = [];
  for (const field of fieldNames) {
    const catCfg = CATEGORICAL_FACET_MAP.get(field);
    if (catCfg) {
      const facet = deriveCategoricalFacet(catCfg, scopedRows, ctx);
      if (facet) facets.push(facet);
    } else {
      const rangeCfg = RANGE_FACET_MAP.get(field);
      if (rangeCfg) {
        const facet = deriveRangeFacet(rangeCfg, scopedRows);
        if (facet) facets.push(facet);
      }
    }
  }

  return facets;
}

export function getDropCoverageNotice(
  coverage: ItemBrowseCoverage,
  category: ItemCategorySelection,
): string | undefined {
  if (category.scope.slug !== 'all' || category.child !== undefined) {
    return undefined;
  }
  const cov = coverage.relationships['monster-drop'];
  if (cov === 'unsupported') return 'Classic World has no monster drop data.';
  if (cov === 'partial') {
    return 'GMS monster-book evidence is incomplete and a missing record does not mean an item cannot drop.';
  }
  return undefined;
}
