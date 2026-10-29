import { ActionIcon, Text } from '@mantine/core';
import {
  DataTable,
  type DataTableColumn,
  type DataTableRowExpansionProps,
  type DataTableSortStatus,
} from 'mantine-datatable';
import {
  isValidElement,
  useCallback,
  useId,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import classes from '@/components/Table/table.module.css';
import {
  deriveTableStorageKey,
  resolveTableStorageKey,
} from '@/components/Table/tableStorageKey';
import type { TableColumn, TableProps } from '@/components/Table/types';

function columnWrapProps<TRow extends Record<string, unknown>>(
  column: TableColumn<TRow>,
): { ellipsis: true } | { noWrap: true } | Record<string, never> {
  if (column.ellipsis) return { ellipsis: true };
  if (column.nowrap) return { noWrap: true };
  return {};
}

function defaultCellContent(value: unknown): ReactNode {
  if (value === null || value === undefined || typeof value === 'boolean') {
    return null;
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return value;
  }
  return isValidElement(value) ? value : null;
}

/**
 * Typed Mantine DataTable 9.x integration. It preserves host record order and forwards
 * sort intent; DataTable is only responsible for rendering, scrolling and grid mechanics.
 */
export function MantineDataTableAdapter<TRow extends Record<string, unknown>>({
  records,
  columns,
  idAccessor,
  identityColumnAccessor,
  sortStatus,
  onSortChange,
  height,
  minHeight,
  maxHeight,
  minWidth,
  resizable = false,
  storeColumnsKey,
  classNames,
  withTableBorder = false,
  withColumnBorders = false,
  withRowBorders = true,
  horizontalSpacing,
  striped = false,
  highlightOnHover = false,
  fetching = false,
  emptyState,
  noRecordsText = 'No records found',
  rowExpansionContent,
  expandedRowIds,
  onExpandedRowIdsChange,
  allowMultipleExpandedRows,
  onRowClick,
  rowClassName,
  className,
  ariaLabel,
  ariaLabelledBy,
}: TableProps<TRow>): ReactElement {
  const pinnedIdentity = identityColumnAccessor;
  const instanceId = useId();
  // One deterministic bucket per logical table shape. Remounts and visibility
  // changes reuse it; `null` opts out; a host key scopes it to a domain/build.
  const effectiveStoreColumnsKey = resolveTableStorageKey(storeColumnsKey, () =>
    deriveTableStorageKey({
      columns,
      idAccessor: String(idAccessor),
      ...(pinnedIdentity !== undefined
        ? { identityField: String(pinnedIdentity) }
        : {}),
    }),
  );
  const [internalExpandedRowIds, setInternalExpandedRowIds] = useState<
    readonly unknown[]
  >([]);
  const effectiveExpandedRowIds = expandedRowIds ?? internalExpandedRowIds;
  const allowMultiple = allowMultipleExpandedRows ?? false;

  const handleExpandedRowIdsChange = useCallback(
    (recordIds: readonly unknown[]) => {
      if (expandedRowIds === undefined) {
        setInternalExpandedRowIds(recordIds);
      }
      onExpandedRowIdsChange?.(recordIds);
    },
    [expandedRowIds, onExpandedRowIdsChange],
  );

  const expansionIdFor = useCallback(
    (recordId: unknown) => `${instanceId}-table-details-${String(recordId)}`,
    [instanceId],
  );

  const toggleExpandedRecord = useCallback(
    (record: TRow) => {
      const recordId = record[idAccessor];
      const isExpanded = effectiveExpandedRowIds.some(
        (expandedId) => expandedId === recordId,
      );
      let nextIds: readonly unknown[];
      if (isExpanded) {
        nextIds = effectiveExpandedRowIds.filter(
          (expandedId) => expandedId !== recordId,
        );
      } else if (allowMultiple) {
        nextIds = [...effectiveExpandedRowIds, recordId];
      } else {
        nextIds = [recordId];
      }
      handleExpandedRowIdsChange(nextIds);
    },
    [
      allowMultiple,
      effectiveExpandedRowIds,
      handleExpandedRowIdsChange,
      idAccessor,
    ],
  );

  const orderedColumns = useMemo<readonly TableColumn<TRow>[]>(() => {
    if (pinnedIdentity === undefined) return [...columns];

    const identity = columns.find(
      (column) => column.accessor === pinnedIdentity,
    );
    if (identity === undefined) return [...columns];

    return [
      identity,
      ...columns.filter((column) => column.accessor !== pinnedIdentity),
    ];
  }, [columns, pinnedIdentity]);

  const expansionAccessor = orderedColumns[0]?.accessor;

  const dataTableColumns = useMemo<DataTableColumn<TRow>[]>(() => {
    return orderedColumns.map((column) => {
      const isIdentity =
        pinnedIdentity !== undefined && column.accessor === pinnedIdentity;
      const isPinned = isIdentity;
      const isExpansionColumn =
        rowExpansionContent !== undefined &&
        column.accessor === expansionAccessor;
      const cellsClassName = [
        column.cellClassName,
        column.numeric ? classes['numericCell'] : undefined,
      ]
        .filter(Boolean)
        .join(' ');
      const renderColumnContent = (record: TRow): ReactNode =>
        column.render?.(record) ??
        defaultCellContent(record[String(column.accessor)]);

      let renderCell: ((record: TRow) => ReactNode) | undefined;
      if (isExpansionColumn) {
        renderCell = (record: TRow) => {
          const recordId = record[idAccessor];
          const expanded = effectiveExpandedRowIds.some(
            (expandedId) => expandedId === recordId,
          );
          return (
            <span className={classes['expansionCell']}>
              <ActionIcon
                type="button"
                variant="default"
                size={24}
                radius="sm"
                aria-expanded={expanded}
                aria-controls={expansionIdFor(recordId)}
                aria-label={`${expanded ? 'Collapse' : 'Expand'} details for ${String(record[column.accessor])}`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleExpandedRecord(record);
                }}
              >
                <span aria-hidden="true">{expanded ? '−' : '+'}</span>
              </ActionIcon>
              {renderColumnContent(record)}
            </span>
          );
        };
      } else if (column.render !== undefined) {
        renderCell = (record: TRow) => column.render?.(record);
      }

      const resizableColumn = column.resizable ?? resizable;
      const wrapProps = columnWrapProps(column);

      return {
        accessor: column.accessor,
        title: column.fullLabel ? (
          <abbr aria-label={column.fullLabel} title={column.fullLabel}>
            {column.title}
          </abbr>
        ) : (
          column.title
        ),
        sortable: column.sortable ?? false,
        textAlign: column.textAlign ?? (column.numeric ? 'right' : 'left'),
        ...(cellsClassName ? { cellsClassName } : {}),
        ...(column.headerClassName
          ? { titleClassName: column.headerClassName }
          : {}),
        ...(column.width !== undefined ? { width: column.width } : {}),
        ...(resizableColumn ? { resizable: true } : {}),
        ...wrapProps,
        ...(isPinned ? { pinned: 'left' as const } : {}),
        ...(renderCell ? { render: renderCell } : {}),
      };
    });
  }, [
    effectiveExpandedRowIds,
    expansionAccessor,
    expansionIdFor,
    idAccessor,
    orderedColumns,
    pinnedIdentity,
    resizable,
    rowExpansionContent,
    toggleExpandedRecord,
  ]);

  const nextSortDirection = useCallback(
    (field: string): 'asc' | 'desc' => {
      if (sortStatus?.field === field) {
        return sortStatus.direction === 'asc' ? 'desc' : 'asc';
      }
      return (
        columns.find((column) => column.accessor === field)
          ?.firstSortDirection ?? 'asc'
      );
    },
    [columns, sortStatus],
  );

  // DataTable reuses the previous column's direction when switching columns.
  // The public contract is the newly selected column's firstSortDirection.
  const handleSortStatusChange = useCallback(
    (status: DataTableSortStatus<TRow>) => {
      if (onSortChange === undefined) return;

      const field = String(status.columnAccessor);
      const direction = nextSortDirection(field);

      onSortChange({ field, direction });
    },
    [nextSortDirection, onSortChange],
  );

  const rowExpansion = useMemo<
    DataTableRowExpansionProps<TRow> | undefined
  >(() => {
    if (rowExpansionContent === undefined) return undefined;

    return {
      // Expansion is activated by the semantic control rendered above. DataTable
      // continues to own the expanded-row rendering and collapse mechanics.
      trigger: 'never',
      ...(allowMultipleExpandedRows !== undefined
        ? { allowMultiple: allowMultipleExpandedRows }
        : {}),
      content: ({ record }) => {
        return (
          <div id={expansionIdFor(record[idAccessor])}>
            {rowExpansionContent(record)}
          </div>
        );
      },
      expanded: {
        recordIds: [...effectiveExpandedRowIds],
        onRecordIdsChange: (recordIds: unknown[]) =>
          handleExpandedRowIdsChange(recordIds),
      },
    };
  }, [
    allowMultipleExpandedRows,
    effectiveExpandedRowIds,
    expansionIdFor,
    handleExpandedRowIdsChange,
    idAccessor,
    rowExpansionContent,
  ]);

  if (rowExpansionContent === undefined && expandedRowIds !== undefined) {
    throw new Error(
      'Table expandedRowIds requires rowExpansionContent to be provided.',
    );
  }
  if (
    rowExpansionContent === undefined &&
    onExpandedRowIdsChange !== undefined
  ) {
    throw new Error(
      'Table onExpandedRowIdsChange requires rowExpansionContent to be provided.',
    );
  }
  if (expandedRowIds === undefined && onExpandedRowIdsChange !== undefined) {
    throw new Error(
      'Table onExpandedRowIdsChange requires controlled expandedRowIds.',
    );
  }

  // DataTable's published prop is a mutable array; the copy preserves host
  // order and ensures DataTable never mutates the canonical page slice.
  const tableRecords = useMemo(() => [...records], [records]);
  const sortStatusValue: DataTableSortStatus<TRow> =
    sortStatus !== undefined
      ? {
          columnAccessor: sortStatus.field,
          direction: sortStatus.direction,
        }
      : {
          // DataTable's published type requires sortStatus to accompany
          // onSortStatusChange, although its runtime supports an unsorted state.
          // This sentinel is never a displayed column or query state.
          columnAccessor: '__mapletip_unsorted__',
          direction: 'asc' as const,
        };
  const sortProps =
    sortStatus !== undefined || onSortChange !== undefined
      ? {
          sortStatus: sortStatusValue,
          ...(onSortChange !== undefined
            ? { onSortStatusChange: handleSortStatusChange }
            : {}),
        }
      : {};

  return (
    <DataTable<TRow>
      records={tableRecords}
      columns={dataTableColumns}
      idAccessor={idAccessor}
      withTableBorder={withTableBorder}
      withColumnBorders={withColumnBorders}
      withRowBorders={withRowBorders}
      striped={striped}
      highlightOnHover={highlightOnHover}
      fetching={fetching}
      noRecordsText={noRecordsText}
      {...sortProps}
      {...(className !== undefined ? { className } : {})}
      {...(height !== undefined ? { height } : {})}
      {...(minHeight !== undefined ? { minHeight } : {})}
      {...(maxHeight !== undefined
        ? {
            maxHeight,
            // DataTable 9.4's maxHeight caps the root but leaves the ScrollArea
            // viewport at content height when the root has no definite height.
            // Mirroring the cap on the viewport keeps maxHeight scrollable.
            scrollAreaProps: {
              viewportProps: { style: { maxHeight } },
            },
          }
        : {})}
      styles={{
        table: {
          width: 'max-content',
          ...(minWidth !== undefined ? { minWidth } : {}),
        },
      }}
      storeColumnsKey={effectiveStoreColumnsKey}
      {...(classNames !== undefined ? { classNames } : {})}
      {...(horizontalSpacing !== undefined ? { horizontalSpacing } : {})}
      {...(rowExpansion !== undefined ? { rowExpansion } : {})}
      {...(onRowClick !== undefined ? { onRowClick } : {})}
      {...(rowClassName !== undefined ? { rowClassName } : {})}
      emptyState={
        emptyState ?? (
          <Text size="sm" c="var(--mantine-color-text)">
            {noRecordsText}
          </Text>
        )
      }
      {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { 'aria-labelledby': ariaLabelledBy }
        : {})}
    />
  );
}
