/** Declarative Item Browse facet definitions and category contexts. */
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
import { RELATIONSHIP_COUNT_FIELDS, type ItemRow } from './project';

export interface CategoricalContext {
  readonly coverage: ItemBrowseCoverage;
  readonly petLabels: ReadonlyMap<string, string>;
}

export interface CategoricalFacetConfig {
  readonly field: string;
  readonly label: string;
  readonly values: (row: ItemRow) => readonly string[];
  readonly optionLabel:
    | Readonly<Record<string, string>>
    | ((value: string, context: CategoricalContext) => string | undefined);
  readonly sortOrder?:
    readonly string[] | ((a: string, b: string) => number) | undefined;
  readonly quick?: boolean | undefined;
}

export interface RangeFacetConfig {
  readonly field: string;
  readonly label: string;
  readonly getValue: (row: ItemRow) => number | undefined;
  readonly unit?: string | undefined;
  readonly quick?: boolean | undefined;
}

function labelFor<TLabels extends Readonly<Record<string, string>>>(
  labels: TLabels,
  value: string,
): string | undefined {
  return Object.entries(labels).find(([key]) => key === value)?.[1];
}

function isRelationshipKind(value: string): value is ItemRelationshipKind {
  return Object.hasOwn(RELATIONSHIP_LABELS, value);
}

function relationshipLabel(
  value: string,
  context: CategoricalContext,
): string | undefined {
  if (!isRelationshipKind(value)) return undefined;
  const coverage = context.coverage.relationships[value];
  if (coverage === 'unsupported') return undefined;
  const label = RELATIONSHIP_LABELS[value];
  return coverage === 'partial' ? `${label} (partial)` : label;
}

export const CATEGORICAL_FACETS = [
  {
    field: 'types',
    label: 'Item type',
    values: (row) => row.types ?? [],
    optionLabel: ITEM_TYPE_LABELS,
    quick: true,
  },
  {
    field: 'buffType',
    label: 'Buff type',
    values: (row) =>
      row.types?.filter((type) => type === 'potion' || type === 'food-buff') ??
      [],
    optionLabel: { potion: 'Potion', 'food-buff': 'Food & Buff' },
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
    values: (row) => getItemRelationships({ row }),
    optionLabel: relationshipLabel,
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
    optionLabel: (value) => labelFor(SCROLL_STAT_LABELS, value),
    sortOrder: SCROLL_STAT_ORDER,
    quick: true,
  },
  {
    field: 'scrollSuccess',
    label: 'Success rate',
    values: (row) => (row.success !== undefined ? [String(row.success)] : []),
    optionLabel: (value) => `${value}%`,
    sortOrder: (a, b) => Number(a) - Number(b),
  },
  {
    field: 'scrollRisk',
    label: 'Destruction risk',
    values: (row) =>
      row.cursed === undefined ? ['none'] : [String(row.cursed)],
    optionLabel: (value) =>
      value === 'none' ? 'No recorded risk' : `${value}% on failure`,
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
    optionLabel: (value, context) =>
      context.coverage.scrollTier === 'unsupported'
        ? undefined
        : labelFor(UPGRADE_TIER_LABELS, value),
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
      ...(row.petTargets?.map((target) => target.key) ?? []),
      ...(row.unresolvedPetTargets?.map((id) => `unresolved:${id}`) ?? []),
    ],
    optionLabel: (value, context) =>
      value.startsWith('unresolved:')
        ? `Unresolved target ${value.slice(11)}`
        : (context.petLabels.get(value) ?? value),
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
] as const satisfies readonly CategoricalFacetConfig[];

export const RANGE_FACETS = [
  { field: 'hp', label: 'HP', getValue: (row) => row.hp, quick: true },
  { field: 'mp', label: 'MP', getValue: (row) => row.mp, quick: true },
  {
    field: 'hpPercent',
    label: 'HP %',
    getValue: (row) => row.hpPercent,
    unit: '%',
  },
  {
    field: 'mpPercent',
    label: 'MP %',
    getValue: (row) => row.mpPercent,
    unit: '%',
  },
  {
    field: 'attack',
    label: 'Attack',
    getValue: (row) => row.attack,
    quick: true,
  },
  {
    field: 'closeness',
    label: 'Closeness',
    getValue: (row) => row.closeness,
    quick: true,
  },
  { field: 'fullness', label: 'Fullness', getValue: (row) => row.fullness },
  { field: 'tameness', label: 'Tameness', getValue: (row) => row.tameness },
  {
    field: 'seatHp',
    label: 'Seated HP recovery',
    getValue: (row) => row.seatHp,
    quick: true,
  },
  {
    field: 'seatMp',
    label: 'Seated MP recovery',
    getValue: (row) => row.seatMp,
  },
] as const satisfies readonly RangeFacetConfig[];

export type ItemFacetField =
  | (typeof CATEGORICAL_FACETS)[number]['field']
  | (typeof RANGE_FACETS)[number]['field'];

export function getItemRelationships({
  row,
}: {
  readonly row: ItemRow;
}): readonly ItemRelationshipKind[] {
  return RELATIONSHIP_COUNT_FIELDS.filter(
    ([, key]) => typeof row[key] === 'number' && row[key] > 0,
  ).map(([kind]) => kind);
}
