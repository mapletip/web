import type { FacetDefinition } from '@/components/FacetedBrowser/FacetControls/types';
import { normalizeFilterValue } from '@/components/FacetedBrowser/hooks/browseState';
import {
  isNumericRangeFilter,
  type FacetFilterValue,
} from '@/components/FacetedBrowser/hooks/filterTypes';

export interface ActiveFacetChip {
  readonly key: string;
  readonly label: string;
  readonly field: string;
  readonly removeValue?: string;
}

export function activeValueCount(value: FacetFilterValue): number {
  const normalized = normalizeFilterValue(value);
  if (Array.isArray(normalized)) return normalized.length;
  if (isNumericRangeFilter(normalized)) {
    return (
      Number(normalized.min !== undefined) +
      Number(normalized.max !== undefined)
    );
  }
  return normalized === undefined ? 0 : 1;
}

export function hasActiveFilter(value: FacetFilterValue): boolean {
  return normalizeFilterValue(value) !== undefined;
}

export function countActiveFilters(
  filters: Readonly<Record<string, FacetFilterValue>>,
): number {
  return Object.values(filters).reduce<number>(
    (total, value) => total + activeValueCount(value),
    0,
  );
}

function scalarLabel(value: FacetFilterValue): string {
  if (isNumericRangeFilter(value)) {
    return `${value.min ?? 'Any'}–${value.max ?? 'Any'}`;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function buildFacetChips<TRecord extends Record<string, unknown>>(
  facet: FacetDefinition<TRecord>,
  value: FacetFilterValue,
): ActiveFacetChip[] {
  if (Array.isArray(value)) {
    const selections = value.filter(
      (entry): entry is string => typeof entry === 'string',
    );
    return selections.map((selected) => {
      const option = facet.options?.find((entry) => entry.value === selected);
      return {
        key: `${facet.id}:${selected}`,
        label: `${facet.label}: ${option?.label ?? selected}`,
        field: facet.field,
        removeValue: selected,
      };
    });
  }
  if (!hasActiveFilter(value)) return [];
  return [
    {
      key: facet.id,
      label: `${facet.label}: ${scalarLabel(value)}`,
      field: facet.field,
    },
  ];
}

export function buildActiveChips<TRecord extends Record<string, unknown>>(
  facets: readonly FacetDefinition<TRecord>[],
  filters: Readonly<Record<string, FacetFilterValue>>,
): ActiveFacetChip[] {
  return facets.flatMap((facet) =>
    buildFacetChips(facet, filters[facet.field]),
  );
}
