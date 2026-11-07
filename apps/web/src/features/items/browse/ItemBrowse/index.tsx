import { Title } from '@mantine/core';
import { FacetedBrowser } from '@mapletip/component-library';
import type { BrowseState, TableColumn } from '@mapletip/component-library';
import { useMemo, type ReactElement } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { BUILDS, type BuildId } from '@/config/maplekit';

import { getCategoryRows } from '../categories';
import { ItemBrowseCard } from '../ItemBrowseCard';
import { itemPageMetadata } from '../metadata';
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

  return (
    <BrowsePageShell>
      <FacetedBrowser
        title={<Title order={1}>{heading}</Title>}
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
