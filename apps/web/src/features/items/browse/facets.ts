/**
 * Facet definitions and option derivation for Items Browse.
 *
 * Facet options are limited to values present in the current category population.
 * Relationship coverage governs available relationship options and labeling.
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
  type ItemRelationshipKind,
} from './labels';
import {
  RELATIONSHIP_COUNT_FIELDS,
  type ItemBrowseFunction,
  type ItemBrowseType,
  type ItemRow,
} from './project';
import type { ItemCategorySelection } from './routing';
import { matchSourceId } from './search';

export function getItemRelationships(
  row: ItemRow,
): readonly ItemRelationshipKind[] {
  const rels: ItemRelationshipKind[] = [];
  for (const [relKind, fieldKey] of RELATIONSHIP_COUNT_FIELDS) {
    const count = row[fieldKey];
    if (typeof count === 'number' && count > 0) {
      rels.push(relKind);
    }
  }
  return rels;
}

function buildFacetOptions<T extends string>(
  labelMap: Readonly<Record<T, string>>,
  presentValues: ReadonlySet<T>,
  formatLabel?: (value: T, baseLabel: string) => string | undefined,
): readonly FacetOption[] {
  const options: FacetOption[] = [];
  for (const value of presentValues) {
    const baseLabel = labelMap[value];
    if (baseLabel !== undefined) {
      const label = formatLabel ? formatLabel(value, baseLabel) : baseLabel;
      if (label !== undefined) {
        options.push({ value, label });
      }
    }
  }
  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export function getItemFacets(
  _category: ItemCategorySelection,
  coverage: ItemBrowseCoverage,
  scopedRows: readonly ItemRow[],
): readonly FacetDefinition<ItemRow>[] {
  const facets: FacetDefinition<ItemRow>[] = [];

  // 1. Item type facet
  const presentTypes = new Set<ItemBrowseType>();
  for (const row of scopedRows) {
    if (row.types) {
      for (const t of row.types) {
        presentTypes.add(t);
      }
    }
  }
  const typeOptions = buildFacetOptions(ITEM_TYPE_LABELS, presentTypes);
  if (typeOptions.length > 0) {
    facets.push({
      id: 'types',
      field: 'types',
      label: 'Item type',
      kind: 'multi-select',
      options: typeOptions,
    });
  }

  // 2. Effect (function) facet
  const presentFunctions = new Set<ItemBrowseFunction>();
  for (const row of scopedRows) {
    if (row.functions) {
      for (const fn of row.functions) {
        presentFunctions.add(fn);
      }
    }
  }
  const functionOptions = buildFacetOptions(
    ITEM_FUNCTION_LABELS,
    presentFunctions,
  );
  if (functionOptions.length > 0) {
    facets.push({
      id: 'functions',
      field: 'functions',
      label: 'Effect',
      kind: 'multi-select',
      options: functionOptions,
    });
  }

  // 3. Relationship facet
  const presentRels = new Set<ItemRelationshipKind>();
  for (const row of scopedRows) {
    for (const rel of getItemRelationships(row)) {
      presentRels.add(rel);
    }
  }
  const relationshipOptions = buildFacetOptions(
    RELATIONSHIP_LABELS,
    presentRels,
    (relKind, baseLabel) => {
      const relCoverage = coverage.relationships[relKind];
      if (relCoverage === 'unsupported') {
        return undefined;
      }
      return relCoverage === 'partial' ? `${baseLabel} (partial)` : baseLabel;
    },
  );
  if (relationshipOptions.length > 0) {
    facets.push({
      id: 'rel',
      field: 'rel',
      label: 'Relationship',
      kind: 'multi-select',
      options: relationshipOptions,
    });
  }

  return facets;
}

export const ITEM_QUERY_FIELDS: readonly QueryFieldDefinition<ItemRow>[] = [
  {
    id: 'types',
    accessor: (row) => row.types ?? [],
    getUniqueValues: (row) => row.types ?? [],
  },
  {
    id: 'functions',
    accessor: (row) => row.functions ?? [],
    getUniqueValues: (row) => row.functions ?? [],
  },
  {
    id: 'rel',
    accessor: (row) => getItemRelationships(row),
    getUniqueValues: (row) => getItemRelationships(row),
  },
  {
    id: 'sourceId',
    accessor: (row) => row.sourceId,
    searchMatch: (val, query) =>
      typeof val === 'string' ? matchSourceId(val, query) : false,
  },
];

export function getDropCoverageNotice(
  coverage: ItemBrowseCoverage,
  category: ItemCategorySelection,
): string | undefined {
  if (category.scope.slug !== 'all' || category.child !== undefined) {
    return undefined;
  }
  const dropCoverage = coverage.relationships['monster-drop'];
  if (dropCoverage === 'unsupported') {
    return 'Classic World has no monster drop data.';
  }
  if (dropCoverage === 'partial') {
    return 'GMS monster-book evidence is incomplete and a missing record does not mean an item cannot drop.';
  }
  return undefined;
}
