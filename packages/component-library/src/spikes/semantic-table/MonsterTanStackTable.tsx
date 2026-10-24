import { Table, UnstyledButton } from '@mantine/core';
import {
  columnVisibilityFeature,
  createColumnHelper,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type SortingState,
  type ColumnVisibilityState,
} from '@tanstack/react-table';
import { useMemo, type ReactElement } from 'react';

import type { SpikeMonster, SpikeSortField } from '../ag-grid/fixtures';

import { Identity, StatValue } from './cells';
import { allColumns, identityColumn, statColumns } from './columns';
import classes from './MonsterTable.module.css';
import type { MonsterTableProps } from './types';

// Only what the prototype uses. Sorting and pagination are owned by the query
// layer, so there are no sorted/paginated row models, only sorting *state*.
const features = tableFeatures({ rowSortingFeature, columnVisibilityFeature });
const columnHelper = createColumnHelper<typeof features, SpikeMonster>();

const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    id: 'name',
    header: identityColumn.header,
    cell: ({ row }) => <Identity record={row.original} />,
    sortDescFirst: false,
  }),
  ...statColumns.map((meta) =>
    columnHelper.accessor(meta.id as keyof SpikeMonster, {
      id: meta.id,
      header: meta.header,
      cell: ({ getValue }) => <StatValue value={getValue() as number | null} />,
      sortDescFirst: meta.descFirst,
    }),
  ),
]);

const widthOf = (id: string): number =>
  allColumns.find((column) => column.id === id)?.width ?? 84;

export function MonsterTanStackTable({
  rows,
  caption,
  sort,
  onSortChange,
  hiddenColumns = [],
}: MonsterTableProps): ReactElement {
  const sorting = useMemo<SortingState>(
    () => (sort ? [{ id: sort.field, desc: sort.direction === 'desc' }] : []),
    [sort],
  );
  const columnVisibility = useMemo<ColumnVisibilityState>(
    () => Object.fromEntries(hiddenColumns.map((id) => [id, false])),
    [hiddenColumns],
  );

  const table = useTable({
    features,
    columns,
    data: rows,
    getRowId: (row) => row.id,
    state: { sorting, columnVisibility },
    manualSorting: true,
    enableSortingRemoval: false,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      const first = next[0];
      if (first) {
        onSortChange({
          field: first.id as SpikeSortField,
          direction: first.desc ? 'desc' : 'asc',
        });
      }
    },
  });

  const visible = table.getVisibleLeafColumns();
  const width = visible.reduce((sum, column) => sum + widthOf(column.id), 0);

  return (
    <Table.ScrollContainer
      minWidth={width}
      maxHeight="var(--scroll-max-height)"
      type="native"
      className={classes['scroll']}
    >
      <Table
        stickyHeader
        highlightOnHover
        tabularNums
        layout="fixed"
        withRowBorders
        horizontalSpacing={10}
        verticalSpacing={6}
        className={classes['table']}
        style={{ width }}
      >
        <colgroup>
          {visible.map((column) => (
            <col key={column.id} style={{ width: widthOf(column.id) }} />
          ))}
        </colgroup>
        <Table.Caption>{caption}</Table.Caption>
        <Table.Thead>
          {table.getHeaderGroups().map((group) => (
            <Table.Tr key={group.id}>
              {group.headers.map((header) => {
                const column = header.column;
                const pinned = column.id === 'name';
                const sorted = column.getIsSorted();
                return (
                  <Table.Th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : 'none'
                    }
                    className={[
                      classes['head'],
                      pinned ? classes['pinned'] : classes['numeric'],
                    ].join(' ')}
                  >
                    <UnstyledButton
                      className={classes['sortButton']}
                      title={
                        allColumns.find((meta) => meta.id === column.id)?.label
                      }
                      onClick={column.getToggleSortingHandler() ?? (() => {})}
                    >
                      <table.FlexRender header={header} />
                      <span aria-hidden="true">
                        {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : ''}
                      </span>
                    </UnstyledButton>
                  </Table.Th>
                );
              })}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.map((row) => (
            <Table.Tr key={row.id} className={classes['row']}>
              {row.getVisibleCells().map((cell) => {
                const sorted = cell.column.getIsSorted();
                return cell.column.id === 'name' ? (
                  <Table.Th
                    key={cell.id}
                    scope="row"
                    className={classes['pinned']}
                  >
                    <table.FlexRender cell={cell} />
                  </Table.Th>
                ) : (
                  <Table.Td
                    key={cell.id}
                    className={[
                      classes['numeric'],
                      sorted ? classes['sorted'] : '',
                    ].join(' ')}
                  >
                    <table.FlexRender cell={cell} />
                  </Table.Td>
                );
              })}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
