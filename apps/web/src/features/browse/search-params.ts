/** Address (URL search) state shared by every browse page. */
import type {
  BrowseSortOption,
  BrowseState,
  FacetFilterValue,
} from '@mapletip/component-library';
import { z } from 'zod';

export const PAGE_SIZE_OPTIONS = [25, 50, 75, 100] as const;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_SEARCH_BYTES = 200;

interface SortKeyOption {
  readonly field: string;
  readonly direction: string;
}

function sortKey({ field, direction }: SortKeyOption): string {
  return `${field}-${direction}`;
}

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

function searchSchemaFor(defaultSort: string) {
  return z
    .object({
      q: z
        .union([z.string(), z.number().finite().transform(String)])
        .refine(
          (query) => new TextEncoder().encode(query).length <= MAX_SEARCH_BYTES,
        )
        .catch(''),
      page: z.coerce.number().int().min(1).max(9999).catch(DEFAULT_PAGE),
      pageSize: z.coerce
        .number()
        .pipe(z.literal(PAGE_SIZE_OPTIONS))
        .catch(DEFAULT_PAGE_SIZE),
      sort: z
        .string()
        .max(100)
        .regex(/^[A-Za-z][A-Za-z0-9]*-(?:asc|desc)$/u)
        .catch(defaultSort),
    })
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
}

/** Validated browse address: the general keys plus one key per facet. */
export type BrowseSearch = z.output<ReturnType<typeof searchSchemaFor>>;

/** Sort options of one browse context; the first is its default order. */
type SortOptions = readonly BrowseSortOption[];

/**
 * Defines a browse page's address: the Standard Schema validator for TanStack
 * `validateSearch`, the default search (for `stripSearchParams`), the matching
 * default browse state, and the conversions between address and browse state.
 * Facet keys are open; FacetedBrowser ignores values for facets it lacks.
 *
 * The conversions accept the current context's sort options and fall back to
 * the page's own when that context has none.
 */
export function defineBrowseSearch({
  sortOptions: pageSortOptions,
}: {
  readonly sortOptions: readonly [BrowseSortOption, ...BrowseSortOption[]];
}) {
  const [pageDefaultSort] = pageSortOptions;
  const defaultSearch = {
    q: '',
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    sort: sortKey(pageDefaultSort),
  } as const;
  const defaultState = {
    search: defaultSearch.q,
    filters: {},
    sort: {
      field: pageDefaultSort.field,
      direction: pageDefaultSort.direction,
    },
    page: defaultSearch.page,
    pageSize: defaultSearch.pageSize,
    hiddenColumns: [],
  } satisfies BrowseState;

  function defaultSortOf(sortOptions: SortOptions): BrowseSortOption {
    return sortOptions[0] ?? pageDefaultSort;
  }

  /** Converts a validated address into browse state. */
  function urlToBrowseState({
    search,
    sortOptions = pageSortOptions,
  }: {
    readonly search: BrowseSearch;
    readonly sortOptions?: SortOptions | undefined;
  }): BrowseState {
    const { q, page, pageSize, sort, ...filters } = search;
    const resolvedSort =
      sortOptions.find((option) => sortKey(option) === sort) ??
      defaultSortOf(sortOptions);

    return {
      ...defaultState,
      search: q,
      filters,
      page,
      pageSize,
      sort: { field: resolvedSort.field, direction: resolvedSort.direction },
    };
  }

  /** Serializes the general keys and all active facet filters. */
  function browseStateToUrl({
    state,
    includePage = true,
    sortOptions = pageSortOptions,
  }: {
    readonly state: BrowseState;
    readonly includePage?: boolean | undefined;
    readonly sortOptions?: SortOptions | undefined;
  }): BrowseSearch {
    const sort = state.sort ?? defaultState.sort;
    const resolvedSort =
      sortOptions.find(
        (option) =>
          option.field === sort.field && option.direction === sort.direction,
      ) ?? defaultSortOf(sortOptions);
    return {
      q: state.search,
      page: includePage ? state.page : defaultSearch.page,
      pageSize: state.pageSize,
      sort: sortKey(resolvedSort),
      ...state.filters,
    };
  }

  return {
    schema: searchSchemaFor(defaultSearch.sort),
    defaultSearch,
    defaultState,
    urlToBrowseState,
    browseStateToUrl,
  };
}

/** One page's address definition. */
export type BrowseSearchDefinition = ReturnType<typeof defineBrowseSearch>;
