import 'mantine-datatable/styles.css';
import { DataTable, type DataTableColumn } from 'mantine-datatable';
import type { ReactElement } from 'react';

import type { SpikeMonster } from '../ag-grid/fixtures';

import { Identity, StatValue, valueOf } from './cells';
import { allColumns } from './columns';
import type { MonsterTableProps } from './types';

/**
 * Minimal Mantine DataTable comparison used only to settle SSR and
 * accessibility questions. It is intentionally not feature-complete
 * (no column-hover, no pagination: those are evaluated from source).
 */
export function MonsterDataTable({
  rows,
  sort,
  onSortChange,
}: MonsterTableProps): ReactElement {
  const columns: DataTableColumn<SpikeMonster>[] = allColumns.map((column) => ({
    accessor: column.id,
    title: column.header,
    width: column.width,
    sortable: true,
    textAlign: column.numeric ? 'right' : 'left',
    render: (record) =>
      column.numeric ? (
        <StatValue value={valueOf(record, column.id)} />
      ) : (
        <Identity record={record} />
      ),
  }));

  return (
    <DataTable<SpikeMonster>
      records={rows as SpikeMonster[]}
      columns={columns}
      idAccessor="id"
      pinFirstColumn
      highlightOnHover
      withTableBorder
      withColumnBorders={false}
      horizontalSpacing={10}
      verticalSpacing={6}
      maxHeight="calc(100dvh - 120px)"
      sortStatus={{
        columnAccessor: sort?.field ?? 'exp',
        direction: sort?.direction ?? 'desc',
      }}
      onSortStatusChange={({ columnAccessor, direction }) =>
        onSortChange({
          field: columnAccessor as never,
          direction,
        })
      }
    />
  );
}
