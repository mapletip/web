import { normalizeFilters } from '@/components/FacetedBrowser/hooks/browseState';
import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';
import { isNumericRangeFilter } from '@/components/FacetedBrowser/hooks/filterTypes';

import type { FacetDefinition } from './types';

function validRangeFilter(
  value: unknown,
): value is { readonly min?: number; readonly max?: number } {
  if (!isNumericRangeFilter(value)) return false;
  if (Object.keys(value).some((key) => key !== 'min' && key !== 'max')) {
    return false;
  }
  const min = value['min'];
  const max = value['max'];
  if (min === undefined && max === undefined) return false;
  if (min !== undefined && (typeof min !== 'number' || !Number.isFinite(min))) {
    return false;
  }
  if (max !== undefined && (typeof max !== 'number' || !Number.isFinite(max))) {
    return false;
  }
  return !(typeof min === 'number' && typeof max === 'number' && min > max);
}

/** Keeps only filters that can be represented by the currently resolved facets. */
export function normalizeFacetFilters<TRecord extends Record<string, unknown>>({
  facets,
  filters,
}: {
  readonly facets: readonly FacetDefinition<TRecord>[];
  readonly filters: Readonly<Record<string, FacetFilterValue>>;
}): Record<string, FacetFilterValue> {
  const facetsByField = new Map(facets.map((facet) => [facet.field, facet]));
  const normalized: Record<string, FacetFilterValue> = {};

  for (const [field, value] of Object.entries(filters)) {
    const facet = facetsByField.get(field);
    if (facet === undefined) continue;

    if (facet.kind === 'multi-select') {
      if (!Array.isArray(value)) continue;
      const validOptions = new Set(
        facet.options?.map((option) => option.value),
      );
      const selected = value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && validOptions.has(entry),
      );
      if (selected.length > 0) normalized[field] = selected;
      continue;
    }

    if (facet.kind === 'boolean') {
      if (typeof value === 'boolean') normalized[field] = value;
      continue;
    }

    if (Array.isArray(value)) {
      if (facet.buckets === undefined || typeof facet.buckets === 'string') {
        continue;
      }
      const validBuckets = new Set(facet.buckets.map((bucket) => bucket.value));
      const selected = value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && validBuckets.has(entry),
      );
      if (selected.length > 0) normalized[field] = selected;
      continue;
    }

    if (validRangeFilter(value)) normalized[field] = value;
  }

  return normalizeFilters(normalized);
}
