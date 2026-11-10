import { Text } from '@mantine/core';
import { DrillDownNav, FacetedBrowser } from '@mapletip/component-library';
import type { FacetedBrowserNavigationHistory } from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { Link, useRouter } from '@tanstack/react-router';
import { useCallback, useMemo, type ReactElement } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { BUILDS, type BuildId } from '@/config/maplekit';

import { getCategoryRows } from '../assignment';
import { getItemColumns, itemColumnContextKey } from '../columns';
import { getItemFacets, ITEM_QUERY_FIELDS } from '../facets';
import { ItemBrowseCard } from '../ItemBrowseCard';
import { ItemBrowseHeader } from '../ItemBrowseHeader';
import { itemPageMetadata } from '../metadata';
import {
  DEFAULT_NAV_PARAMS,
  findItemNavNode,
  getItemNavPath,
  ITEM_NAV_TARGET,
  itemNavId,
  renderItemNavLink,
} from '../navigation';
import { getItemNavTree } from '../navigation-tree';
import type { ItemRow } from '../project';
import type { ItemCategorySelection } from '../routing';
import {
  browseStateToUrl,
  ITEM_BROWSE_DEFAULT_STATE,
  PAGE_SIZE_OPTIONS,
} from '../search-params';
import type { ItemBrowseSearch } from '../search-params';

import {
  useItemBrowseUrlState,
  type OnSearchChangeOptions,
} from './useItemBrowseUrlState';

export interface ItemBrowseProps {
  readonly buildId: BuildId;
  readonly rows: readonly ItemRow[];
  readonly coverage: ItemBrowseCoverage;
  readonly category: ItemCategorySelection;
  readonly search: ItemBrowseSearch;
  readonly onSearchChange: (options: OnSearchChangeOptions) => void;
}

const SUMMARY_NOUN = { one: 'Item', other: 'Items' } as const;

/** Renders a controlled Items catalog page with shareable URL state. */
export function ItemBrowse({
  buildId,
  rows,
  coverage,
  category,
  search,
  onSearchChange,
}: ItemBrowseProps): ReactElement {
  const buildLabel = BUILDS[buildId].label;
  const { heading, robots } = itemPageMetadata({ buildId, category, search });
  const scopedRows = useMemo(
    () =>
      getCategoryRows({
        rows,
        scope: category.scope,
        child: category.child,
      }),
    [rows, category.scope, category.child],
  );
  const facets = useMemo(
    () => getItemFacets({ category, coverage }),
    [category, coverage],
  );
  const contextKey = itemColumnContextKey({ category });
  const presentation = useMemo(
    () => getItemColumns({ category, coverage, rows: scopedRows }),
    [category, coverage, scopedRows],
  );
  const { browseState, handleStateChange } = useItemBrowseUrlState({
    search,
    onSearchChange,
    contextKey,
    defaultHiddenColumns: presentation.defaultHiddenColumns,
    sortOptions: presentation.sortOptions,
  });

  const navTree = useMemo(
    () => getItemNavTree({ rows, buildId }),
    [rows, buildId],
  );
  const currentId = itemNavId(category);
  const currentNode = findItemNavNode(navTree, currentId) ?? navTree;
  const currentIcon = currentNode.icon;
  const navPath = getItemNavPath({ root: navTree, targetId: currentId });
  const categorySort =
    browseState.sort?.field === 'name'
      ? browseState.sort
      : ITEM_BROWSE_DEFAULT_STATE.sort;
  const categorySearch = browseStateToUrl({
    state: {
      ...browseState,
      filters: {},
      sort: categorySort,
    },
    includePage: false,
    sortOptions: presentation.sortOptions,
  });
  const router = useRouter();
  const navHistory = useMemo<FacetedBrowserNavigationHistory>(
    () => ({
      push: () => {
        const location = router.history.location;
        router.history.push(location.href, location.state);
      },
      back: () => {
        router.history.back();
      },
    }),
    [router],
  );

  const applyNav = useCallback(
    (id: string, options: { readonly replace: true }) => {
      const targetNode = findItemNavNode(navTree, id) ?? navTree;
      void router.navigate({
        to: ITEM_NAV_TARGET,
        params: targetNode.meta ?? DEFAULT_NAV_PARAMS,
        search: categorySearch,
        replace: options.replace,
      });
    },
    [categorySearch, navTree, router],
  );

  return (
    <>
      <meta name="robots" content={robots} />
      <BrowsePageShell>
        <FacetedBrowser
          title={
            <ItemBrowseHeader
              navPath={navPath}
              heading={heading}
              search={categorySearch}
            />
          }
          navigation={{
            label: 'Item categories',
            currentLabel: currentNode.label,
            currentId,
            currentCount: currentNode.count,
            ...(currentIcon ? { currentIcon } : {}),
            apply: applyNav,
            history: navHistory,
            render: (context) => {
              if (context.mode === 'drawer') {
                return (
                  <DrillDownNav
                    root={navTree}
                    currentId={context.selectedId}
                    label="Item categories"
                    hideEmpty
                    onSelect={context.onSelect}
                  />
                );
              }
              return (
                <DrillDownNav
                  root={navTree}
                  currentId={currentId}
                  label="Item categories"
                  hideEmpty
                  renderLink={(node, props) =>
                    renderItemNavLink({ node, props, search: categorySearch })
                  }
                  {...(context.onNavigate
                    ? { onNavigate: context.onNavigate }
                    : {})}
                />
              );
            },
          }}
          records={scopedRows}
          idAccessor="sourceId"
          identityField="name"
          columns={presentation.columns}
          queryFields={ITEM_QUERY_FIELDS}
          searchFields={['name', 'sourceId']}
          facets={facets}
          sortOptions={presentation.sortOptions}
          showFilterHeading={false}
          recordNoun={`${buildLabel} items`}
          summaryMode="total"
          summaryNoun={SUMMARY_NOUN}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          presentation="comparison"
          fillHeight
          tableStorageKey={`mapletip:web:items:${buildId}:${contextKey}:v1`}
          renderCard={(record) => (
            <ItemBrowseCard record={record} facts={presentation.facts} />
          )}
          state={browseState}
          onStateChange={handleStateChange}
          renderPageLink={({ page, state, props }) => {
            const { target, disabled, ...linkProps } = props;
            const routerLinkProps: Omit<typeof linkProps, 'href'> = linkProps;
            return (
              <Link
                from={ITEM_NAV_TARGET}
                to="."
                search={browseStateToUrl({
                  state: { ...state, page },
                  sortOptions: presentation.sortOptions,
                })}
                {...routerLinkProps}
                {...(target === undefined ? {} : { target })}
                {...(disabled === undefined ? {} : { disabled })}
              />
            );
          }}
          emptyState={
            scopedRows.length === 0 ? (
              <Text>
                {buildLabel} has no {currentNode.label}.
              </Text>
            ) : undefined
          }
        />
      </BrowsePageShell>
    </>
  );
}
