import { Group, Stack, TextInput, Title } from '@mantine/core';
import { MagnifyingGlass } from '@phosphor-icons/react';
import type {
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { ActiveFilters } from '@/components/FacetedBrowser/ActiveFilters/ActiveFilters';
import type { ActiveFacetChip } from '@/components/FacetedBrowser/ActiveFilters/facetChips';
import {
  activeValueCount,
  countActiveFilters,
} from '@/components/FacetedBrowser/ActiveFilters/facetChips';
import { FacetList } from '@/components/FacetedBrowser/FacetControls/FacetList';
import { resolveFacets } from '@/components/FacetedBrowser/FacetControls/resolveFacets';
import type { FacetDefinition } from '@/components/FacetedBrowser/FacetControls/types';
import classes from '@/components/FacetedBrowser/FacetedBrowser.module.css';
import type { FacetedBrowserProps } from '@/components/FacetedBrowser/FacetedBrowser.types';
import { FilterDrawer } from '@/components/FacetedBrowser/FilterDrawer/FilterDrawer';
import {
  createBrowseState,
  type BrowseState,
} from '@/components/FacetedBrowser/hooks/browseState';
import { isInvalidNumericRange } from '@/components/FacetedBrowser/hooks/filterTypes';
import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';
import { resolveFields } from '@/components/FacetedBrowser/hooks/querySemantics';
import { useFacetedBrowser } from '@/components/FacetedBrowser/hooks/useFacetedBrowser';
import { useFacetedBrowserDrawer } from '@/components/FacetedBrowser/hooks/useFacetedBrowserDrawer';
import { Layout } from '@/components/FacetedBrowser/Layout/Layout';
import { Pagination } from '@/components/FacetedBrowser/Pagination/Pagination';
import { QuickFacets } from '@/components/FacetedBrowser/QuickFacets/QuickFacets';
import { Status, hasStatus } from '@/components/FacetedBrowser/Status/Status';
import {
  formatSummaryText,
  Summary,
} from '@/components/FacetedBrowser/Summary/Summary';
import {
  PageSizeSelect,
  SortSelect,
  Toolbar,
} from '@/components/FacetedBrowser/Toolbar/Toolbar';
import { ComparisonTable } from '@/components/Table';
import {
  deriveTableStorageKey,
  resolveTableStorageKey,
} from '@/components/Table/tableStorageKey';

const EMPTY_FACETS: readonly never[] = [];
const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const EMPTY_COLUMNS: readonly never[] = [];
const EMPTY_HIDDEN_COLUMNS: readonly never[] = [];
const EMPTY_QUERY_FIELDS: readonly never[] = [];

function fallbackPageSize(pageSizeOptions: readonly number[]): number {
  const preferred = pageSizeOptions.includes(50)
    ? 50
    : (pageSizeOptions[0] ?? 50);
  return Math.max(1, Math.floor(preferred));
}

function invalidDraftFilter<TRecord extends Record<string, unknown>>(
  facets: readonly FacetDefinition<TRecord>[],
  filters: Readonly<Record<string, FacetFilterValue>>,
): boolean {
  return facets.some((facet) => {
    if (facet.kind !== 'range') return false;
    return isInvalidNumericRange(filters[facet.field]);
  });
}

export function FacetedBrowser<TRecord extends Record<string, unknown>>(
  props: FacetedBrowserProps<TRecord>,
): ReactElement {
  const {
    title,
    records,
    idAccessor,
    queryFields,
    searchFields,
    facets: facetDefinitions = EMPTY_FACETS,
    recordNoun = 'records',
    sortOptions,
    railNavigation,
    summaryNoun,
    summaryMode = 'page-window',
    resultsLabel = `${recordNoun} results`,
    searchLabel = `Search ${recordNoun}`,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    status,
    loading = false,
    error,
    unavailable,
    onRetry,
    emptyState,
    drawerContent,
    getPageHref,
    tableStorageKey,
    fillHeight = false,
    state: controlledState,
    onStateChange,
    defaultState,
    drawerOpened: controlledDrawerOpened,
    onDrawerOpenedChange,
  } = props;

  const controlled = controlledState !== undefined;
  if (controlled && typeof onStateChange !== 'function') {
    throw new Error(
      'FacetedBrowser: state requires onStateChange in controlled mode.',
    );
  }
  if (
    (controlledDrawerOpened === undefined) !==
    (onDrawerOpenedChange === undefined)
  ) {
    throw new Error(
      'FacetedBrowser: drawerOpened and onDrawerOpenedChange must be supplied together.',
    );
  }

  const comparisonProps =
    props.presentation === 'comparison' ? props : undefined;
  const columns = comparisonProps?.columns ?? EMPTY_COLUMNS;
  const identityField = comparisonProps?.identityField;
  const fallbackSize = fallbackPageSize(pageSizeOptions);
  const [internalState, setInternalState] = useState<BrowseState>(() =>
    createBrowseState(controlled ? undefined : defaultState, fallbackSize),
  );
  const [initialDefaultHiddenColumns] = useState(() => [
    ...(defaultState?.hiddenColumns ?? EMPTY_HIDDEN_COLUMNS),
  ]);
  const browseState = controlled ? controlledState : internalState;
  const changeBrowseState = useCallback(
    (nextState: BrowseState) => {
      if (!controlled) setInternalState(nextState);
      onStateChange?.(nextState);
    },
    [controlled, onStateChange],
  );

  // Field semantics are resolved once here: quantile buckets read the same
  // accessors the hook uses, and the resolved facets are the single source for
  // rendering, chips, counts and filter registration.
  const resolvedFields = useMemo(
    () =>
      resolveFields({
        columns,
        queryFields: queryFields ?? EMPTY_QUERY_FIELDS,
        idAccessor,
        identityField,
        searchFields,
      }),
    [columns, queryFields, idAccessor, identityField, searchFields],
  );
  const resolved = useMemo(
    () =>
      resolveFacets({
        facets: facetDefinitions,
        queryFields: queryFields ?? EMPTY_QUERY_FIELDS,
        records,
        fieldAccessors: resolvedFields,
      }),
    [facetDefinitions, queryFields, records, resolvedFields],
  );
  const facets = resolved.facets;
  const resolvedQueryFields = resolved.queryFields;

  const browser = useFacetedBrowser({
    records,
    ...(columns.length > 0 ? { columns } : {}),
    ...(resolvedQueryFields.length > 0
      ? { queryFields: resolvedQueryFields }
      : {}),
    idAccessor,
    ...(identityField ? { identityField } : {}),
    ...(searchFields ? { searchFields } : {}),
    browseState,
    onBrowseStateChange: changeBrowseState,
  });

  const [internalDrawerOpened, setInternalDrawerOpened] = useState(false);
  const drawerControlled = controlledDrawerOpened !== undefined;
  const drawerOpened = drawerControlled
    ? controlledDrawerOpened
    : internalDrawerOpened;
  const updateDrawerOpened = useCallback(
    (opened: boolean) => {
      if (!drawerControlled) {
        setInternalDrawerOpened(opened);
      }
      onDrawerOpenedChange?.(opened);
    },
    [drawerControlled, onDrawerOpenedChange],
  );

  // Storage-only instance token. It never reaches markup, so a per-mount value
  // is safe under SSR/hydration and prevents cross-page localStorage collisions.
  const statusActive = hasStatus({
    status,
    loading,
    error,
    unavailable,
  });
  const drawerTitleRef = useRef<HTMLHeadingElement>(null);
  const filterIsInvalid = useCallback(
    (filters: Readonly<Record<string, FacetFilterValue>>) =>
      invalidDraftFilter(facets, filters),
    [facets],
  );
  const drawer = useFacetedBrowserDrawer({
    opened: drawerOpened,
    onOpenedChange: updateDrawerOpened,
    committedState: browseState,
    statusActive,
    filterIsInvalid,
    evaluateDraft: browser.evaluateDraft,
    commitFilters: browser.setFilters,
  });

  const shownDrawerFacet = facets.find(
    (facet) => facet.id === drawer.focusedFacetId,
  );
  const drawerFacets = shownDrawerFacet ? [shownDrawerFacet] : facets;

  // Facet controls keep local UI state that is not part of canonical filter state
  // (an opened-but-empty Custom range, for example). A deliberate reset must clear
  // that too, including when the facet's own filter was already empty; remounting
  // the facet list is the smallest boundary that guarantees it.
  const [facetResetEpoch, setFacetResetEpoch] = useState(0);
  const resetFacetUi = useCallback(() => {
    setFacetResetEpoch((epoch) => epoch + 1);
  }, []);
  const { resetFilters: resetBrowserFilters, clearQuery: clearBrowserQuery } =
    browser;
  const { reset: resetDrawerDraft } = drawer;
  const clearAllFilters = useCallback(() => {
    resetFacetUi();
    resetBrowserFilters();
  }, [resetBrowserFilters, resetFacetUi]);
  const clearQuery = useCallback(() => {
    resetFacetUi();
    clearBrowserQuery();
  }, [clearBrowserQuery, resetFacetUi]);
  const drawerReset = useCallback(() => {
    resetFacetUi();
    resetDrawerDraft();
  }, [resetDrawerDraft, resetFacetUi]);
  const removeChip = useCallback(
    (chip: ActiveFacetChip) => {
      if (chip.removeValue === undefined) {
        browser.setFilter(chip.field, undefined);
        return;
      }
      browser.setFilters((previous) => {
        const value = previous[chip.field];
        if (!Array.isArray(value)) return previous;
        return {
          ...previous,
          [chip.field]: value.filter(
            (candidate) => candidate !== chip.removeValue,
          ),
        };
      });
    },
    [browser],
  );

  const closeDrawer = drawer.close;
  const handleDrawerContentClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest('a[href]');
      if (anchor && anchor.getAttribute('href') !== '#') {
        closeDrawer();
      }
    },
    [closeDrawer],
  );

  // Widths use one stable bucket per logical table shape. Visibility stays in
  // canonical BrowseState and is never part of the storage key.
  const tableStoreColumnsKey = useMemo(
    () =>
      resolveTableStorageKey(tableStorageKey, () =>
        deriveTableStorageKey({
          columns,
          idAccessor: String(idAccessor),
          ...(identityField !== undefined
            ? { identityField: String(identityField) }
            : {}),
        }),
      ),
    [tableStorageKey, columns, idAccessor, identityField],
  );
  const hasActiveQuery =
    browseState.search.trim().length > 0 ||
    Object.keys(browseState.filters).length > 0;

  const activeFilterCount = countActiveFilters(browseState.filters);
  const quickFacets = facets
    .filter((facet) => facet.quick)
    .map((facet) => ({
      id: facet.id,
      label: facet.label,
      active: activeValueCount(browseState.filters[facet.field]),
    }));

  const { pendingCount, getDraftFacetValues } = drawer;
  const getCommittedFacetValues = browser.getFacetValues;
  const drawerCounts = useCallback(
    (field: string) =>
      pendingCount === undefined
        ? getCommittedFacetValues(field)
        : getDraftFacetValues(field),
    [getCommittedFacetValues, getDraftFacetValues, pendingCount],
  );

  const table = comparisonProps ? (
    <ComparisonTable
      ariaLabel={comparisonProps.tableLabel ?? `${recordNoun} comparison`}
      {...browser.tableProps}
      height="100%"
      identityField={comparisonProps.identityField}
      storeColumnsKey={tableStoreColumnsKey}
      {...(comparisonProps.tableMaxHeight !== undefined
        ? { maxHeight: comparisonProps.tableMaxHeight }
        : {})}
      {...(comparisonProps.rowExpansionContent
        ? { rowExpansionContent: comparisonProps.rowExpansionContent }
        : {})}
    />
  ) : undefined;

  const cardResults =
    props.presentation === 'comparison' || props.presentation === 'cards' ? (
      <div
        className={classes['cards']}
        role="list"
        aria-label={`${recordNoun} cards`}
      >
        {browser.records.map((record) => (
          <div role="listitem" key={String(record[idAccessor])}>
            {props.renderCard(record)}
          </div>
        ))}
      </div>
    ) : undefined;
  const customResults =
    props.presentation === 'custom'
      ? props.renderResults({ records: browser.records, state: browseState })
      : undefined;

  // A short noun may replace the descriptive `recordNoun` in the summary only.
  const summaryText = formatSummaryText({
    mode: summaryMode,
    pageStart: browser.pageStart,
    pageEnd: browser.pageEnd,
    total: browser.totalMatchingCount,
    noun:
      browser.totalMatchingCount === 1
        ? (summaryNoun?.one ?? recordNoun)
        : (summaryNoun?.other ?? recordNoun),
  });
  const statusContent =
    statusActive || browser.totalMatchingCount === 0 ? (
      <Status
        status={status}
        loading={loading}
        error={error}
        unavailable={unavailable}
        emptyState={emptyState}
        totalCount={browser.totalMatchingCount}
        hasActiveQuery={hasActiveQuery}
        recordNoun={recordNoun}
        onRetry={onRetry}
        onClearFilters={clearQuery}
      />
    ) : undefined;

  let railContent: ReactNode;
  if (railNavigation || facets.length > 0) {
    railContent = (
      <Stack gap="md">
        {railNavigation}
        {facets.length > 0 ? (
          <>
            <Title order={2} size="h4">
              Filters
            </Title>
            <FacetList
              key={facetResetEpoch}
              facets={facets}
              values={browseState.filters}
              records={records}
              surface="rail"
              getCounts={browser.getFacetValues}
              onChange={browser.setFilter}
            />
          </>
        ) : null}
      </Stack>
    );
  }

  let toolbarContent: ReactNode;
  if (comparisonProps) {
    toolbarContent = (
      <Toolbar
        columns={columns}
        idAccessor={idAccessor}
        identityField={comparisonProps.identityField}
        hiddenColumns={browseState.hiddenColumns}
        defaultHiddenColumns={initialDefaultHiddenColumns}
        recordNoun={recordNoun}
        pageSize={browser.pageSize}
        pageSizeOptions={pageSizeOptions}
        sortOptions={sortOptions}
        currentSort={browseState.sort}
        onHiddenColumnsChange={browser.setHiddenColumns}
        onColumnVisibilityChange={browser.setColumnVisibility}
        onPageSizeChange={browser.setPageSize}
        onSortChange={browser.setSort}
      />
    );
  } else if (sortOptions && sortOptions.length > 0) {
    toolbarContent = (
      <Group gap="xs">
        <SortSelect
          sortOptions={sortOptions}
          currentSort={browseState.sort}
          onChange={browser.setSort}
        />
        <PageSizeSelect
          recordNoun={recordNoun}
          pageSize={browser.pageSize}
          pageSizeOptions={pageSizeOptions}
          onChange={browser.setPageSize}
        />
      </Group>
    );
  } else {
    toolbarContent = (
      <PageSizeSelect
        recordNoun={recordNoun}
        pageSize={browser.pageSize}
        pageSizeOptions={pageSizeOptions}
        onChange={browser.setPageSize}
      />
    );
  }

  return (
    <>
      <Layout
        title={title}
        search={
          <form
            role="search"
            onSubmit={(event) => event.preventDefault()}
            className={classes['searchForm']}
          >
            <TextInput
              aria-label={searchLabel}
              placeholder={searchLabel}
              leftSection={<MagnifyingGlass size={16} aria-hidden="true" />}
              value={browseState.search}
              onChange={(event) => browser.setSearch(event.currentTarget.value)}
            />
          </form>
        }
        rail={railContent}
        railLabel="Filters"
        quickFacets={
          facets.length > 0 ? (
            <QuickFacets
              facets={quickFacets}
              activeTotal={activeFilterCount}
              onOpen={drawer.open}
            />
          ) : undefined
        }
        activeFilters={
          <ActiveFilters
            facets={facets}
            filters={browseState.filters}
            onRemove={removeChip}
            onClear={clearAllFilters}
          />
        }
        summary={<Summary text={summaryText} />}
        toolbar={toolbarContent}
        status={statusContent}
        resultsLabel={resultsLabel}
        fillHeight={fillHeight}
        {...(table ? { table } : {})}
        {...(cardResults ? { cards: cardResults } : {})}
        {...(customResults !== undefined ? { results: customResults } : {})}
        pagination={
          <Pagination
            page={browser.page}
            pageCount={browser.pageCount}
            recordNoun={recordNoun}
            state={browseState}
            getPageHref={getPageHref}
            onPageChange={browser.setPage}
          />
        }
      />
      <FilterDrawer
        opened={drawer.opened}
        title={shownDrawerFacet?.label ?? 'Filters'}
        applyLabel={
          drawer.invalidDraft || drawer.pendingCount === undefined
            ? 'Show results'
            : `Show ${drawer.pendingCount} ${recordNoun}`
        }
        applyDisabled={drawer.invalidDraft}
        onApply={drawer.apply}
        onCancel={drawer.close}
        onReset={drawerReset}
        titleRef={drawerTitleRef}
        onEnterTransitionEnd={() =>
          drawerTitleRef.current?.focus({ preventScroll: true })
        }
        {...(shownDrawerFacet
          ? {
              backLabel: 'Back to all filters',
              onBack: () => {
                drawer.backToOverview();
                drawerTitleRef.current?.focus({ preventScroll: true });
              },
            }
          : {})}
      >
        <Stack gap="md">
          {drawerContent ? (
            // Delegated navigation handling: links stay the interactive elements.
            <div role="presentation" onClick={handleDrawerContentClick}>
              {drawerContent}
            </div>
          ) : null}
          <FacetList
            key={facetResetEpoch}
            facets={drawerFacets}
            values={drawer.draftFilters}
            records={records}
            surface="drawer"
            getCounts={drawerCounts}
            onChange={drawer.setValue}
          />
        </Stack>
      </FilterDrawer>
    </>
  );
}
