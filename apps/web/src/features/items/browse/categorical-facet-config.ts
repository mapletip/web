/** Player-facing categorical facet values and labels. */
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import {
  ITEM_FUNCTION_LABELS,
  ITEM_TYPE_LABELS,
  RELATIONSHIP_LABELS,
  SCROLL_STAT_LABELS,
  UPGRADE_SPECIAL_LABELS,
  UPGRADE_TARGET_LABELS,
  UPGRADE_TIER_LABELS,
  type ItemRelationshipKind,
} from './labels';
import { RELATIONSHIP_COUNT_FIELDS, type ItemRow } from './project';

export interface CategoricalContext {
  readonly coverage: ItemBrowseCoverage;
}

interface LabelContext {
  readonly context: CategoricalContext;
}

export interface CategoricalFacetConfig {
  readonly kind: 'multi-select';
  readonly label: string;
  readonly values: (row: ItemRow) => readonly string[];
  readonly labels?:
    | Readonly<Record<string, string>>
    | ((options: LabelContext) => Readonly<Record<string, string>>);
  readonly formatOption?: (options: { readonly value: string }) => string;
  readonly quick?: boolean;
}

function isItemRelationshipKind(value: string): value is ItemRelationshipKind {
  return Object.hasOwn(RELATIONSHIP_LABELS, value);
}

function relationshipLabels({
  context,
}: LabelContext): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(RELATIONSHIP_LABELS).flatMap(([value, label]) => {
      if (!isItemRelationshipKind(value)) return [];
      const coverage = context.coverage.relationships[value];
      if (coverage === 'unsupported') return [];
      return [[value, coverage === 'partial' ? `${label} (partial)` : label]];
    }),
  );
}

function scrollTierLabels({
  context,
}: LabelContext): Readonly<Record<string, string>> {
  return context.coverage.scrollTier === 'unsupported'
    ? {}
    : UPGRADE_TIER_LABELS;
}

export const ITEM_CATEGORICAL_FACET_CONFIGS = {
  types: {
    kind: 'multi-select',
    label: 'Item type',
    values: (row) => row.types ?? [],
    labels: ITEM_TYPE_LABELS,
    quick: true,
  },
  buffType: {
    kind: 'multi-select',
    label: 'Buff type',
    values: (row) =>
      row.types?.filter((type) => type === 'potion' || type === 'food-buff') ??
      [],
    labels: { potion: 'Potion', 'food-buff': 'Food & Buff' },
  },
  functions: {
    kind: 'multi-select',
    label: 'Effect',
    values: (row) =>
      row.functions ? row.functions.filter((fn) => fn !== 'pet') : [],
    labels: ITEM_FUNCTION_LABELS,
  },
  rel: {
    kind: 'multi-select',
    label: 'Relationship',
    values: (row) => getItemRelationships({ row }),
    labels: relationshipLabels,
  },
  scrollTarget: {
    kind: 'multi-select',
    label: 'Equipment type',
    values: (row) => (row.targetLabel ? [row.targetLabel] : []),
    labels: UPGRADE_TARGET_LABELS,
    quick: true,
  },
  scrollStat: {
    kind: 'multi-select',
    label: 'Stat',
    values: (row) => (row.stats ? Object.keys(row.stats) : []),
    labels: SCROLL_STAT_LABELS,
    quick: true,
  },
  scrollSuccess: {
    kind: 'multi-select',
    label: 'Success rate',
    values: (row) => (row.success !== undefined ? [String(row.success)] : []),
    formatOption: ({ value }) => `${value}%`,
  },
  scrollRisk: {
    kind: 'multi-select',
    label: 'Destruction risk',
    values: (row) =>
      row.cursed === undefined ? ['none'] : [String(row.cursed)],
    formatOption: ({ value }) =>
      value === 'none' ? 'No recorded risk' : `${value}% on failure`,
  },
  scrollTier: {
    kind: 'multi-select',
    label: 'Tier',
    values: (row) => (row.tier ? [row.tier] : []),
    labels: scrollTierLabels,
  },
  scrollSpecial: {
    kind: 'multi-select',
    label: 'Special',
    values: (row) => row.specials ?? [],
    labels: UPGRADE_SPECIAL_LABELS,
  },
  pet: {
    kind: 'multi-select',
    label: 'Compatible pets',
    values: (row) => [
      ...(row.petTargets?.map((target) => target.name ?? 'Unnamed pet') ?? []),
      ...(row.unresolvedPetTargets?.map(() => 'Unresolved pet') ?? []),
    ],
    quick: true,
  },
  kind: {
    kind: 'multi-select',
    label: 'Kind',
    values: (row) =>
      row.itemClass === 'pet' || row.itemClass === 'cash'
        ? [row.itemClass]
        : [],
    labels: { pet: 'Pet', cash: 'Cash Item' },
    quick: true,
  },
} satisfies Record<string, CategoricalFacetConfig>;

export function getItemRelationships({
  row,
}: {
  readonly row: ItemRow;
}): readonly ItemRelationshipKind[] {
  return RELATIONSHIP_COUNT_FIELDS.filter(
    ([, key]) => typeof row[key] === 'number' && row[key] > 0,
  ).map(([kind]) => kind);
}
