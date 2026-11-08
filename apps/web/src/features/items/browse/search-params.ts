/** Typed URL search validation and conversion for Items Browse. */
import type {
  BrowseState,
  FacetFilterValue,
} from '@mapletip/component-library';

import { ITEM_SORT_OPTIONS } from './sort';

interface NumericRangeFilter {
  readonly min?: number;
  readonly max?: number;
}

type ItemBrowseSearchValue = FacetFilterValue;

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Reflect.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function parseFacetFilter(
  value: unknown,
): readonly string[] | NumericRangeFilter | boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (isUnknownArray(value)) {
    return value.flatMap((entry) => {
      if (typeof entry === 'string') return [entry];
      if (typeof entry === 'number' && Number.isFinite(entry)) {
        return [String(entry)];
      }
      return [];
    });
  }
  return isPlainObject(value) ? value : undefined;
}

const GENERAL_SEARCH_KEYS = new Set(['q', 'page', 'pageSize', 'sort']);

/** Keeps the four general keys and facet values with supported URL shapes. */
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

/** Converts validated URL parameters into the current category's browse state. */
export function urlToBrowseState({
  search,
}: {
  readonly search: ItemBrowseSearch;
}): BrowseState {
  const sort =
    ITEM_SORT_OPTIONS.find((option) => sortKey(option) === search.sort) ??
    ITEM_BROWSE_DEFAULT_STATE.sort;
  const filters: Record<string, FacetFilterValue> = {};

  for (const [field, value] of Object.entries(search)) {
    if (GENERAL_SEARCH_KEYS.has(field)) continue;
    filters[field] = value;
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

/** Serializes the general query keys and all active facet filters. */
export function browseStateToUrl({
  state,
  includePage = true,
}: {
  readonly state: BrowseState;
  readonly includePage?: boolean | undefined;
}): ItemBrowseSearch {
  const sort = state.sort ?? ITEM_BROWSE_DEFAULT_STATE.sort;
  return {
    q: state.search,
    page: includePage ? state.page : ITEM_BROWSE_DEFAULT_STATE.page,
    pageSize: state.pageSize,
    sort: sortKey(sort),
    ...state.filters,
  };
}

export const ITEM_BROWSE_DEFAULT_SEARCH = browseStateToUrl({
  state: ITEM_BROWSE_DEFAULT_STATE,
});
