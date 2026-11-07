/**
 * Facet definitions and option derivation for Items Browse.
 *
 * Provides contextual facets per category plus common categorical facets.
 * Facet options are limited to values present in the current category population
 * and options that cannot narrow the page are dropped.
 */
import type { FacetDefinition } from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import { getContextualFacets } from './context-facets';
import { buildPresentFacetOptions } from './facet-options';
import {
  ITEM_FUNCTION_LABELS,
  ITEM_TYPE_LABELS,
  RELATIONSHIP_LABELS,
  type ItemRelationshipKind,
} from './labels';
import type { ItemBrowseFunction, ItemBrowseType, ItemRow } from './project';
import { getItemRelationships, ITEM_QUERY_FIELDS } from './query-fields';
import type { ItemCategorySelection } from './routing';

export { getItemRelationships, ITEM_QUERY_FIELDS };

export function getItemFacets(
  category: ItemCategorySelection,
  coverage: ItemBrowseCoverage,
  scopedRows: readonly ItemRow[],
  roster: readonly ItemRow[] = scopedRows,
): readonly FacetDefinition<ItemRow>[] {
  const facets: FacetDefinition<ItemRow>[] = [];

  // 1. Contextual facets listed first
  const contextualFacets = getContextualFacets(
    category,
    coverage,
    scopedRows,
    roster,
  );
  for (const facet of contextualFacets) {
    facets.push(facet);
  }

  // 2. Common facets (Item type, Effect, Relationship)
  const isGenericScope =
    (category.scope.slug === 'all' || category.scope.slug === 'use') &&
    category.child === undefined;

  // Item type facet
  const presentTypes = new Set<ItemBrowseType>();
  for (const row of scopedRows) {
    if (row.types) {
      for (const t of row.types) {
        presentTypes.add(t);
      }
    }
  }
  const typeOptions = buildPresentFacetOptions(
    presentTypes,
    scopedRows,
    (row, t) => row.types?.includes(t) ?? false,
    ITEM_TYPE_LABELS,
  );
  if (typeOptions.length > 0) {
    facets.push({
      id: 'types',
      field: 'types',
      label: 'Item type',
      kind: 'multi-select',
      ...(isGenericScope ? { quick: true } : {}),
      options: typeOptions,
    });
  }

  // Effect (function) facet
  const presentFunctions = new Set<ItemBrowseFunction>();
  for (const row of scopedRows) {
    if (row.functions) {
      for (const fn of row.functions) {
        presentFunctions.add(fn);
      }
    }
  }
  const functionOptions = buildPresentFacetOptions(
    presentFunctions,
    scopedRows,
    (row, fn) => row.functions?.includes(fn) ?? false,
    ITEM_FUNCTION_LABELS,
  );
  if (functionOptions.length > 0) {
    facets.push({
      id: 'functions',
      field: 'functions',
      label: 'Effect',
      kind: 'multi-select',
      ...(isGenericScope ? { quick: true } : {}),
      options: functionOptions,
    });
  }

  // Relationship facet
  const presentRels = new Set<ItemRelationshipKind>();
  for (const row of scopedRows) {
    for (const rel of getItemRelationships(row)) {
      presentRels.add(rel);
    }
  }
  const relationshipOptions = buildPresentFacetOptions(
    presentRels,
    scopedRows,
    (row, rel) => getItemRelationships(row).includes(rel),
    (relKind) => {
      const relCoverage = coverage.relationships[relKind];
      if (relCoverage === 'unsupported') {
        return undefined;
      }
      const baseLabel = RELATIONSHIP_LABELS[relKind];
      if (!baseLabel) return undefined;
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
