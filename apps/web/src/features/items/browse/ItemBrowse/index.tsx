import { Title } from '@mantine/core';
import { FacetedBrowser } from '@mapletip/component-library';
import type { BrowseState, TableColumn } from '@mapletip/component-library';
import { useMemo, type ReactElement } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { BUILDS, type BuildId } from '@/config/maplekit';

import {
  getCategoryRows,
  getItemScope,
  getItemScopeChild,
  type ItemScopeSlug,
} from '../categories';
import { ItemBrowseCard } from '../ItemBrowseCard';
import type { ItemRow } from '../project';

export interface ItemBrowseProps {
  readonly buildId: BuildId;
  readonly rows: readonly ItemRow[];
  readonly scope?: ItemScopeSlug;
  readonly childSlug?: string;
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
  pageSize: 25,
  hiddenColumns: [],
};

const SUMMARY_NOUN = { one: 'Item', other: 'Items' } as const;

export function computeItemBrowseTitle(
  buildLabel: string,
  scope?: ItemScopeSlug,
  childSlug?: string,
): string {
  if (scope && childSlug) {
    const child = getItemScopeChild(scope, childSlug);
    if (child) {
      return `MapleStory ${buildLabel} ${child.label}`;
    }
  }
  if (scope && scope !== 'all') {
    const sc = getItemScope(scope);
    return `MapleStory ${buildLabel} ${sc.label} Items`;
  }
  return `MapleStory ${buildLabel} Items`;
}

export function ItemBrowse({
  buildId,
  rows,
  scope,
  childSlug,
}: ItemBrowseProps): ReactElement {
  const label = BUILDS[buildId].label;
  const title = computeItemBrowseTitle(label, scope, childSlug);

  const scopedRows = useMemo(
    () => getCategoryRows(rows, scope ?? 'all', childSlug),
    [rows, scope, childSlug],
  );

  return (
    <BrowsePageShell>
      <FacetedBrowser
        title={<Title order={1}>{title}</Title>}
        records={scopedRows}
        idAccessor="key"
        identityField="name"
        columns={itemBrowseColumns}
        searchFields={['name', 'sourceId']}
        facets={[]}
        recordNoun={`${label} items`}
        summaryMode="total"
        summaryNoun={SUMMARY_NOUN}
        pageSizeOptions={[25, 50, 100]}
        presentation="comparison"
        fillHeight
        tableStorageKey={`mapletip:web:items:${buildId}:v1`}
        renderCard={(record) => <ItemBrowseCard record={record} />}
        defaultState={defaultState}
      />
    </BrowsePageShell>
  );
}
