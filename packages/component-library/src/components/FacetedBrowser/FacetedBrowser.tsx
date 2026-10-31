import { Button, Group, Stack, TextInput, Title } from '@mantine/core';
import { MagnifyingGlass } from '@phosphor-icons/react';
import type {
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  activeValueCount,
  buildActiveChips,
  countActiveFilters,
} from '@/components/FacetedBrowser/facetChips';
import { FacetList } from '@/components/FacetedBrowser/FacetControls/FacetList';
import type { FacetDefinition } from '@/components/FacetedBrowser/FacetControls/types';
import classes from '@/components/FacetedBrowser/FacetedBrowser.module.css';
import { FilterDrawer } from '@/components/FacetedBrowser/FilterDrawer/FilterDrawer';
import {
  createBrowseState,
  type BrowseState,
} from '@/components/FacetedBrowser/hooks/browseState';
import { isInvalidNumericRange } from '@/components/FacetedBrowser/hooks/filterTypes';
import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';
import type { QueryFieldDefinition } from '@/components/FacetedBrowser/hooks/querySemantics';
import { useFacetedBrowser } from '@/components/FacetedBrowser/hooks/useFacetedBrowser';
import { useFacetedBrowserDrawer } from '@/components/FacetedBrowser/hooks/useFacetedBrowserDrawer';
import { Layout } from '@/components/FacetedBrowser/Layout/Layout';
import { Pagination } from '@/components/FacetedBrowser/Pagination/Pagination';
import { QuickFacets } from '@/components/FacetedBrowser/QuickFacets/QuickFacets';
import { Status, hasStatus } from '@/components/FacetedBrowser/Status/Status';
import { Summary } from '@/components/FacetedBrowser/Summary/Summary';
import {
  PageSizeSelect,
  Toolbar,
} from '@/components/FacetedBrowser/Toolbar/Toolbar';
import { ComparisonTable } from '@/components/Table/ComparisonTable';
import {
  deriveTableStorageKey,
  resolveTableStorageKey,
} from '@/components/Table/tableStorageKey';
import type { TableColumn } from '@/components/Table/types';

export type {
  FacetControlContext,
  FacetDefinition,
  FacetOption,
} from '@/components/FacetedBrowser/FacetControls/types';

interface CommonProps<TRecord extends Record<string, unknown>> {
  readonly title: ReactNode;
  readonly records: readonly TRecord[];
  readonly idAccessor: keyof TRecord & string;
  readonly queryFields?: readonly QueryFieldDefinition<TRecord>[];
  readonly searchFields?: readonly (keyof TRecord & string)[];
  readonly facets?: readonly FacetDefinition<TRecord>[];
  readonly recordNoun?: string;
  readonly resultsLabel?: string;
  readonly searchLabel?: string;
  readonly pageSizeOptions?: readonly number[];
  /** Replaces result presentation while loading or displaying an error/unavailable state. */
  readonly status?: ReactNode;
  readonly loading?: boolean;
  readonly error?: ReactNode;
  readonly unavailable?: ReactNode;
  readonly onRetry?: () => void;
  readonly emptyState?: ReactNode;
  readonly drawerContent?: ReactNode;
  readonly getPageHref?: (page: number, nextState: BrowseState) => string;
  /**
   * Optional stable host/domain namespace for persisted DataTable widths.
   * Omit for the derived per-table-schema bucket.
   */
  readonly tableStorageKey?: string;
}

type StateProps =
  | {
      readonly state: BrowseState;
      readonly onStateChange: (nextState: BrowseState) => void;
      readonly defaultState?: never;
    }
  | {
      readonly state?: never;
      readonly onStateChange?: (nextState: BrowseState) => void;
      readonly defaultState?: BrowseState;
    };

type DrawerStateProps =
  | {
      readonly drawerOpened: boolean;
      readonly onDrawerOpenedChange: (opened: boolean) => void;
    }
  | {
      readonly drawerOpened?: never;
      readonly onDrawerOpenedChange?: never;
    };

type PresentationProps<TRecord extends Record<string, unknown>> =
  | {
      readonly presentation: 'comparison';
      readonly columns: readonly TableColumn<TRecord>[];
      readonly identityField: keyof TRecord & string;
      readonly renderCard: (record: TRecord) => ReactNode;
      readonly tableLabel?: string;
      /** Optional maximum height for DataTable's internal table scroll area. */
      readonly tableMaxHeight?: number | string;
      readonly rowExpansionContent?: (record: TRecord) => ReactNode;
    }
  | {
      readonly presentation: 'cards';
      readonly renderCard: (record: TRecord) => ReactNode;
      readonly columns?: never;
      readonly identityField?: never;
    }
  | {
      readonly presentation: 'custom';
      readonly renderResults: (args: {
        readonly records: readonly TRecord[];
        readonly state: BrowseState;
      }) => ReactNode;
      readonly columns?: never;
      readonly identityField?: never;
      readonly renderCard?: never;
    };

export type FacetedBrowserProps<TRecord extends Record<string, unknown>> =
  CommonProps<TRecord> &
    StateProps &
    DrawerStateProps &
    PresentationProps<TRecord>;

const EMPTY_FACETS: readonly never[] = [];
const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const EMPTY_COLUMNS: readonly never[] = [];
const EMPTY_HIDDEN_COLUMNS: readonly never[] = [];

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

function validateFacets<TRecord extends Record<string, unknown>>(
  facets: readonly FacetDefinition<TRecord>[],
  registeredFields: ReadonlySet<string>,
): void {
  const facetIds = new Set<string>();
  const facetFields = new Set<string>();
  for (const facet of facets) {
    if (facetIds.has(facet.id)) {
      throw new Error(`FacetedBrowser: duplicate facet ID "${facet.id}".`);
    }
    if (facetFields.has(facet.field)) {
      throw new Error(
        `FacetedBrowser: multiple facets use query field "${facet.field}".`,
      );
    }
    if (!registeredFields.has(facet.field)) {
      throw new Error(
        `FacetedBrowser: facet "${facet.id}" refers to unregistered query field "${facet.field}".`,
      );
    }
    facetIds.add(facet.id);
    facetFields.add(facet.field);
  }
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
    facets = EMPTY_FACETS,
    recordNoun = 'records',
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

  const registeredFields = useMemo(() => {
    const ids = new Set<string>([
      idAccessor,
      ...(identityField ? [identityField] : []),
      ...columns.map((column) => column.accessor),
      ...(searchFields ?? []),
      ...(queryFields ?? []).map((field) =>
        typeof field === 'string' ? field : field.id,
      ),
    ]);
    return ids;
  }, [idAccessor, identityField, columns, queryFields, searchFields]);
  validateFacets(facets, registeredFields);

  const browser = useFacetedBrowser({
    records,
    ...(columns.length > 0 ? { columns } : {}),
    ...(queryFields ? { queryFields } : {}),
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

  const activeChips = buildActiveChips(facets, browseState.filters);
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

  const summaryText = `${browser.pageStart}–${browser.pageEnd} of ${browser.totalMatchingCount} ${recordNoun}`;
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
        onClearFilters={browser.clearQuery}
      />
    ) : undefined;

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
        rail={
          facets.length > 0 ? (
            <Stack gap="md">
              <Title order={2} size="h4">
                Filters
              </Title>
              <FacetList
                facets={facets}
                values={browseState.filters}
                records={records}
                surface="rail"
                getCounts={browser.getFacetValues}
                onChange={browser.setFilter}
              />
            </Stack>
          ) : undefined
        }
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
          activeChips.length > 0 ? (
            <Group gap={12} className={classes['activeFilters']}>
              {activeChips.map((chip) => (
                <Button
                  key={chip.key}
                  type="button"
                  size="compact-sm"
                  variant="light"
                  aria-label={`Remove ${chip.label}`}
                  onClick={() => {
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
                  }}
                >
                  {chip.label} ×
                </Button>
              ))}
              <Button
                type="button"
                size="compact-sm"
                variant="subtle"
                onClick={browser.resetFilters}
              >
                Clear filters
              </Button>
            </Group>
          ) : undefined
        }
        summary={<Summary text={summaryText} />}
        toolbar={
          comparisonProps ? (
            <Toolbar
              columns={columns}
              idAccessor={idAccessor}
              identityField={comparisonProps.identityField}
              hiddenColumns={browseState.hiddenColumns}
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
          )
        }
        status={statusContent}
        resultsLabel={resultsLabel}
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
        onReset={drawer.reset}
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
