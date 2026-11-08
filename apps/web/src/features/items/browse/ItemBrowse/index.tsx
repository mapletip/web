import { Title } from '@mantine/core';
import { DrillDownNav, FacetedBrowser } from '@mapletip/component-library';
import type {
  BrowseState,
  FacetedBrowserNavigationHistory,
  TableColumn,
} from '@mapletip/component-library';
import { useRouter } from '@tanstack/react-router';
import { useCallback, useMemo, type ReactElement } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { BUILDS, type BuildId } from '@/config/maplekit';

import { getCategoryRows } from '../categories';
import { ItemBrowseCard } from '../ItemBrowseCard';
import { itemPageMetadata } from '../metadata';
import {
  DEFAULT_NAV_PARAMS,
  findItemNavNode,
  getItemNavTree,
  ITEM_NAV_TARGET,
  itemNavId,
  renderItemNavLink,
} from '../navigation';
import type { ItemRow } from '../project';
import type { ItemCategorySelection } from '../routing';

export interface ItemBrowseProps {
  readonly buildId: BuildId;
  readonly rows: readonly ItemRow[];
  readonly category: ItemCategorySelection;
}

export const itemBrowseColumns: readonly TableColumn<ItemRow>[] = [
  {
    accessor: 'name',
    title: 'Name',
    sortable: true,
    firstSortDirection: 'asc',
    render: (record) => record.name ?? 'Unnamed item',
  },
  {
    accessor: 'sourceId',
    title: 'ID',
    sortable: true,
    firstSortDirection: 'asc',
    render: (record) => record.sourceId,
  },
];

const defaultState: BrowseState = {
  search: '',
  filters: {},
  sort: { field: 'name', direction: 'asc' },
  page: 1,
  pageSize: 50,
  hiddenColumns: [],
};

const SUMMARY_NOUN = { one: 'Item', other: 'Items' } as const;

export function ItemBrowse({
  buildId,
  rows,
  category,
}: ItemBrowseProps): ReactElement {
  const label = BUILDS[buildId].label;
  const { heading } = itemPageMetadata(buildId, category);

  const scopedRows = useMemo(
    () => getCategoryRows(rows, category.scope, category.child),
    [rows, category.scope, category.child],
  );

  const navTree = useMemo(() => getItemNavTree(rows, buildId), [rows, buildId]);

  const currentId = itemNavId(category);
  const currentNode = findItemNavNode(navTree, currentId) ?? navTree;
  const currentCategoryLabel = currentNode.label;
  const currentIcon = currentNode.icon;

  const router = useRouter();

  const navHistory = useMemo<FacetedBrowserNavigationHistory>(
    () => ({
      push: () => {
        const loc = router.history.location;
        router.history.push(loc.href, loc.state);
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
        replace: options.replace,
      });
    },
    [navTree, router],
  );

  return (
    <BrowsePageShell>
      <FacetedBrowser
        title={<Title order={1}>{heading}</Title>}
        navigation={{
          label: 'Item categories',
          currentLabel: currentCategoryLabel,
          currentId,
          currentCount: currentNode.count,
          apply: applyNav,
          history: navHistory,
          ...(currentIcon ? { currentIcon } : {}),
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
                renderLink={renderItemNavLink}
                {...(context.onNavigate
                  ? { onNavigate: context.onNavigate }
                  : {})}
              />
            );
          },
        }}
        records={scopedRows}
        idAccessor="key"
        identityField="name"
        columns={itemBrowseColumns}
        searchFields={['name', 'sourceId']}
        facets={[]}
        recordNoun={`${label} items`}
        summaryMode="total"
        summaryNoun={SUMMARY_NOUN}
        pageSizeOptions={[25, 50, 75, 100]}
        presentation="comparison"
        fillHeight
        tableStorageKey={`mapletip:web:items:${buildId}:v1`}
        renderCard={(record) => <ItemBrowseCard record={record} />}
        defaultState={defaultState}
      />
    </BrowsePageShell>
  );
}
