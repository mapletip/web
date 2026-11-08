/** Typed URL search validation and conversion for Items Browse. */
import type {
  BrowseState,
  FacetDefinition,
  FacetFilterValue,
} from '@mapletip/component-library';

import type { ItemRow } from './project';
import { ITEM_SORT_OPTIONS } from './sort';

interface NumericRangeFilter {
  readonly min?: number;
  readonly max?: number;
}

type UrlFacetFilterValue = readonly string[] | NumericRangeFilter;
type ItemBrowseSearchValue = string | number | UrlFacetFilterValue;

export interface ItemBrowseSearch extends Record<
  string,
  ItemBrowseSearchValue
> {
  readonly q: string;
  readonly page: number;
  readonly pageSize: number;
  readonly sort: string;
}

export const PAGE_SIZE_OPTIONS = [25, 50, 75, 100] as const;

const MAX_SEARCH_BYTES = 200;

export const ITEM_BROWSE_DEFAULT_STATE = {
  search: '',
  filters: {},
  sort: {
    field: ITEM_SORT_OPTIONS[0].field,
    direction: ITEM_SORT_OPTIONS[0].direction,
  },
  page: 1,
  pageSize: 50,
  hiddenColumns: [],
} satisfies BrowseState;

interface SortKeyOption {
  readonly field: string;
  readonly direction: string;
}

function sortKey(option: SortKeyOption): string {
  return `${option.field}-${option.direction}`;
}

function parseSearchQuery(value: unknown): string | undefined {
  const query =
    typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
  if (typeof query !== 'string' || query.length === 0) return undefined;
  const bytes = new TextEncoder().encode(query).length;
  return bytes <= MAX_SEARCH_BYTES ? query : undefined;
}

function parseInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  return undefined;
}

function parsePage(value: unknown): number | undefined {
  const page = parseInteger(value);
  return page !== undefined && page >= 1 && page <= 9999 ? page : undefined;
}

function parsePageSize(value: unknown): number | undefined {
  const pageSize = parseInteger(value);
  return pageSize !== undefined &&
    PAGE_SIZE_OPTIONS.some((option) => option === pageSize)
    ? pageSize
    : undefined;
}

function parseSort(value: unknown) {
  if (typeof value !== 'string') return undefined;
  return ITEM_SORT_OPTIONS.find((option) => sortKey(option) === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRangeFilter(value: unknown): NumericRangeFilter | undefined {
  if (!isRecord(value)) return undefined;
  if (Object.keys(value).some((key) => key !== 'min' && key !== 'max')) {
    return undefined;
  }

  const min = value['min'];
  const max = value['max'];
  if (min === undefined && max === undefined) return undefined;
  if (min !== undefined && (typeof min !== 'number' || !Number.isFinite(min))) {
    return undefined;
  }
  if (max !== undefined && (typeof max !== 'number' || !Number.isFinite(max))) {
    return undefined;
  }
  if (typeof min === 'number' && typeof max === 'number' && min > max) {
    return undefined;
  }
  return {
    ...(typeof min === 'number' ? { min } : {}),
    ...(typeof max === 'number' ? { max } : {}),
  };
}

function parseFacetFilter(value: unknown): UrlFacetFilterValue | undefined {
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    const values: string[] = [];
    for (const entry of value) {
      if (typeof entry === 'string' && entry.length > 0) {
        values.push(entry);
      } else if (typeof entry === 'number' && Number.isFinite(entry)) {
        values.push(String(entry));
      } else {
        return undefined;
      }
    }
    return values;
  }
  return parseRangeFilter(value);
}

const GENERAL_SEARCH_KEYS = new Set(['q', 'page', 'pageSize', 'sort']);

/** Keeps the four general keys and only well-formed facet values. */
export function validateSearch(raw: Record<string, unknown>): ItemBrowseSearch {
  const sort = parseSort(raw['sort']) ?? ITEM_BROWSE_DEFAULT_STATE.sort;
  const search: ItemBrowseSearch = {
    q: parseSearchQuery(raw['q']) ?? ITEM_BROWSE_DEFAULT_STATE.search,
    page: parsePage(raw['page']) ?? ITEM_BROWSE_DEFAULT_STATE.page,
    pageSize:
      parsePageSize(raw['pageSize']) ?? ITEM_BROWSE_DEFAULT_STATE.pageSize,
    sort: sortKey(sort),
  };

  for (const [field, value] of Object.entries(raw)) {
    if (GENERAL_SEARCH_KEYS.has(field)) continue;
    const filter = parseFacetFilter(value);
    if (filter !== undefined) search[field] = filter;
  }
  return search;
}

function getUrlFacetFilterValue(
  value: ItemBrowseSearchValue | FacetFilterValue | undefined,
): UrlFacetFilterValue | undefined {
  if (typeof value === 'object' && value !== null) return value;
  return undefined;
}

function activeFacetFilter({
  facet,
  value,
}: {
  readonly facet: FacetDefinition<ItemRow>;
  readonly value: UrlFacetFilterValue | undefined;
}): UrlFacetFilterValue | undefined {
  if (facet.kind === 'multi-select') {
    if (!Array.isArray(value)) return undefined;
    const optionValues = new Set(
      facet.options?.map((option) => option.value) ?? [],
    );
    const selected = value.filter(
      (entry): entry is string =>
        typeof entry === 'string' && optionValues.has(entry),
    );
    return selected.length > 0 ? selected : undefined;
  }

  if (facet.kind === 'range') {
    if (Array.isArray(value)) {
      if (facet.buckets === undefined || facet.buckets === 'quantile') {
        return undefined;
      }
      const bucketValues = new Set(facet.buckets.map((bucket) => bucket.value));
      const selected = value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && bucketValues.has(entry),
      );
      return selected.length > 0 ? selected : undefined;
    }
    return value;
  }

  return undefined;
}

export interface UrlToBrowseStateOptions {
  readonly search: ItemBrowseSearch;
  readonly facets: readonly FacetDefinition<ItemRow>[];
}

/** Converts validated URL parameters into the current category's browse state. */
export function urlToBrowseState({
  search,
  facets,
}: UrlToBrowseStateOptions): BrowseState {
  const sort =
    ITEM_SORT_OPTIONS.find((option) => sortKey(option) === search.sort) ??
    ITEM_BROWSE_DEFAULT_STATE.sort;
  const filters: Record<string, FacetFilterValue> = {};

  for (const facet of facets) {
    const value = activeFacetFilter({
      facet,
      value: getUrlFacetFilterValue(search[facet.field]),
    });
    if (value !== undefined) filters[facet.field] = value;
  }

  return {
    ...ITEM_BROWSE_DEFAULT_STATE,
    search: search.q,
    filters,
    page: search.page,
    pageSize: search.pageSize,
    sort: { field: sort.field, direction: sort.direction },
  };
}

export interface BrowseStateToUrlOptions {
  readonly state: BrowseState;
  readonly facets: readonly FacetDefinition<ItemRow>[];
  readonly includePage?: boolean | undefined;
}

/** Serializes only active filters declared by the current category's facets. */
export function browseStateToUrl({
  state,
  facets,
  includePage = true,
}: BrowseStateToUrlOptions): ItemBrowseSearch {
  const sort = state.sort ?? ITEM_BROWSE_DEFAULT_STATE.sort;
  const search: ItemBrowseSearch = {
    q: state.search,
    page: includePage ? state.page : ITEM_BROWSE_DEFAULT_STATE.page,
    pageSize: state.pageSize,
    sort: sortKey(sort),
  };

  for (const facet of facets) {
    const value = activeFacetFilter({
      facet,
      value: getUrlFacetFilterValue(state.filters[facet.field]),
    });
    if (value !== undefined) search[facet.field] = value;
  }
  return search;
}

export const ITEM_BROWSE_DEFAULT_SEARCH = browseStateToUrl({
  state: ITEM_BROWSE_DEFAULT_STATE,
  facets: [],
});
