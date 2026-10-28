import type { ColumnFiltersState } from '@tanstack/react-table';

import type { SortIntent } from '@/components/Table/types';

import { isNumericRangeFilter, type FacetFilterValue } from './filterTypes';

/** Serializable committed query and presentation state shared by FacetedBrowser. */
export interface BrowseState {
  readonly search: string;
  readonly filters: Readonly<Record<string, FacetFilterValue>>;
  readonly sort?: SortIntent;
  /** One-based result page. */
  readonly page: number;
  readonly pageSize: number;
  readonly hiddenColumns: readonly string[];
}

export const EMPTY_FILTERS: Readonly<Record<string, FacetFilterValue>> =
  Object.freeze({});

export interface NormalizedBrowseState extends Omit<BrowseState, 'filters'> {
  readonly filters: Record<string, FacetFilterValue>;
}

const EMPTY_HIDDEN_COLUMNS: readonly string[] = Object.freeze([]);

function normalizePage(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

export function normalizePageSize(
  value: number | undefined,
  fallback: number,
): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

/** Canonical filter value: set-like selections are sorted, empty values removed. */
function normalizeRangeEndpoint(
  value: unknown,
  present: boolean,
): number | undefined {
  if (!present) return undefined;
  return typeof value === 'number' ? value : Number.NaN;
}

export function normalizeFilterValue(
  value: FacetFilterValue,
): FacetFilterValue {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    const values = [
      ...new Set(
        value.filter((entry) => typeof entry === 'string' && entry.length > 0),
      ),
    ].sort();
    return values.length > 0 ? values : undefined;
  }
  if (typeof value === 'string') return value.length > 0 ? value : undefined;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'boolean') return value;
  if (!isNumericRangeFilter(value)) return undefined;

  const min = normalizeRangeEndpoint(
    value.min,
    Object.hasOwn(value, 'min') && value.min !== undefined,
  );
  const max = normalizeRangeEndpoint(
    value.max,
    Object.hasOwn(value, 'max') && value.max !== undefined,
  );
  return min === undefined && max === undefined
    ? undefined
    : {
        ...(min !== undefined ? { min } : {}),
        ...(max !== undefined ? { max } : {}),
      };
}

/** Remove inactive facets so no-op transitions and query state stay canonical. */
export function normalizeFilters(
  filters: Readonly<Record<string, FacetFilterValue>>,
): Record<string, FacetFilterValue> {
  const next: Record<string, FacetFilterValue> = {};
  for (const [field, value] of Object.entries(filters)) {
    const normalized = normalizeFilterValue(value);
    if (normalized !== undefined) next[field] = normalized;
  }
  return next;
}

export function withFilterValue(
  filters: Readonly<Record<string, FacetFilterValue>>,
  field: string,
  value: FacetFilterValue,
): Record<string, FacetFilterValue> {
  return normalizeFilters({ ...filters, [field]: value });
}

function filterValuesEqual(
  left: FacetFilterValue,
  right: FacetFilterValue,
): boolean {
  const a = normalizeFilterValue(left);
  const b = normalizeFilterValue(right);
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, index) => value === b[index])
    );
  }
  if (isNumericRangeFilter(a) || isNumericRangeFilter(b)) {
    return (
      isNumericRangeFilter(a) &&
      isNumericRangeFilter(b) &&
      Object.is(a.min, b.min) &&
      Object.is(a.max, b.max)
    );
  }
  return Object.is(a, b);
}

export function filtersEqual(
  left: Readonly<Record<string, FacetFilterValue>>,
  right: Readonly<Record<string, FacetFilterValue>>,
): boolean {
  const a = normalizeFilters(left);
  const b = normalizeFilters(right);
  const fields = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const field of fields) {
    if (!filterValuesEqual(a[field], b[field])) return false;
  }
  return true;
}

function sortEqual(
  left: SortIntent | undefined,
  right: SortIntent | undefined,
): boolean {
  return left?.field === right?.field && left?.direction === right?.direction;
}

function hiddenColumnsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const a = new Set(left);
  const b = new Set(right);
  return a.size === b.size && [...a].every((field) => b.has(field));
}

export function browseStatesEqual(
  left: BrowseState,
  right: BrowseState,
): boolean {
  return (
    left.search === right.search &&
    left.page === right.page &&
    left.pageSize === right.pageSize &&
    sortEqual(left.sort, right.sort) &&
    hiddenColumnsEqual(left.hiddenColumns, right.hiddenColumns) &&
    filtersEqual(left.filters, right.filters)
  );
}

export function createBrowseState(
  state: Partial<BrowseState> | undefined,
  fallbackPageSize: number,
): NormalizedBrowseState {
  const sort =
    state?.sort &&
    typeof state.sort.field === 'string' &&
    state.sort.field.length > 0 &&
    (state.sort.direction === 'asc' || state.sort.direction === 'desc')
      ? { field: state.sort.field, direction: state.sort.direction }
      : undefined;

  return {
    search: typeof state?.search === 'string' ? state.search : '',
    filters: normalizeFilters(state?.filters ?? EMPTY_FILTERS),
    ...(sort !== undefined ? { sort } : {}),
    page: normalizePage(state?.page, 1),
    pageSize: normalizePageSize(state?.pageSize, fallbackPageSize),
    hiddenColumns: [
      ...new Set(
        (state?.hiddenColumns ?? EMPTY_HIDDEN_COLUMNS).filter(
          (field) => field.length > 0,
        ),
      ),
    ],
  };
}

export function toColumnFilters(
  filters: Readonly<Record<string, FacetFilterValue>>,
): ColumnFiltersState {
  return Object.entries(normalizeFilters(filters)).map(([id, value]) => ({
    id,
    value,
  }));
}
