/**
 * URL search parameters validation, parser, and serializer for Items Browse.
 *
 * Provides two plain functions:
 * - URL -> BrowseState for a given context (drops invalid params)
 * - BrowseState -> URL (omits defaults)
 */
import type {
  BrowseSortOption,
  BrowseState,
  FacetDefinition,
  FacetFilterValue,
  FacetRangeBucket,
} from '@mapletip/component-library';

import type { ItemRow } from './project';
import { DEFAULT_ITEM_SORT } from './sort';

export interface ItemBrowseSearch {
  readonly q?: string | undefined;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
  readonly sort?: string | undefined;
  readonly [key: string]: unknown;
}

export interface BrowseContext {
  readonly facets: readonly FacetDefinition<ItemRow>[];
  readonly sortOptions: readonly BrowseSortOption[];
  readonly defaultHiddenColumns?: readonly string[] | undefined;
}

export const PAGE_SIZE_OPTIONS = [25, 50, 75, 100] as const;
const PAGE_SIZE_SET = new Set<number>(PAGE_SIZE_OPTIONS);
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSizeOption = 50;

const MAX_SEARCH_BYTES = 200;
const SORT_REGEX = /^([a-zA-Z0-9_]+)-(asc|desc)$/;

function parseSearchQuery(val: unknown): string | undefined {
  let str: string | undefined;
  if (typeof val === 'string') str = val;
  else if (typeof val === 'number') str = String(val);
  if (!str) return undefined;
  const bytes = new TextEncoder().encode(str).length;
  return bytes > 0 && bytes <= MAX_SEARCH_BYTES ? str : undefined;
}

function parseInteger(val: unknown): number | undefined {
  if (typeof val === 'number' && Number.isInteger(val)) return val;
  if (typeof val === 'string' && /^\d+$/.test(val))
    return Number.parseInt(val, 10);
  return undefined;
}

function parseNumber(val: unknown): number | undefined {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim().length > 0) {
    const num = Number.parseFloat(val);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

function parseBoolean(val: unknown): boolean | undefined {
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
}

function parsePage(val: unknown): number | undefined {
  const num = parseInteger(val);
  return num !== undefined && num >= 1 && num <= 9999 ? num : undefined;
}

function parsePageSize(val: unknown): number | undefined {
  const num = parseInteger(val);
  return num !== undefined && PAGE_SIZE_SET.has(num) ? num : undefined;
}

function parseSort(
  val: unknown,
  options: readonly BrowseSortOption[],
): BrowseSortOption | undefined {
  if (typeof val !== 'string') return undefined;
  const match = SORT_REGEX.exec(val);
  if (!match || !match[1] || !match[2]) return undefined;
  return options.find(
    (opt) => opt.field === match[1] && opt.direction === match[2],
  );
}

function parseStringList(val: unknown): readonly string[] {
  if (typeof val === 'number' && Number.isFinite(val)) return [String(val)];
  if (typeof val === 'string' && val.length > 0) {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(val)) {
    return val.flatMap((v) => parseStringList(v));
  }
  return [];
}

export function validateSearch(raw: Record<string, unknown>): ItemBrowseSearch {
  const result: Record<string, unknown> = {};

  const q = parseSearchQuery(raw['q']);
  if (q !== undefined) result['q'] = q;

  const page = parsePage(raw['page']);
  if (page !== undefined) result['page'] = page;

  const pageSize = parsePageSize(raw['pageSize']);
  if (pageSize !== undefined) result['pageSize'] = pageSize;

  const rawSort = raw['sort'];
  if (typeof rawSort === 'string' && SORT_REGEX.test(rawSort)) {
    result['sort'] = rawSort;
  }

  for (const [key, value] of Object.entries(raw)) {
    if (key === 'q' || key === 'page' || key === 'pageSize' || key === 'sort') {
      continue;
    }
    if (key.endsWith('Min') || key.endsWith('Max')) {
      const num = parseNumber(value);
      if (num !== undefined) result[key] = num;
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = value;
      continue;
    }
    if (typeof value === 'boolean') {
      result[key] = value;
      continue;
    }
    const list = parseStringList(value);
    if (list.length > 0) result[key] = list.join(',');
  }

  return result;
}

function parseFacetFilters(
  search: ItemBrowseSearch,
  facets: readonly FacetDefinition<ItemRow>[],
): Record<string, FacetFilterValue> {
  const filters: Record<string, FacetFilterValue> = {};

  for (const facet of facets) {
    if (facet.kind === 'multi-select') {
      const values = parseStringList(search[facet.field]);
      const validValues =
        facet.options === undefined
          ? values
          : values.filter(
              (value) =>
                facet.options?.some((option) => option.value === value) ??
                false,
            );
      if (validValues.length > 0) filters[facet.field] = validValues;
    } else if (facet.kind === 'boolean') {
      const value = parseBoolean(search[facet.field]);
      if (value !== undefined) filters[facet.field] = value;
    } else if (facet.kind === 'range') {
      const bucketValues = parseStringList(search[facet.field]);
      if (bucketValues.length > 0 && facet.buckets !== undefined) {
        if (facet.buckets === 'quantile') {
          filters[facet.field] = bucketValues;
        } else {
          const bucketList: readonly FacetRangeBucket[] = facet.buckets;
          const validBuckets = new Set(bucketList.map((b) => b.value));
          const validValues = bucketValues.filter((v) => validBuckets.has(v));
          if (validValues.length > 0) filters[facet.field] = validValues;
        }
      } else {
        const minNum = parseNumber(search[`${facet.field}Min`]);
        const maxNum = parseNumber(search[`${facet.field}Max`]);

        if (minNum !== undefined && maxNum !== undefined) {
          if (minNum <= maxNum) {
            filters[facet.field] = { min: minNum, max: maxNum };
          }
        } else if (minNum !== undefined) {
          filters[facet.field] = { min: minNum };
        } else if (maxNum !== undefined) {
          filters[facet.field] = { max: maxNum };
        }
      }
    }
  }

  return filters;
}

export function urlToBrowseState(
  search: ItemBrowseSearch,
  context: BrowseContext,
): BrowseState {
  const searchStr = parseSearchQuery(search['q']) ?? '';
  const page = parsePage(search['page']) ?? 1;
  const pageSize = parsePageSize(search['pageSize']) ?? DEFAULT_PAGE_SIZE;

  const parsedSort = parseSort(search['sort'], context.sortOptions);
  const sort: BrowseState['sort'] = parsedSort
    ? { field: parsedSort.field, direction: parsedSort.direction }
    : {
        field: DEFAULT_ITEM_SORT.field,
        direction: DEFAULT_ITEM_SORT.direction,
      };

  return {
    search: searchStr,
    page,
    pageSize,
    filters: parseFacetFilters(search, context.facets),
    hiddenColumns: [],
    sort,
  };
}

function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

export function browseStateToUrl(
  state: BrowseState,
  context: BrowseContext,
): ItemBrowseSearch {
  const url: Record<string, unknown> = {};

  if (state.search.length > 0) url['q'] = state.search;
  if (state.page > 1) url['page'] = state.page;
  if (state.pageSize !== DEFAULT_PAGE_SIZE) url['pageSize'] = state.pageSize;

  if (
    state.sort &&
    (state.sort.field !== DEFAULT_ITEM_SORT.field ||
      state.sort.direction !== DEFAULT_ITEM_SORT.direction)
  ) {
    url['sort'] = `${state.sort.field}-${state.sort.direction}`;
  }

  for (const facet of context.facets) {
    const val = state.filters[facet.field];
    if (facet.kind === 'boolean' && typeof val === 'boolean') {
      url[facet.field] = val;
    } else if (isStringArray(val) && val.length > 0) {
      const first = val[0];
      if (
        val.length === 1 &&
        typeof first === 'string' &&
        /^\d+$/.test(first)
      ) {
        url[facet.field] = Number.parseInt(first, 10);
      } else {
        url[facet.field] = val.join(',');
      }
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      if (
        'min' in val &&
        typeof val.min === 'number' &&
        Number.isFinite(val.min)
      ) {
        url[`${facet.field}Min`] = val.min;
      }
      if (
        'max' in val &&
        typeof val.max === 'number' &&
        Number.isFinite(val.max)
      ) {
        url[`${facet.field}Max`] = val.max;
      }
    }
  }

  return url;
}
