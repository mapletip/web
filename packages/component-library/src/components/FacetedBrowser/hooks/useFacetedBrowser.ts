import {
  constructTable,
  createColumnHelper,
  useTable,
  type ColumnVisibilityState,
  type PaginationState,
  type Row,
  type SortingState,
  type Table,
} from '@tanstack/react-table';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  SortIntent,
  TableColumn,
  TableProps,
} from '@/components/Table/types';

import {
  EMPTY_FILTERS,
  browseStatesEqual,
  createBrowseState,
  filtersEqual,
  normalizeFilters,
  normalizePageSize,
  toColumnFilters,
  type BrowseState,
} from './browseState';
import type { FacetFilterValue } from './filterTypes';
import {
  disabledSearchFilterFn,
  resolveFields,
  resolveSearchFieldIds,
  searchFilterFn,
  type QueryFieldDefinition,
} from './querySemantics';
import { draftTableFeatures, facetedBrowserFeatures } from './tableFeatures';

export type { BrowseState } from './browseState';
export type {
  QueryField,
  QueryFieldAccessor,
  QueryFieldDefinition,
} from './querySemantics';
export type { FacetFilterValue, NumericRangeFilter } from './filterTypes';

const EMPTY_COLUMNS: readonly never[] = [];
const EMPTY_QUERY_FIELDS: readonly never[] = [];
const EMPTY_HIDDEN_COLUMNS: readonly never[] = [];

export interface UseFacetedBrowserOptions<
  TRecord extends Record<string, unknown>,
> {
  readonly records: readonly TRecord[];
  /**
   * Optional visual column definitions. Required when rendering a Table or ComparisonTable;
   * may be omitted for domains rendering cards exclusively.
   */
  readonly columns?: readonly TableColumn<TRecord>[] | undefined;
  /**
   * Optional queryable field definitions declared independently of visual table columns.
   * Enables filtering, faceting, and sorting on fields not displayed in the table,
   * computed attributes, relationship-derived values, or for card-only domains.
   */
  readonly queryFields?: readonly QueryFieldDefinition<TRecord>[] | undefined;
  readonly idAccessor: keyof TRecord & string;
  readonly identityField?: (keyof TRecord & string) | undefined;
  readonly pageSize?: number | undefined;
  readonly defaultPage?: number | undefined;
  readonly defaultSort?: SortIntent | undefined;
  readonly defaultFilters?: Record<string, FacetFilterValue> | undefined;
  readonly defaultHiddenColumns?: readonly string[] | undefined;
  /** Controlled search query. Pair with `onSearchChange` for `setSearch()` support. */
  readonly search?: string | undefined;
  readonly onSearchChange?: ((search: string) => void) | undefined;
  /** Optional canonical state. When set, this is the sole source of committed values. */
  readonly browseState?: BrowseState | undefined;
  /** Receives a complete canonical state transition when `browseState` is supplied. */
  readonly onBrowseStateChange?: ((state: BrowseState) => void) | undefined;
  readonly searchFields?: readonly (keyof TRecord & string)[] | undefined;
  readonly onSortChange?: ((sort: SortIntent) => void) | undefined;
  readonly onPageChange?: ((page: number) => void) | undefined;
  readonly onFiltersChange?:
    ((filters: Record<string, FacetFilterValue>) => void) | undefined;
}

export interface UseFacetedBrowserReturn<
  TRecord extends Record<string, unknown>,
> {
  /** Underlying TanStack Table v9 instance. */
  readonly table: Table<typeof facetedBrowserFeatures, TRecord>;
  /** Processed records for the current page, consumed by both table and cards. */
  readonly records: readonly TRecord[];
  /** Processed TanStack rows for the current page. */
  readonly rows: readonly Row<typeof facetedBrowserFeatures, TRecord>[];
  /** All filtered and sorted records across all pages before pagination. */
  readonly allFilteredRecords: readonly TRecord[];
  /** Total count of records matching current filters. */
  readonly totalMatchingCount: number;
  /** Total count of starting domain records. */
  readonly totalRecordCount: number;
  /** Current 1-based page number. */
  readonly page: number;
  /** Total number of pages. */
  readonly pageCount: number;
  /** Number of records per page. */
  readonly pageSize: number;
  /** 1-based start index of current page results (e.g. 1). */
  readonly pageStart: number;
  /** 1-based end index of current page results (e.g. 25). */
  readonly pageEnd: number;
  /** Current sort status. */
  readonly sort: SortIntent | undefined;
  /** Update sorting for a column. */
  readonly setSort: (field: string, direction?: 'asc' | 'desc') => void;
  /** Set the current 1-based page. */
  readonly setPage: (page: number) => void;
  /** Change the number of results shown per page. */
  readonly setPageSize: (pageSize: number) => void;
  /** Update the search query. */
  readonly setSearch: (search: string) => void;
  /** Current filter values keyed by column accessor. */
  readonly filters: Record<string, FacetFilterValue>;
  /** Set or clear a filter for a column. */
  readonly setFilter: (field: string, value: FacetFilterValue) => void;
  /** Atomically update multiple facet filters in a single transition. */
  readonly setFilters: (
    filters:
      | Record<string, FacetFilterValue>
      | ((
          prev: Record<string, FacetFilterValue>,
        ) => Record<string, FacetFilterValue>),
  ) => void;
  /** Reset all filters to empty. */
  readonly resetFilters: () => void;
  /** Columns currently visible in original declaration order. */
  readonly visibleColumns: readonly TableColumn<TRecord>[];
  /** Column visibility map. */
  readonly columnVisibility: Record<string, boolean>;
  /** Toggle visibility of a column. */
  readonly setColumnVisibility: (field: string, visible: boolean) => void;
  /** Atomically replace the visible column set. */
  readonly setHiddenColumns: (hiddenColumns: readonly string[]) => void;
  /** Clear search and filters and return to page one in one transition. */
  readonly clearQuery: () => void;
  /** Get faceted count for a specific facet value. */
  readonly getFacetCount: (field: string, value: string) => number;
  /** Get all unique facet values and their counts for a column. */
  readonly getFacetValues: (field: string) => Map<string, number>;
  /**
   * Authoritatively evaluates a candidate draft filter set against current data
   * and search query without mutating committed browser state.
   */
  readonly evaluateDraft: (draftFilters: Record<string, FacetFilterValue>) => {
    readonly matchingCount: number;
    readonly matchingRecords: readonly TRecord[];
    readonly getFacetValues: (field: string) => Map<string, number>;
  };
  /** Ready-to-spread props for Table or ComparisonTable. */
  readonly tableProps: Pick<
    TableProps<TRecord>,
    'records' | 'columns' | 'idAccessor' | 'sortStatus'
  > & {
    readonly onSortChange: (sort: SortIntent) => void;
    readonly identityColumnAccessor?: keyof TRecord & string;
  };
}

function withoutIdentityColumns(
  hiddenColumns: readonly string[],
  idAccessor: string,
  identityField: string | undefined,
): readonly string[] {
  return [
    ...new Set(
      hiddenColumns.filter(
        (field) => field !== idAccessor && field !== identityField,
      ),
    ),
  ];
}

function sortFromState(sort: SortIntent | undefined): SortingState {
  return sort ? [{ id: sort.field, desc: sort.direction === 'desc' }] : [];
}

function sortFromSorting(sorting: SortingState): SortIntent | undefined {
  const first = sorting[0];
  return first
    ? { field: first.id, direction: first.desc ? 'desc' : 'asc' }
    : undefined;
}

function nextSortDirection(
  current: SortIntent | undefined,
  field: string,
  fieldSortDescFirst: boolean | undefined,
  direction: 'asc' | 'desc' | undefined,
): 'asc' | 'desc' {
  if (direction !== undefined) return direction;
  if (current?.field === field) {
    return current.direction === 'asc' ? 'desc' : 'asc';
  }
  return fieldSortDescFirst ? 'desc' : 'asc';
}

export function useFacetedBrowser<TRecord extends Record<string, unknown>>({
  records,
  columns = EMPTY_COLUMNS,
  queryFields = EMPTY_QUERY_FIELDS,
  idAccessor,
  identityField,
  pageSize = 50,
  defaultPage = 1,
  defaultSort,
  defaultFilters = EMPTY_FILTERS,
  defaultHiddenColumns = EMPTY_HIDDEN_COLUMNS,
  search,
  onSearchChange,
  browseState,
  onBrowseStateChange,
  searchFields,
  onSortChange,
  onPageChange,
  onFiltersChange,
}: UseFacetedBrowserOptions<TRecord>): UseFacetedBrowserReturn<TRecord> {
  const initialPageSize = normalizePageSize(pageSize, 50);
  const [internalState, setInternalState] = useState<BrowseState>(() =>
    createBrowseState(
      {
        filters: defaultFilters,
        ...(defaultSort !== undefined ? { sort: defaultSort } : {}),
        page: defaultPage,
        pageSize: initialPageSize,
        hiddenColumns: defaultHiddenColumns,
      },
      initialPageSize,
    ),
  );

  const sourceState = browseState ?? internalState;
  const canonicalState = useMemo(
    () =>
      createBrowseState(
        {
          ...sourceState,
          search: browseState?.search ?? search ?? internalState.search,
        },
        initialPageSize,
      ),
    [
      sourceState,
      browseState?.search,
      search,
      internalState.search,
      initialPageSize,
    ],
  );
  // Event handlers can fire more than once before React commits (for example,
  // two facet removals in one handler). Mirror the last transition so those
  // handlers compose against the latest proposed canonical state. This is not a
  // second source of truth: render always uses canonicalState.
  //
  // Invariants:
  // 1. `canonicalStateRef` holds the last committed canonical state. A layout
  //    effect (not a passive effect) updates it, so it is already current when
  //    the event-turn microtask below runs after a synchronous host acceptance.
  // 2. `latestStateRef` holds the proposal chain for the current event turn.
  //    The microtask ends the turn: if the proposal was not accepted it is
  //    discarded, so a rejected proposal cannot seed the next transition.
  const latestStateRef = useRef(canonicalState);
  const canonicalStateRef = useRef(canonicalState);
  useLayoutEffect(() => {
    latestStateRef.current = canonicalState;
    canonicalStateRef.current = canonicalState;
  }, [canonicalState]);

  const filtersState = canonicalState.filters;
  const hiddenColumns = useMemo(
    () =>
      withoutIdentityColumns(
        canonicalState.hiddenColumns,
        idAccessor,
        identityField,
      ),
    [canonicalState.hiddenColumns, idAccessor, identityField],
  );
  const sorting = useMemo(
    () => sortFromState(canonicalState.sort),
    [canonicalState.sort],
  );
  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: canonicalState.page - 1,
      pageSize: canonicalState.pageSize,
    }),
    [canonicalState.page, canonicalState.pageSize],
  );
  const columnVisibility = useMemo<ColumnVisibilityState>(
    () => Object.fromEntries(hiddenColumns.map((field) => [field, false])),
    [hiddenColumns],
  );

  const emitState = useCallback(
    (nextState: BrowseState): boolean => {
      const next = createBrowseState(nextState, initialPageSize);
      if (browseStatesEqual(latestStateRef.current, next)) return false;
      latestStateRef.current = next;
      if (browseState) {
        if (!onBrowseStateChange) {
          throw new Error(
            'useFacetedBrowser requires onBrowseStateChange with browseState.',
          );
        }
        onBrowseStateChange(next);
        queueMicrotask(() => {
          if (
            browseStatesEqual(latestStateRef.current, next) &&
            !browseStatesEqual(canonicalStateRef.current, next)
          ) {
            latestStateRef.current = canonicalStateRef.current;
          }
        });
      } else {
        setInternalState(next);
      }
      return true;
    },
    [browseState, initialPageSize, onBrowseStateChange],
  );

  const fieldMap = useMemo(
    () =>
      resolveFields({
        columns,
        queryFields,
        idAccessor,
        identityField,
        searchFields,
      }),
    [columns, queryFields, idAccessor, identityField, searchFields],
  );

  const searchFieldIds = useMemo(
    () =>
      resolveSearchFieldIds({
        searchFields,
        identityField,
        idAccessor,
        columns,
        queryFields,
      }),
    [searchFields, identityField, idAccessor, columns, queryFields],
  );

  const globalFilterFn =
    searchFields?.length === 0 ? disabledSearchFilterFn : searchFilterFn;

  const tanstackColumns = useMemo(() => {
    const helper = createColumnHelper<typeof facetedBrowserFeatures, TRecord>();
    return [...fieldMap.values()].map((field) =>
      helper.accessor(field.accessorFn, {
        id: field.id,
        header: field.title ?? field.id,
        enableSorting: field.enableSorting,
        sortDescFirst: field.sortDescFirst,
        sortUndefined: 'last',
        enableHiding: !field.isIdentity,
        enableGlobalFilter: searchFieldIds.has(field.id),
        filterFn: field.filterFn,
        getUniqueValues: field.getUniqueValues,
      }),
    );
  }, [fieldMap, searchFieldIds]);

  const columnFilters = useMemo(
    () => toColumnFilters(filtersState),
    [filtersState],
  );

  const effectiveSorting = useMemo<SortingState>(() => {
    if (sorting.length === 0) return [{ id: idAccessor, desc: false }];
    if (sorting.some((entry) => entry.id === idAccessor)) return sorting;
    return [...sorting, { id: idAccessor, desc: false }];
  }, [sorting, idAccessor]);

  const commitSort = useCallback(
    (
      nextSort: SortIntent | undefined,
      options: { readonly emitCallback: boolean },
    ) => {
      const current = latestStateRef.current;
      const nextState: BrowseState = {
        search: current.search,
        filters: current.filters,
        page: 1,
        pageSize: current.pageSize,
        hiddenColumns: current.hiddenColumns,
        ...(nextSort ? { sort: nextSort } : {}),
      };
      if (!emitState(nextState)) return;

      if (options.emitCallback && nextSort) onSortChange?.(nextSort);
      if (current.page !== 1) onPageChange?.(1);
    },
    [emitState, onPageChange, onSortChange],
  );

  const setSort = useCallback(
    (field: string, direction?: 'asc' | 'desc') => {
      const state = latestStateRef.current;
      const current = state.sort;
      const currentField = fieldMap.get(field);
      if (!currentField?.enableSorting) return;
      const nextDirection = nextSortDirection(
        current,
        field,
        currentField?.sortDescFirst,
        direction,
      );

      if (current?.field === field && current.direction === nextDirection) {
        return;
      }
      commitSort({ field, direction: nextDirection }, { emitCallback: true });
    },
    [commitSort, fieldMap],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      if (!Number.isFinite(nextPage)) return;
      const current = latestStateRef.current;
      const page = Math.max(1, Math.floor(nextPage));
      if (page === current.page) return;
      if (emitState({ ...current, page })) {
        onPageChange?.(page);
      }
    },
    [emitState, onPageChange],
  );

  const setPageSize = useCallback(
    (nextPageSize: number) => {
      const current = latestStateRef.current;
      const nextSize = normalizePageSize(nextPageSize, current.pageSize);
      if (nextSize === current.pageSize) return;
      if (
        emitState({
          ...current,
          page: 1,
          pageSize: nextSize,
        }) &&
        current.page !== 1
      ) {
        onPageChange?.(1);
      }
    },
    [emitState, onPageChange],
  );

  const setSearch = useCallback(
    (nextSearch: string) => {
      const current = latestStateRef.current;
      if (nextSearch === current.search) return;

      if (!browseState && search !== undefined && !onSearchChange) {
        throw new Error(
          'useFacetedBrowser: setSearch requires onSearchChange when search is controlled.',
        );
      }
      emitState({ ...current, search: nextSearch, page: 1 });
      if (!browseState && search !== undefined) {
        onSearchChange?.(nextSearch);
      }

      if (current.page !== 1) onPageChange?.(1);
    },
    [browseState, emitState, onPageChange, onSearchChange, search],
  );

  const setFilters = useCallback(
    (
      updater:
        | Record<string, FacetFilterValue>
        | ((
            previous: Record<string, FacetFilterValue>,
          ) => Record<string, FacetFilterValue>),
    ) => {
      const current = latestStateRef.current;
      const candidate =
        typeof updater === 'function' ? updater(current.filters) : updater;
      const nextFilters = normalizeFilters(candidate);
      if (filtersEqual(current.filters, nextFilters)) return;

      const changed = emitState({
        ...current,
        filters: nextFilters,
        page: 1,
      });
      if (!changed) return;
      onFiltersChange?.(nextFilters);
      if (current.page !== 1) onPageChange?.(1);
    },
    [emitState, onFiltersChange, onPageChange],
  );

  const setFilter = useCallback(
    (field: string, value: FacetFilterValue) => {
      setFilters((previous) => ({ ...previous, [field]: value }));
    },
    [setFilters],
  );

  const resetFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  const setHiddenColumns = useCallback(
    (nextHiddenColumns: readonly string[]) => {
      const current = latestStateRef.current;
      const nextHidden = withoutIdentityColumns(
        nextHiddenColumns,
        idAccessor,
        identityField,
      );
      const currentHidden = new Set(current.hiddenColumns);
      if (
        nextHidden.length === currentHidden.size &&
        nextHidden.every((field) => currentHidden.has(field))
      ) {
        return;
      }
      const visibleDataColumns = columns.filter(
        (column) =>
          column.accessor !== idAccessor &&
          column.accessor !== identityField &&
          !nextHidden.includes(column.accessor),
      );
      if (columns.length > 0 && visibleDataColumns.length === 0) return;
      emitState({ ...current, hiddenColumns: nextHidden });
    },
    [columns, emitState, idAccessor, identityField],
  );

  const clearQuery = useCallback(() => {
    const current = latestStateRef.current;
    if (
      current.search === '' &&
      Object.keys(current.filters).length === 0 &&
      current.page === 1
    ) {
      return;
    }
    if (
      !browseState &&
      search !== undefined &&
      current.search !== '' &&
      !onSearchChange
    ) {
      throw new Error(
        'useFacetedBrowser: clearQuery requires onSearchChange when search is controlled.',
      );
    }

    const hadFilters = Object.keys(current.filters).length > 0;
    if (
      emitState({
        ...current,
        search: '',
        filters: {},
        page: 1,
      })
    ) {
      if (!browseState && search !== undefined && current.search !== '') {
        onSearchChange?.('');
      }
      if (hadFilters) onFiltersChange?.({});
      if (current.page !== 1) onPageChange?.(1);
    }
  }, [
    browseState,
    emitState,
    onFiltersChange,
    onPageChange,
    onSearchChange,
    search,
  ]);

  const setColumnVisibility = useCallback(
    (field: string, visible: boolean) => {
      if (field === idAccessor || field === identityField) return;
      const current = latestStateRef.current;
      const currentlyVisible = !current.hiddenColumns.includes(field);
      if (currentlyVisible === visible) return;
      const nextHidden = visible
        ? current.hiddenColumns.filter((hiddenField) => hiddenField !== field)
        : [...current.hiddenColumns, field];
      setHiddenColumns(nextHidden);
    },
    [idAccessor, identityField, setHiddenColumns],
  );

  const handleColumnVisibilityChange = useCallback(
    (
      updater:
        | ColumnVisibilityState
        | ((old: ColumnVisibilityState) => ColumnVisibilityState),
    ) => {
      const current = latestStateRef.current;
      const currentVisibility = Object.fromEntries(
        withoutIdentityColumns(
          current.hiddenColumns,
          idAccessor,
          identityField,
        ).map((field) => [field, false]),
      );
      const requested =
        typeof updater === 'function' ? updater(currentVisibility) : updater;
      const nextHidden = Object.entries(requested)
        .filter(([, visible]) => visible === false)
        .map(([field]) => field)
        .filter((field) => field !== idAccessor && field !== identityField);
      setHiddenColumns(nextHidden);
    },
    [idAccessor, identityField, setHiddenColumns],
  );

  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const current = latestStateRef.current;
      const currentSorting = sortFromState(current.sort);
      const next =
        typeof updater === 'function' ? updater(currentSorting) : updater;
      const nextSort = sortFromSorting(next);
      commitSort(nextSort, { emitCallback: true });
    },
    [commitSort],
  );

  const handlePaginationChange = useCallback(
    (
      updater: PaginationState | ((old: PaginationState) => PaginationState),
    ) => {
      const current = latestStateRef.current;
      const currentPagination = {
        pageIndex: current.page - 1,
        pageSize: current.pageSize,
      };
      const next =
        typeof updater === 'function' ? updater(currentPagination) : updater;
      const page = Math.max(1, next.pageIndex + 1);
      const nextSize = normalizePageSize(next.pageSize, current.pageSize);
      if (page === current.page && nextSize === current.pageSize) return;
      if (
        emitState({ ...current, page, pageSize: nextSize }) &&
        page !== current.page
      ) {
        onPageChange?.(page);
      }
    },
    [emitState, onPageChange],
  );

  const table = useTable({
    features: facetedBrowserFeatures,
    columns: tanstackColumns,
    data: records,
    globalFilterFn,
    // The integrated owner resets page atomically with search/filter/sort
    // transitions. TanStack must not emit a second independent page change.
    autoResetPageIndex: false,
    getRowId: (row) => String(row[idAccessor]),
    state: {
      sorting: effectiveSorting,
      pagination,
      columnFilters,
      globalFilter: canonicalState.search,
      columnVisibility,
    },
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
  });

  // Clamping is a synchronization step: a host can restore an out-of-range
  // page while records or filters are replaced. One correction per state/data
  // combination; the key also absorbs StrictMode's repeated effect setup.
  const pageCount = table.getPageCount();
  const lastClampRef = useRef('');
  const lastRecordsRef = useRef(records);
  useEffect(() => {
    if (lastRecordsRef.current !== records) {
      lastRecordsRef.current = records;
      lastClampRef.current = '';
    }
    const clampedPage = Math.max(1, pageCount);
    if (canonicalState.page <= clampedPage) {
      lastClampRef.current = '';
      return;
    }
    const key = `${canonicalState.page}:${pageCount}:${records.length}`;
    if (lastClampRef.current === key) return;
    lastClampRef.current = key;
    if (emitState({ ...canonicalState, page: clampedPage })) {
      onPageChange?.(clampedPage);
    }
  }, [canonicalState, emitState, onPageChange, pageCount, records]);

  const getFacetValues = useCallback(
    (field: string): Map<string, number> => {
      const column = table.getColumn(field);
      if (!column) return new Map();
      return new Map(
        [...column.getFacetedUniqueValues()].map(([value, count]) => [
          String(value),
          count,
        ]),
      );
    },
    [table],
  );

  const getFacetCount = useCallback(
    (field: string, value: string): number =>
      getFacetValues(field).get(value) ?? 0,
    [getFacetValues],
  );

  // Evaluate a draft through TanStack's real filter pipeline without mutating
  // the committed table instance or manufacturing synthetic rows.
  const evaluateDraft = useCallback(
    (draftFilters: Record<string, FacetFilterValue>) => {
      const draftTable = constructTable({
        features: draftTableFeatures,
        columns: tanstackColumns,
        data: records,
        globalFilterFn,
        getRowId: (row) => String(row[idAccessor]),
        state: {
          columnFilters: toColumnFilters(draftFilters),
          globalFilter: canonicalState.search,
        },
      });
      const matchingRecords = draftTable
        .getFilteredRowModel()
        .rows.map((row) => row.original);

      return {
        matchingCount: matchingRecords.length,
        matchingRecords,
        getFacetValues: (field: string): Map<string, number> => {
          const column = draftTable.getColumn(field);
          if (!column) return new Map();
          return new Map(
            [...column.getFacetedUniqueValues()].map(([value, count]) => [
              String(value),
              count,
            ]),
          );
        },
      };
    },
    [
      records,
      tanstackColumns,
      canonicalState.search,
      idAccessor,
      globalFilterFn,
    ],
  );

  const paginatedRows = table.getRowModel().rows;
  const processedRecords = useMemo(
    () => paginatedRows.map((row) => row.original),
    [paginatedRows],
  );
  const allFilteredRows = table.getPrePaginatedRowModel().rows;
  const allFilteredRecords = useMemo(
    () => allFilteredRows.map((row) => row.original),
    [allFilteredRows],
  );

  const totalMatchingCount = allFilteredRecords.length;
  const page = canonicalState.page;
  const pageStart =
    totalMatchingCount === 0 ? 0 : (page - 1) * canonicalState.pageSize + 1;
  const pageEnd = Math.min(page * canonicalState.pageSize, totalMatchingCount);

  const visibleColumns = useMemo(
    () =>
      columns.filter((column) => columnVisibility[column.accessor] !== false),
    [columns, columnVisibility],
  );

  const tableColumns = useMemo(
    () =>
      visibleColumns.map((column) => {
        const field = fieldMap.get(column.accessor);
        return field
          ? {
              ...column,
              sortable: field.enableSorting,
              firstSortDirection: field.sortDescFirst
                ? ('desc' as const)
                : ('asc' as const),
            }
          : column;
      }),
    [fieldMap, visibleColumns],
  );

  const handleTableSortChange = useCallback(
    (nextSort: SortIntent) => {
      // The renderer reports the visual column's direction. Resolve the field's
      // declared/overridden first direction inside the browser so query fields
      // remain authoritative for integrated tables.
      setSort(nextSort.field);
    },
    [setSort],
  );

  const tableProps = useMemo<UseFacetedBrowserReturn<TRecord>['tableProps']>(
    () => ({
      records: processedRecords,
      columns: tableColumns,
      idAccessor,
      ...(identityField !== undefined
        ? { identityColumnAccessor: identityField }
        : {}),
      ...(canonicalState.sort !== undefined
        ? { sortStatus: canonicalState.sort }
        : {}),
      onSortChange: handleTableSortChange,
    }),
    [
      processedRecords,
      tableColumns,
      idAccessor,
      identityField,
      canonicalState.sort,
      handleTableSortChange,
    ],
  );

  return {
    table,
    records: processedRecords,
    rows: paginatedRows,
    allFilteredRecords,
    totalMatchingCount,
    totalRecordCount: records.length,
    page,
    pageCount: Math.max(1, pageCount),
    pageSize: canonicalState.pageSize,
    pageStart,
    pageEnd,
    sort: canonicalState.sort,
    setSort,
    setPage,
    setPageSize,
    setSearch,
    filters: filtersState,
    setFilter,
    setFilters,
    resetFilters,
    visibleColumns,
    columnVisibility,
    setColumnVisibility,
    setHiddenColumns,
    clearQuery,
    getFacetCount,
    getFacetValues,
    evaluateDraft,
    tableProps,
  };
}
