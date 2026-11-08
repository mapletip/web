/** Typed URL search validation and conversion for Items Browse. */
import type { BrowseState } from '@mapletip/component-library';

import { ITEM_SORT_OPTIONS } from './sort';

export interface ItemBrowseSearch {
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

/** Drops invalid values and unknown keys from the four supported URL fields. */
export function validateSearch(raw: Record<string, unknown>): ItemBrowseSearch {
  const sort = parseSort(raw['sort']) ?? ITEM_BROWSE_DEFAULT_STATE.sort;
  return {
    q: parseSearchQuery(raw['q']) ?? ITEM_BROWSE_DEFAULT_STATE.search,
    page: parsePage(raw['page']) ?? ITEM_BROWSE_DEFAULT_STATE.page,
    pageSize:
      parsePageSize(raw['pageSize']) ?? ITEM_BROWSE_DEFAULT_STATE.pageSize,
    sort: sortKey(sort),
  };
}

export interface UrlToBrowseStateOptions {
  readonly search: ItemBrowseSearch;
}

/** Converts validated URL parameters to the complete controlled browse state. */
export function urlToBrowseState({
  search,
}: UrlToBrowseStateOptions): BrowseState {
  const sort =
    ITEM_SORT_OPTIONS.find((option) => sortKey(option) === search.sort) ??
    ITEM_BROWSE_DEFAULT_STATE.sort;

  return {
    ...ITEM_BROWSE_DEFAULT_STATE,
    search: search.q,
    page: search.page,
    pageSize: search.pageSize,
    sort: { field: sort.field, direction: sort.direction },
  };
}

export interface BrowseStateToUrlOptions {
  readonly state: BrowseState;
  readonly includePage?: boolean | undefined;
}

/** Converts controlled state to URL parameters; the route strips defaults. */
export function browseStateToUrl({
  state,
  includePage = true,
}: BrowseStateToUrlOptions): ItemBrowseSearch {
  const sort = state.sort ?? ITEM_BROWSE_DEFAULT_STATE.sort;
  return {
    q: state.search,
    page: includePage ? state.page : ITEM_BROWSE_DEFAULT_STATE.page,
    pageSize: state.pageSize,
    sort: sortKey(sort),
  };
}

export const ITEM_BROWSE_DEFAULT_SEARCH = browseStateToUrl({
  state: ITEM_BROWSE_DEFAULT_STATE,
});
