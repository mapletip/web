import { EmptyState } from '@mantine/core';
import { FacetedBrowser } from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { useMemo, type ReactElement } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { BUILDS, type BuildId } from '@/config/maplekit';

import { getCategoryRows } from '../categories';
import { itemBrowseColumns } from '../columns';
import { getItemFacets, ITEM_QUERY_FIELDS } from '../facets';
import { ItemBrowseCard } from '../ItemBrowseCard';
import { ItemBrowseHeader } from '../ItemBrowseHeader';
import { ItemRailNav } from '../ItemRailNav';
import { itemPageMetadata } from '../metadata';
import { getItemNavData } from '../navigation';
import type { ItemRow } from '../project';
import type { ItemCategorySelection } from '../routing';
import { findExactIdNotice } from '../search';
import {
  PAGE_SIZE_OPTIONS,
  type BrowseContext,
  type ItemBrowseSearch,
} from '../search-params';
import { ITEM_SORT_OPTIONS } from '../sort';

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
  const { heading } = itemPageMetadata(buildId, category);

  const scopedRows = useMemo(
    () => getCategoryRows(rows, category.scope, category.child),
    [rows, category.scope, category.child],
  );

  const facets = useMemo(
    () => getItemFacets(category, coverage, scopedRows),
    [category, coverage, scopedRows],
  );

  const browseContext = useMemo<BrowseContext>(
    () => ({
      facets,
      sortOptions: ITEM_SORT_OPTIONS,
    }),
    [facets],
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

  return (
    <BrowsePageShell>
      <FacetedBrowser
        key={`${buildId}:${category.scope.slug}:${category.child?.slug ?? ''}`}
        title={header}
        records={scopedRows}
        idAccessor="key"
        identityField="name"
        columns={itemBrowseColumns}
        searchFields={['name', 'sourceId']}
        queryFields={ITEM_QUERY_FIELDS}
        facets={facets}
        sortOptions={ITEM_SORT_OPTIONS}
        railNavigation={railNav}
        recordNoun={`${label} items`}
        summaryMode="total"
        summaryNoun={SUMMARY_NOUN}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        presentation="comparison"
        fillHeight
        tableStorageKey={`mapletip:web:items:${buildId}:v1`}
        renderCard={(record) => <ItemBrowseCard record={record} />}
        state={browseState}
        onStateChange={handleStateChange}
        getPageHref={getPageHref}
        emptyState={emptyState}
      />
    </BrowsePageShell>
  );
}
