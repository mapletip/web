import {
  Box,
  Divider,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { MagnifyingGlass } from '@phosphor-icons/react';
import type {
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import type {
  FacetedBrowserProps,
  StateChangeDetails,
} from '@/components/FacetedBrowser/FacetedBrowser.types';
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
import { NavigationDrawer } from '@/components/FacetedBrowser/NavigationDrawer';
import { Pagination } from '@/components/FacetedBrowser/Pagination/Pagination';
import { QuickFacets } from '@/components/FacetedBrowser/QuickFacets/QuickFacets';
import { RecordDetailsDrawer } from '@/components/FacetedBrowser/RecordDetailsDrawer/RecordDetailsDrawer';
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
import type { RowExpansionContentContext } from '@/components/Table';
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
    showFilterHeading = true,
    filterDrawerApplyLabel,
    recordNoun = 'records',
    navigation,
    sortOptions,
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
    renderPageLink,
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
    (nextState: BrowseState, details?: StateChangeDetails) => {
      if (!controlled) setInternalState(nextState);
      if (details !== undefined) {
        onStateChange?.(nextState, details);
      } else {
        onStateChange?.(nextState);
      }
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
    facets,
    browseState,
    onBrowseStateChange: changeBrowseState,
  });
  const canonicalState = browser.canonicalState;

  const comparisonRowExpansionContent = comparisonProps?.rowExpansionContent;
  const comparisonRecordDetailsTitle = comparisonProps?.recordDetailsTitle;
  const [selectedDetailsRecordId, setSelectedDetailsRecordId] =
    useState<unknown>(undefined);
  const openRecordDetails = useCallback(
    (record: TRecord) => {
      setSelectedDetailsRecordId(record[idAccessor]);
    },
    [idAccessor],
  );
  const closeRecordDetails = useCallback(() => {
    setSelectedDetailsRecordId(undefined);
  }, []);
  // The drawer is open exactly while the selected identity is on the current
  // page. No effect, no second expansion engine and nothing in browse state.
  const selectedDetailsRecord =
    comparisonRowExpansionContent !== undefined &&
    selectedDetailsRecordId !== undefined
      ? browser.records.find(
          (record) => record[idAccessor] === selectedDetailsRecordId,
        )
      : undefined;
  const detailsIdentityField = comparisonProps?.identityField;
  const selectedDetailsLabel =
    selectedDetailsRecord !== undefined && detailsIdentityField !== undefined
      ? String(selectedDetailsRecord[detailsIdentityField])
      : undefined;
  const selectedDetailsTitle =
    selectedDetailsRecord === undefined
      ? null
      : (comparisonRecordDetailsTitle?.(selectedDetailsRecord) ??
        selectedDetailsLabel ??
        null);

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
  const detailsOpen = !statusActive && selectedDetailsRecord !== undefined;

  // A selection is valid only while its record is on the visible current page.
  // Clear it as soon as that stops being true so a later return cannot reopen
  // the drawer without a new user action.
  useEffect(() => {
    if (
      selectedDetailsRecordId !== undefined &&
      (statusActive || selectedDetailsRecord === undefined)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- invalidate stale record selection
      setSelectedDetailsRecordId(undefined);
    }
  }, [selectedDetailsRecord, selectedDetailsRecordId, statusActive]);
  const drawerTitleRef = useRef<HTMLHeadingElement>(null);
  const filterIsInvalid = useCallback(
    (filters: Readonly<Record<string, FacetFilterValue>>) =>
      invalidDraftFilter(facets, filters),
    [facets],
  );
  const drawer = useFacetedBrowserDrawer({
    opened: drawerOpened,
    onOpenedChange: updateDrawerOpened,
    committedState: canonicalState,
    statusActive,
    filterIsInvalid,
    evaluateDraft: browser.evaluateDraft,
    commitDraft: browser.commitDraft,
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
  const clearAllFilters = useCallback(() => {
    resetFacetUi();
    resetBrowserFilters();
  }, [resetBrowserFilters, resetFacetUi]);
  const clearQuery = useCallback(() => {
    resetFacetUi();
    clearBrowserQuery();
  }, [clearBrowserQuery, resetFacetUi]);
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
    canonicalState.search.trim().length > 0 ||
    Object.keys(canonicalState.filters).length > 0;

  const activeFilterCount = countActiveFilters(canonicalState.filters);
  // Mobile shortcuts mirror the resolved left-rail facets in the same order.
  const quickFacets = facets.map((facet) => ({
    id: facet.id,
    label: facet.label,
    ...(facet.icon !== undefined ? { icon: facet.icon } : {}),
    active: activeValueCount(canonicalState.filters[facet.field]),
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
      {...(comparisonProps.tableVerticalSpacing !== undefined
        ? { verticalSpacing: comparisonProps.tableVerticalSpacing }
        : {})}
      {...(comparisonProps.tableMaxHeight !== undefined
        ? { maxHeight: comparisonProps.tableMaxHeight }
        : {})}
      {...(comparisonRowExpansionContent
        ? {
            rowExpansionContent: (
              record: TRecord,
              context: RowExpansionContentContext,
            ) =>
              comparisonRowExpansionContent(record, {
                onClose: context.onClose,
                surface: 'table',
              }),
          }
        : {})}
      {...(comparisonProps.rowExpansionControl
        ? { rowExpansionControl: comparisonProps.rowExpansionControl }
        : {})}
    />
  ) : undefined;

  const renderBrowserCard = (record: TRecord): ReactNode => {
    if (props.presentation === 'cards') return props.renderCard(record);
    if (props.presentation !== 'comparison') return null;

    return props.renderCard(
      record,
      comparisonRowExpansionContent === undefined
        ? {}
        : {
            openDetails: () => openRecordDetails(record),
            isDetailsOpen: detailsOpen && selectedDetailsRecord === record,
          },
    );
  };

  const cardResults =
    props.presentation === 'comparison' || props.presentation === 'cards' ? (
      <div
        className={classes['cards']}
        role="list"
        aria-label={`${recordNoun} cards`}
      >
        {browser.records.map((record) => (
          <div role="listitem" key={String(record[idAccessor])}>
            {renderBrowserCard(record)}
          </div>
        ))}
      </div>
    ) : undefined;
  const customResults =
    props.presentation === 'custom'
      ? props.renderResults({ records: browser.records, state: canonicalState })
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

  const [navDrawerOpened, setNavDrawerOpened] = useState(false);
  const openNavDrawer = useCallback(() => setNavDrawerOpened(true), []);
  const closeNavDrawer = useCallback(() => setNavDrawerOpened(false), []);

  const railContent =
    navigation || facets.length > 0 ? (
      <Stack gap="md">
        {navigation
          ? navigation.render({ mode: 'rail', onNavigate: undefined })
          : null}
        {facets.length > 0 ? (
          <>
            {showFilterHeading ? (
              <Title order={2} size="h4">
                Filters
              </Title>
            ) : null}
            <FacetList
              key={facetResetEpoch}
              facets={facets}
              values={canonicalState.filters}
              records={records}
              surface="rail"
              getCounts={browser.getFacetValues}
              onChange={browser.setFilter}
            />
          </>
        ) : null}
      </Stack>
    ) : undefined;

  const railLabel = navigation ? navigation.label : 'Filters';

  const primaryToolbar = comparisonProps ? (
    <Toolbar
      columns={columns}
      idAccessor={idAccessor}
      identityField={comparisonProps.identityField}
      hiddenColumns={canonicalState.hiddenColumns}
      defaultHiddenColumns={initialDefaultHiddenColumns}
      recordNoun={recordNoun}
      pageSize={browser.pageSize}
      pageSizeOptions={pageSizeOptions}
      onHiddenColumnsChange={browser.setHiddenColumns}
      onColumnVisibilityChange={browser.setColumnVisibility}
      onPageSizeChange={browser.setPageSize}
    />
  ) : (
    <PageSizeSelect
      recordNoun={recordNoun}
      pageSize={browser.pageSize}
      pageSizeOptions={pageSizeOptions}
      onChange={browser.setPageSize}
    />
  );

  const toolbarContent =
    sortOptions && sortOptions.length > 0 ? (
      <Group gap="xs">
        <Box visibleFrom="md">
          <Group gap={6} align="center">
            <Text size="xs" c="dimmed">
              Sort:
            </Text>
            <SortSelect
              recordNoun={recordNoun}
              sortOptions={sortOptions}
              currentSort={canonicalState.sort}
              onChange={browser.setSort}
            />
          </Group>
        </Box>
        {primaryToolbar}
      </Group>
    ) : (
      primaryToolbar
    );

  const effectiveState = useMemo(
    () =>
      browser.page === canonicalState.page
        ? canonicalState
        : { ...canonicalState, page: browser.page },
    [canonicalState, browser.page],
  );

  const hasSortOptions = sortOptions !== undefined && sortOptions.length > 0;
  const hasFilterOptions = facets.length > 0 || hasSortOptions;

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
              value={canonicalState.search}
              onChange={(event) => browser.setSearch(event.currentTarget.value)}
            />
          </form>
        }
        rail={railContent}
        railLabel={railLabel}
        quickFacets={
          navigation || hasFilterOptions ? (
            <QuickFacets
              {...(navigation
                ? {
                    navigation: {
                      label: navigation.label,
                      currentLabel: navigation.currentLabel,
                      ...(navigation.currentIcon
                        ? { currentIcon: navigation.currentIcon }
                        : {}),
                      onOpen: openNavDrawer,
                    },
                  }
                : {})}
              hasFilters={hasFilterOptions}
              facets={quickFacets}
              activeTotal={activeFilterCount}
              onOpen={drawer.open}
            />
          ) : undefined
        }
        activeFilters={
          <ActiveFilters
            facets={facets}
            filters={canonicalState.filters}
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
            state={effectiveState}
            renderPageLink={renderPageLink}
            onPageChange={browser.setPage}
          />
        }
      />
      {comparisonRowExpansionContent !== undefined ? (
        <RecordDetailsDrawer
          opened={detailsOpen}
          title={selectedDetailsTitle}
          closeLabel={
            selectedDetailsLabel === undefined
              ? 'Close details'
              : `Close details for ${selectedDetailsLabel}`
          }
          onClose={closeRecordDetails}
        >
          {selectedDetailsRecord === undefined
            ? null
            : comparisonRowExpansionContent(selectedDetailsRecord, {
                onClose: closeRecordDetails,
                surface: 'drawer',
              })}
        </RecordDetailsDrawer>
      ) : null}
      <FilterDrawer
        opened={drawer.opened}
        title={shownDrawerFacet?.label ?? 'Filters'}
        applyLabel={
          filterDrawerApplyLabel ??
          (drawer.invalidDraft || drawer.pendingCount === undefined
            ? 'Show results'
            : `Show ${drawer.pendingCount} ${recordNoun}`)
        }
        applyDisabled={drawer.invalidDraft}
        onApply={drawer.apply}
        onCancel={drawer.close}
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
          {sortOptions && sortOptions.length > 0 && !shownDrawerFacet ? (
            <>
              <SortSelect
                recordNoun={recordNoun}
                sortOptions={sortOptions}
                currentSort={drawer.draftSort}
                onChange={drawer.setSort}
                label="Sort"
                w="100%"
              />
              {drawerFacets.length > 0 ? (
                <Divider my="sm" color="var(--mapletip-color-border-subtle)" />
              ) : null}
            </>
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
      {navigation ? (
        <NavigationDrawer
          opened={navDrawerOpened}
          title={navigation.label}
          currentId={navigation.currentId}
          currentCount={navigation.currentCount}
          onClose={closeNavDrawer}
          onApply={navigation.apply}
          history={navigation.history}
        >
          {({ selectedId, onSelect }) =>
            navigation.render({
              mode: 'drawer',
              selectedId,
              onSelect,
            })
          }
        </NavigationDrawer>
      ) : null}
    </>
  );
}
