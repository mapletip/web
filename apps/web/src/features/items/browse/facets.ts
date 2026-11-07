/**
 * Facet derivation and query field definitions for Items Browse.
 *
 * Driven by flat typed tables from facet-configs.ts, generating both UI
 * definitions and query field accessors.
 */
import type {
  FacetDefinition,
  FacetOption,
  QueryFieldDefinition,
} from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import {
  CATEGORICAL_FACET_MAP,
  CATEGORICAL_FACETS,
  CONTEXT_FACETS,
  DEFAULT_FACETS,
  getItemRelationships,
  RANGE_FACET_MAP,
  RANGE_FACETS,
  type CategoricalContext,
  type CategoricalFacetConfig,
  type RangeFacetConfig,
} from './facet-configs';
import { RELATIONSHIP_LABELS, UPGRADE_TARGET_LABELS } from './labels';
import { buildPetLabels } from './pet-labels';
import { RELATIONSHIP_COUNT_FIELDS, type ItemRow } from './project';
import { buildRangeBuckets } from './range-buckets';
import { itemCategoryContextKey, type ItemCategorySelection } from './routing';
import { matchSourceId } from './search';
import { computeScrollStatsSortValue } from './sort';

export { getItemRelationships };

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
  {
    id: 'stats',
    accessor: computeScrollStatsSortValue,
  },
  {
    id: 'targetLabel',
    accessor: (row) =>
      row.targetLabel
        ? (UPGRADE_TARGET_LABELS[row.targetLabel] ?? row.targetLabel)
        : undefined,
  },
  {
    id: 'cursed',
    accessor: (row) => row.cursed ?? 0,
  },
];

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
  const contextKey = itemCategoryContextKey(category);
  const fieldNames = CONTEXT_FACETS[contextKey] ?? DEFAULT_FACETS;

  const relationshipLabels = new Map<string, string>();
  for (const [kind] of RELATIONSHIP_COUNT_FIELDS) {
    const cov = coverage.relationships[kind];
    if (cov !== 'unsupported') {
      const base = RELATIONSHIP_LABELS[kind];
      relationshipLabels.set(
        kind,
        cov === 'partial' ? `${base} (partial)` : base,
      );
    }
  }

  const ctx: CategoricalContext = {
    coverage,
    petLabels: buildPetLabels(roster),
    relationshipLabels,
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
