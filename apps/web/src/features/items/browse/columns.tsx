/**
 * Column derivation, table adaptation, and sort options for Items Browse.
 */
import type {
  BrowseSortOption,
  TableColumn,
} from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';
import type { ReactElement } from 'react';

import {
  COLUMNS,
  CONTEXT_COLUMNS,
  type ColumnConfig,
  type ColumnKey,
} from './column-configs';
import classes from './columns.module.css';
import { ItemIcon } from './ItemIcon';
import type { ItemRow } from './project';
import { itemCategoryContextKey, type ItemCategorySelection } from './routing';

export interface ItemTableColumn extends TableColumn<ItemRow> {
  readonly getValue?: (row: ItemRow) => string | undefined;
}

export function ItemIdentity({
  record,
}: {
  readonly record: ItemRow;
}): ReactElement {
  const displayName = record.name ?? 'Unnamed item';
  return (
    <div className={classes['identity']}>
      <ItemIcon icon={record.icon} />
      <div className={classes['identityText']}>
        <span className={classes['identityName']} title={displayName}>
          {displayName}
        </span>
        <span className={classes['identityId']}>{record.sourceId}</span>
      </div>
    </div>
  );
}

export function shouldIncludeColumn(
  column: ColumnConfig,
  rows: readonly ItemRow[],
  coverage: ItemBrowseCoverage,
): boolean {
  if (column.key === 'name') return true;
  if (rows.length === 0) return false;

  const firstValue = column.value(rows[0]!, coverage);
  if (firstValue === 'Unavailable') return false;

  let hasAnyValue = firstValue !== undefined;
  let allShareSameValue = true;

  for (let index = 1; index < rows.length; index += 1) {
    const value = column.value(rows[index]!, coverage);
    if (value === 'Unavailable') return false;
    if (value !== undefined) hasAnyValue = true;
    if (value !== firstValue) allShareSameValue = false;
  }

  return hasAnyValue && (rows.length === 1 || !allShareSameValue);
}

function adaptColumn(
  config: ColumnConfig,
  coverage: ItemBrowseCoverage,
): ItemTableColumn {
  const isNumeric = config.numeric ?? false;
  const isSortable = config.sortable ?? isNumeric;
  const width = config.width ?? (isNumeric ? 100 : undefined);

  return {
    accessor: (config.key === 'kind'
      ? 'itemClass'
      : config.key) as keyof ItemRow,
    title: config.title,
    ...(config.fullLabel ? { fullLabel: config.fullLabel } : {}),
    ...(width !== undefined ? { width } : {}),
    ...(isNumeric ? { numeric: true, textAlign: 'right' as const } : {}),
    ...(isSortable ? { sortable: true } : {}),
    ...(config.firstSortDirection
      ? { firstSortDirection: config.firstSortDirection }
      : {}),
    getValue: (row) => config.value(row, coverage),
    render: (row) => {
      if (config.key === 'name') return <ItemIdentity record={row} />;
      const displayValue = config.value(row, coverage);
      if (displayValue === undefined) {
        return (
          <span title="Not recorded" aria-label="Not recorded">
            —
          </span>
        );
      }
      if (displayValue.endsWith('+')) {
        const title = `${displayValue.slice(0, -1)} (lower bound)`;
        return (
          <span title={title} aria-label={title}>
            {displayValue}
          </span>
        );
      }
      return displayValue;
    },
  };
}

export interface GetItemColumnsResult {
  readonly columns: readonly ItemTableColumn[];
  readonly defaultHiddenColumns: readonly string[];
  readonly sortOptions: readonly BrowseSortOption[];
}

export function getItemColumns(
  category: ItemCategorySelection,
  coverage: ItemBrowseCoverage,
  rows: readonly ItemRow[],
): GetItemColumnsResult {
  const contextKey = itemCategoryContextKey(category);
  const context =
    CONTEXT_COLUMNS[contextKey] ??
    CONTEXT_COLUMNS[category.scope.slug] ??
    CONTEXT_COLUMNS['all']!;

  const candidateKeys: ColumnKey[] = [
    ...context.visible,
    ...(context.optional ?? []),
  ];
  const defaultHidden = new Set<string>(context.optional ?? []);

  const columns: ItemTableColumn[] = [];
  const defaultHiddenColumns: string[] = [];

  for (const key of candidateKeys) {
    const config = COLUMNS[key];
    if (shouldIncludeColumn(config, rows, coverage)) {
      columns.push(adaptColumn(config, coverage));
      if (defaultHidden.has(key)) {
        defaultHiddenColumns.push(
          config.key === 'kind' ? 'itemClass' : config.key,
        );
      }
    }
  }

  return {
    columns,
    defaultHiddenColumns,
    sortOptions: deriveSortOptions(columns),
  };
}

export function deriveSortOptions(
  columns: readonly TableColumn<ItemRow>[],
): readonly BrowseSortOption[] {
  return columns
    .filter((column) => column.sortable)
    .flatMap((column) => {
      const isNumeric = column.numeric ?? false;
      const primary = column.firstSortDirection ?? (isNumeric ? 'desc' : 'asc');
      const secondary = primary === 'desc' ? 'asc' : 'desc';
      const getLabel = (direction: 'asc' | 'desc') =>
        isNumeric
          ? `${column.title}: ${direction === 'desc' ? 'high to low' : 'low to high'}`
          : `${column.title} (${direction === 'asc' ? 'A–Z' : 'Z–A'})`;
      return [
        {
          field: column.accessor,
          direction: primary,
          label: getLabel(primary),
        },
        {
          field: column.accessor,
          direction: secondary,
          label: getLabel(secondary),
        },
      ];
    });
}
