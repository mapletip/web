import type { TableColumn } from '@mapletip/component-library';

import type { ItemRow } from './project';

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
