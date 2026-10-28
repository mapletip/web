import { useMemo, type ReactElement } from 'react';

import classes from '@/components/Table/comparison-table.module.css';
import { Table } from '@/components/Table/Table';
import type { TableColumn, TableProps } from '@/components/Table/types';

export type ComparisonTableProps<TRow extends Record<string, unknown>> =
  TableProps<TRow> & {
    /** Column that identifies each record; rendered first and pinned by DataTable. */
    readonly identityField: keyof TRow & string;
  };

/**
 * Comparison presentation over `Table`: pinned identity and hover emphasis. By default,
 * the table grows to its records and the document scrolls; callers can set maxHeight to
 * opt into DataTable's bounded, locally sticky scroll region.
 */
export function ComparisonTable<TRow extends Record<string, unknown>>({
  identityField,
  columns,
  className,
  maxHeight,
  highlightOnHover = true,
  resizable = true,
  ...tableProps
}: ComparisonTableProps<TRow>): ReactElement {
  const hasIdentityColumn = columns.some(
    (column) => column.accessor === identityField,
  );

  const comparisonColumns = useMemo<readonly TableColumn<TRow>[]>(
    () =>
      columns.map((column) => ({
        ...column,
        cellClassName: [column.cellClassName, classes['columnHoverCell']]
          .filter(Boolean)
          .join(' '),
      })),
    [columns],
  );

  const classNames = useMemo<TableProps<TRow>['classNames']>(() => {
    const hostClassNames = tableProps.classNames;
    return {
      ...hostClassNames,
      table: [hostClassNames?.table, classes['comparisonTable']]
        .filter(Boolean)
        .join(' '),
    };
  }, [tableProps.classNames]);

  const comparisonRowClassName = useMemo<
    TableProps<TRow>['rowClassName']
  >(() => {
    const hostRowClassName = tableProps.rowClassName;
    if (hostRowClassName === undefined) return classes['row'];
    if (typeof hostRowClassName === 'function') {
      return (record, index) =>
        [classes['row'], hostRowClassName(record, index)]
          .filter(Boolean)
          .join(' ');
    }
    return [classes['row'], hostRowClassName].filter(Boolean).join(' ');
  }, [tableProps.rowClassName]);

  if (!hasIdentityColumn) {
    throw new Error(
      `ComparisonTable requires an identity column with accessor "${identityField}".`,
    );
  }

  return (
    <Table<TRow>
      {...tableProps}
      classNames={classNames}
      columns={comparisonColumns}
      identityColumnAccessor={identityField}
      highlightOnHover={highlightOnHover}
      {...(maxHeight !== undefined ? { maxHeight } : {})}
      resizable={resizable}
      rowClassName={comparisonRowClassName}
      className={[classes['comparison'], className].filter(Boolean).join(' ')}
    />
  );
}
