import { EmptyState } from '@mantine/core';
import { FacetedBrowser } from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { useMemo, type ReactElement } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { BUILDS, type BuildId } from '@/config/maplekit';

import { getCategoryRows } from '../categories';
import { getItemColumns } from '../columns';
import { getItemFacets, ITEM_QUERY_FIELDS } from '../facets';
import { ItemBrowseCard } from '../ItemBrowseCard';
import { ItemBrowseHeader } from '../ItemBrowseHeader';
import { ItemRailNav } from '../ItemRailNav';
import { itemPageMetadata } from '../metadata';
import { getItemNavData } from '../navigation';
import type { ItemRow } from '../project';
import { itemCategoryContextKey, type ItemCategorySelection } from '../routing';
import { findExactIdNotice } from '../search';
import {
  PAGE_SIZE_OPTIONS,
  type BrowseContext,
  type ItemBrowseSearch,
} from '../search-params';

import { useItemBrowseUrlState } from './useItemBrowseUrlState';

export interface ItemBrowseProps {
  readonly buildId: BuildId;
  readonly rows: readonly ItemRow[];
  readonly coverage: ItemBrowseCoverage;
  readonly category: ItemCategorySelection;
  readonly search?: ItemBrowseSearch | undefined;
  readonly onSearchChange?:
    | ((nextSearch: Record<string, unknown>, replace: boolean) => void)
    | undefined;
}

const SUMMARY_NOUN = { one: 'Item', other: 'Items' } as const;

export function ItemBrowse({
  buildId,
  rows,
  coverage,
  category,
  search: searchProp,
  onSearchChange,
}: ItemBrowseProps): ReactElement {
  const label = BUILDS[buildId].label;
  const contextKey = itemCategoryContextKey(category);
  const { heading } = itemPageMetadata(buildId, category);

  const scopedRows = useMemo(
    () => getCategoryRows(rows, category.scope, category.child),
    [rows, category.scope, category.child],
  );

  const { columns, defaultHiddenColumns, sortOptions, facts } = useMemo(
    () => getItemColumns(category, coverage, scopedRows),
    [category, coverage, scopedRows],
  );

  const facets = useMemo(
    () => getItemFacets({ category, coverage, roster: rows }),
    [category, coverage, rows],
  );

  const browseContext = useMemo<BrowseContext>(
    () => ({
      facets,
      sortOptions,
      defaultHiddenColumns,
    }),
    [facets, sortOptions, defaultHiddenColumns],
  );

  const {
    browseState,
    localSearch,
    urlSearch,
    handleStateChange,
    getPageHref,
  } = useItemBrowseUrlState({
    searchProp,
    browseContext,
    stateResetKey: `${buildId}:${contextKey}`,
    onSearchChange,
  });

  const navScopes = useMemo(
    () => getItemNavData(rows, category, buildId, urlSearch),
    [rows, category, buildId, urlSearch],
  );

  const exactIdNotice = useMemo(
    () => findExactIdNotice(localSearch, rows, category, buildId),
    [localSearch, rows, category, buildId],
  );

  const emptyState = useMemo(() => {
    if (scopedRows.length > 0) return undefined;
    const catLabel = category.child?.label ?? category.scope.label;
    return <EmptyState title={`${label} has no ${catLabel}`} />;
  }, [scopedRows.length, category, label]);

  const header = (
    <ItemBrowseHeader
      buildId={buildId}
      coverage={coverage}
      category={category}
      heading={heading}
      navScopes={navScopes}
      currentSearch={urlSearch}
      exactIdNotice={exactIdNotice}
    />
  );

  const railNav = <ItemRailNav navScopes={navScopes} />;
  const tableStorageVersion = category.child?.slug === 'chairs' ? 'v2' : 'v1';

  return (
    <BrowsePageShell>
      <FacetedBrowser
        key={`${buildId}:${category.scope.slug}:${category.child?.slug ?? ''}`}
        title={header}
        records={scopedRows}
        idAccessor="key"
        identityField="name"
        columns={columns}
        searchFields={['name', 'sourceId']}
        queryFields={ITEM_QUERY_FIELDS}
        facets={facets}
        sortOptions={sortOptions}
        railNavigation={railNav}
        recordNoun={`${label} items`}
        tableLabel={`${category.child?.label ?? category.scope.label} comparison`}
        summaryMode="total"
        summaryNoun={SUMMARY_NOUN}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        presentation="comparison"
        fillHeight
        tableStorageKey={`mapletip:web:items:${buildId}:${contextKey}:${tableStorageVersion}`}
        renderCard={(record) => (
          <ItemBrowseCard record={record} facts={facts} />
        )}
        state={browseState}
        onStateChange={handleStateChange}
        renderPageLink={({ page, state, props }) => (
          <a {...props} href={getPageHref(page, state)}>
            {props.children ?? page}
          </a>
        )}
        emptyState={emptyState}
      />
    </BrowsePageShell>
  );
}
