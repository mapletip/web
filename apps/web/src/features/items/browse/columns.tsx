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
  DEFAULT_CONTEXT_COLUMNS,
  type ColumnConfig,
  type ColumnKey,
} from './column-configs';
import classes from './columns.module.css';
import { ItemIcon } from './ItemIcon';
import type { ItemRow } from './project';
import { itemCategoryContextKey, type ItemCategorySelection } from './routing';

export interface ItemTableColumn extends TableColumn<ItemRow> {
  readonly sortLabels?: { readonly asc: string; readonly desc: string };
}

export interface ItemFactDescriptor {
  readonly key: string;
  readonly title: string;
  readonly value: (row: ItemRow) => string | undefined;
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
  if (
    column.relationshipKind &&
    coverage.relationships[column.relationshipKind] === 'unsupported'
  ) {
    return false;
  }

  const values = rows.map((row) => column.value(row, coverage));
  const hasValue = values.some((value) => value !== undefined);
  if (!hasValue) return false;
  if (rows.length === 1) return true;

  const firstValue = values[0];
  const allShareSameValue = values.every((value) => value === firstValue);
  return !allShareSameValue;
}

function adaptColumn(
  config: ColumnConfig,
  coverage: ItemBrowseCoverage,
): ItemTableColumn {
  const isNumeric = config.numeric ?? false;
  const isSortable = config.sortable ?? isNumeric;
  const width = config.width ?? (isNumeric ? 100 : undefined);

  return {
    accessor: config.accessor,
    title: config.title,
    ...(config.fullLabel ? { fullLabel: config.fullLabel } : {}),
    ...(width !== undefined ? { width } : {}),
    ...(config.nowrap ? { nowrap: true } : {}),
    ...(config.headerWrap
      ? { headerClassName: classes['wrappingHeader'] }
      : {}),
    ...(isNumeric ? { numeric: true, textAlign: 'right' as const } : {}),
    ...(isSortable ? { sortable: true } : {}),
    ...(config.firstSortDirection
      ? { firstSortDirection: config.firstSortDirection }
      : {}),
    ...(config.sortLabels ? { sortLabels: config.sortLabels } : {}),
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
      return <span className={classes['cellValue']}>{displayValue}</span>;
    },
  };
}

export interface GetItemColumnsResult {
  readonly columns: readonly ItemTableColumn[];
  readonly defaultHiddenColumns: readonly string[];
  readonly sortOptions: readonly BrowseSortOption[];
  readonly facts: readonly ItemFactDescriptor[];
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
    DEFAULT_CONTEXT_COLUMNS;

  const optionalKeys = (context.optional ?? []).filter(
    (key) => !context.visible.includes(key),
  );
  const candidateKeys: ColumnKey[] = [...context.visible, ...optionalKeys];
  const defaultHidden = new Set<string>(optionalKeys);

  const columns: ItemTableColumn[] = [];
  const defaultHiddenColumns: string[] = [];
  const facts: ItemFactDescriptor[] = [];

  for (const key of candidateKeys) {
    const config = COLUMNS[key];
    if (shouldIncludeColumn(config, rows, coverage)) {
      columns.push(adaptColumn(config, coverage));
      if (defaultHidden.has(key)) {
        defaultHiddenColumns.push(config.accessor);
      }
      if (config.key !== 'name') {
        facts.push({
          key: config.key,
          title: config.title,
          value: (row) => config.value(row, coverage),
        });
      }
    }
  }

  return {
    columns,
    defaultHiddenColumns,
    sortOptions: deriveSortOptions(columns),
    facts,
  };
}

export function deriveSortOptions(
  columns: readonly ItemTableColumn[],
): readonly BrowseSortOption[] {
  return columns
    .filter((column) => column.sortable)
    .flatMap((column) => {
      const isNumeric = column.numeric ?? false;
      const primary = column.firstSortDirection ?? (isNumeric ? 'desc' : 'asc');
      const secondary = primary === 'desc' ? 'asc' : 'desc';
      const getLabel = (direction: 'asc' | 'desc') => {
        if (column.sortLabels) {
          return column.sortLabels[direction];
        }
        return isNumeric
          ? `${column.title}: ${direction === 'desc' ? 'high to low' : 'low to high'}`
          : `${column.title} (${direction === 'asc' ? 'A–Z' : 'Z–A'})`;
      };
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
