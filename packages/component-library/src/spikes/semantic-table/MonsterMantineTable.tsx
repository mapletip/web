import { Table, UnstyledButton } from '@mantine/core';
import type { ReactElement } from 'react';

import { Identity, StatValue, valueOf } from './cells';
import { allColumns, totalWidth } from './columns';
import classes from './MonsterTable.module.css';
import type { MonsterTableProps } from './types';

/** First-party Mantine Table only: no table engine, columns are a plain array. */
export function MonsterMantineTable({
  rows,
  caption,
  sort,
  onSortChange,
  hiddenColumns = [],
}: MonsterTableProps): ReactElement {
  const visible = allColumns.filter(
    (column) => !hiddenColumns.includes(column.id as never),
  );
  const width = totalWidth(visible);

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
            <col key={column.id} style={{ width: column.width }} />
          ))}
        </colgroup>
        <Table.Caption>{caption}</Table.Caption>
        <Table.Thead>
          <Table.Tr>
            {visible.map((column) => {
              const direction =
                sort?.field === column.id ? sort.direction : null;
              const next = direction
                ? direction === 'asc'
                  ? 'desc'
                  : 'asc'
                : column.descFirst
                  ? 'desc'
                  : 'asc';
              return (
                <Table.Th
                  key={column.id}
                  scope="col"
                  aria-sort={
                    direction === 'asc'
                      ? 'ascending'
                      : direction === 'desc'
                        ? 'descending'
                        : 'none'
                  }
                  className={[
                    classes['head'],
                    column.numeric ? classes['numeric'] : classes['pinned'],
                  ].join(' ')}
                >
                  <UnstyledButton
                    className={classes['sortButton']}
                    title={column.label}
                    onClick={() =>
                      onSortChange({ field: column.id, direction: next })
                    }
                  >
                    {column.header}
                    <span aria-hidden="true">
                      {direction === 'asc'
                        ? '↑'
                        : direction === 'desc'
                          ? '↓'
                          : ''}
                    </span>
                  </UnstyledButton>
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.id} className={classes['row']}>
              {visible.map((column) =>
                column.id === 'name' ? (
                  <Table.Th
                    key={column.id}
                    scope="row"
                    className={classes['pinned']}
                  >
                    <Identity record={row} />
                  </Table.Th>
                ) : (
                  <Table.Td
                    key={column.id}
                    className={[
                      classes['numeric'],
                      sort?.field === column.id ? classes['sorted'] : '',
                    ].join(' ')}
                  >
                    <StatValue value={valueOf(row, column.id)} />
                  </Table.Td>
                ),
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
