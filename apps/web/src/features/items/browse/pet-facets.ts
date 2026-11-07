import type { FacetDefinition } from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import {
  buildPetFacetOptions,
  buildPresentFacetOptions,
} from './facet-options';
import type { ItemRow } from './project';
import { buildRangeBuckets } from './range-buckets';

function buildRangeFacet(
  field: string,
  label: string,
  values: readonly (number | undefined)[],
  options?: { quick?: boolean },
): FacetDefinition<ItemRow> | undefined {
  const numericValues = values.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  const buckets = buildRangeBuckets(numericValues);
  if (!buckets) {
    return undefined;
  }
  return {
    id: field,
    field,
    label,
    kind: 'range',
    buckets,
    ...(options?.quick ? { quick: true } : {}),
  };
}

export function buildPetFoodFacets(
  scopedRows: readonly ItemRow[],
  _coverage: ItemBrowseCoverage,
  roster: readonly ItemRow[],
): readonly FacetDefinition<ItemRow>[] {
  const facets: FacetDefinition<ItemRow>[] = [];

  const petOptions = buildPetFacetOptions(scopedRows, roster);
  if (petOptions.length > 0) {
    facets.push({
      id: 'pet',
      field: 'pet',
      label: 'Compatible pets',
      kind: 'multi-select',
      quick: true,
      options: petOptions,
    });
  }

  const closeness = buildRangeFacet(
    'closeness',
    'Closeness',
    scopedRows.map((r) => r.closeness),
    { quick: true },
  );
  if (closeness) facets.push(closeness);

  const fullness = buildRangeFacet(
    'fullness',
    'Fullness',
    scopedRows.map((r) => r.fullness),
  );
  if (fullness) facets.push(fullness);

  const tameness = buildRangeFacet(
    'tameness',
    'Tameness',
    scopedRows.map((r) => r.tameness),
  );
  if (tameness) facets.push(tameness);

  return facets;
}

export function buildCashScopeFacets(
  scopedRows: readonly ItemRow[],
  _coverage: ItemBrowseCoverage,
  roster: readonly ItemRow[],
): readonly FacetDefinition<ItemRow>[] {
  const facets: FacetDefinition<ItemRow>[] = [];

  const kindOptions = buildPresentFacetOptions(
    ['pet', 'cash'] as const,
    scopedRows,
    (row, k) => row.itemClass === k,
    { pet: 'Pet', cash: 'Cash Item' },
  );
  if (kindOptions.length > 0) {
    facets.push({
      id: 'kind',
      field: 'kind',
      label: 'Kind',
      kind: 'multi-select',
      quick: true,
      options: kindOptions,
    });
  }

  // Show feeding facts only where the population has such values
  const petOptions = buildPetFacetOptions(scopedRows, roster);
  if (petOptions.length > 0) {
    facets.push({
      id: 'pet',
      field: 'pet',
      label: 'Compatible pets',
      kind: 'multi-select',
      options: petOptions,
    });
  }

  const closeness = buildRangeFacet(
    'closeness',
    'Closeness',
    scopedRows.map((r) => r.closeness),
  );
  if (closeness) facets.push(closeness);

  const fullness = buildRangeFacet(
    'fullness',
    'Fullness',
    scopedRows.map((r) => r.fullness),
  );
  if (fullness) facets.push(fullness);

  const tameness = buildRangeFacet(
    'tameness',
    'Tameness',
    scopedRows.map((r) => r.tameness),
  );
  if (tameness) facets.push(tameness);

  return facets;
}

export function buildCashItemFacets(
  scopedRows: readonly ItemRow[],
  _coverage: ItemBrowseCoverage,
  roster: readonly ItemRow[],
): readonly FacetDefinition<ItemRow>[] {
  const facets: FacetDefinition<ItemRow>[] = [];

  const petOptions = buildPetFacetOptions(scopedRows, roster);
  if (petOptions.length > 0) {
    facets.push({
      id: 'pet',
      field: 'pet',
      label: 'Compatible pets',
      kind: 'multi-select',
      options: petOptions,
    });
  }

  const closeness = buildRangeFacet(
    'closeness',
    'Closeness',
    scopedRows.map((r) => r.closeness),
  );
  if (closeness) facets.push(closeness);

  const fullness = buildRangeFacet(
    'fullness',
    'Fullness',
    scopedRows.map((r) => r.fullness),
  );
  if (fullness) facets.push(fullness);

  const tameness = buildRangeFacet(
    'tameness',
    'Tameness',
    scopedRows.map((r) => r.tameness),
  );
  if (tameness) facets.push(tameness);

  return facets;
}
