/** Typed URL search validation and conversion for Items Browse. */
import type {
  BrowseState,
  FacetFilterValue,
} from '@mapletip/component-library';
import { z } from 'zod';

import { ITEM_SORT_OPTIONS } from './sort';

export const PAGE_SIZE_OPTIONS = [25, 50, 75, 100] as const;

const MAX_SEARCH_BYTES = 200;

interface SortKeyOption {
  readonly field: string;
  readonly direction: string;
}

function sortKey({ field, direction }: SortKeyOption): string {
  return `${field}-${direction}`;
}

const defaultSortKey = sortKey(ITEM_SORT_OPTIONS[0]);

export const ITEM_BROWSE_DEFAULT_SEARCH = {
  q: '',
  page: 1,
  pageSize: 50,
  sort: defaultSortKey,
} as const;

export const ITEM_BROWSE_DEFAULT_STATE = {
  search: ITEM_BROWSE_DEFAULT_SEARCH.q,
  filters: {},
  sort: {
    field: ITEM_SORT_OPTIONS[0].field,
    direction: ITEM_SORT_OPTIONS[0].direction,
  },
  page: ITEM_BROWSE_DEFAULT_SEARCH.page,
  pageSize: ITEM_BROWSE_DEFAULT_SEARCH.pageSize,
  hiddenColumns: [],
} satisfies BrowseState;

const facetArraySchema = z
  .array(
    z
      .union([z.string(), z.number().finite().transform(String)])
      .optional()
      .catch(undefined),
  )
  .transform((values) => values.filter((value) => value !== undefined));

const facetObjectSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
  })
  .strict()
  .transform(({ min, max }) => ({
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
  }));

// TanStack types Link `search` from the schema *input*; the identity preprocess
// keeps facet inputs `unknown` so links can pass library filter values.
const facetFilterValueSchema = z.preprocess(
  (value) => value,
  z
    .union([facetArraySchema, z.boolean(), facetObjectSchema])
    .optional()
    .catch(undefined),
);

const itemBrowseSearchFields = z.object({
  q: z
    .union([z.string(), z.number().finite().transform(String)])
    .refine(
      (query) => new TextEncoder().encode(query).length <= MAX_SEARCH_BYTES,
    )
    .catch(ITEM_BROWSE_DEFAULT_SEARCH.q),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(9999)
    .catch(ITEM_BROWSE_DEFAULT_SEARCH.page),
  pageSize: z.coerce
    .number()
    .pipe(z.literal(PAGE_SIZE_OPTIONS))
    .catch(ITEM_BROWSE_DEFAULT_SEARCH.pageSize),
  sort: z.literal(ITEM_SORT_OPTIONS.map(sortKey)).catch(defaultSortKey),
});

/** Standard Schema validator for the Items Browse route's search params. */
export const itemBrowseSearchSchema = itemBrowseSearchFields
  .catchall(facetFilterValueSchema)
  .transform(({ q, page, pageSize, sort, ...filters }) => {
    const definedFilters = Object.entries(filters).reduce<
      Record<string, FacetFilterValue>
    >((result, [field, value]) => {
      if (value !== undefined) result[field] = value;
      return result;
    }, {});

    return { q, page, pageSize: Number(pageSize), sort, ...definedFilters };
  });

export type ItemBrowseSearch = z.output<typeof itemBrowseSearchSchema>;

/** Converts validated URL parameters into the current category's browse state. */
export function urlToBrowseState({
  search,
}: {
  readonly search: ItemBrowseSearch;
}): BrowseState {
  const { q, page, pageSize, sort, ...parsedFilters } = search;
  const resolvedSort =
    ITEM_SORT_OPTIONS.find((option) => sortKey(option) === sort) ??
    ITEM_SORT_OPTIONS[0];

  return {
    ...ITEM_BROWSE_DEFAULT_STATE,
    search: q,
    filters: parsedFilters,
    page,
    pageSize,
    sort: { field: resolvedSort.field, direction: resolvedSort.direction },
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
  const sortIndex = ITEM_SORT_OPTIONS.findIndex(
    (option) =>
      option.field === sort.field && option.direction === sort.direction,
  );
  return {
    q: state.search,
    page: includePage ? state.page : ITEM_BROWSE_DEFAULT_SEARCH.page,
    pageSize: state.pageSize,
    sort: sortKey(ITEM_SORT_OPTIONS[sortIndex] ?? ITEM_SORT_OPTIONS[0]),
    ...state.filters,
  };
}
