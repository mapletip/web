import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Popover,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { Gear } from '@phosphor-icons/react';
import { useMemo, type ReactElement } from 'react';

import type { BrowseSortOption } from '@/components/FacetedBrowser/FacetedBrowser.types';
import type { TableColumn } from '@/components/Table';

function sameFields(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const a = new Set(left);
  const b = new Set(right);
  return a.size === b.size && [...a].every((field) => b.has(field));
}

function canHideColumn<TRecord extends Record<string, unknown>>(
  accessor: string,
  dataColumns: readonly TableColumn<TRecord>[],
  hiddenColumns: readonly string[],
): boolean {
  const visible = dataColumns.filter(
    (column) => !hiddenColumns.includes(column.accessor),
  );
  return (
    visible.length > 1 ||
    !visible.some((column) => column.accessor === accessor)
  );
}

export interface PageSizeSelectProps {
  readonly recordNoun: string;
  readonly pageSize: number;
  readonly pageSizeOptions: readonly number[];
  readonly onChange: (pageSize: number) => void;
}

export function PageSizeSelect({
  recordNoun,
  pageSize,
  pageSizeOptions,
  onChange,
}: PageSizeSelectProps): ReactElement {
  const data = useMemo(
    () =>
      [...new Set([...pageSizeOptions, pageSize])].map((size) => ({
        value: String(size),
        label: String(size),
      })),
    [pageSize, pageSizeOptions],
  );

  return (
    <Group gap={6} align="center">
      <Text size="xs" c="dimmed">
        Per page:
      </Text>
      <Select
        aria-label={`${recordNoun} per page`}
        size="sm"
        checkIconPosition="left"
        withAlignedLabels
        value={String(pageSize)}
        data={data}
        onChange={(value) => {
          if (value !== null) onChange(Number(value));
        }}
        w={76}
      />
    </Group>
  );
}

const DRAWER_SELECT_STYLES = {
  label: {
    fontWeight: 600,
    fontSize: 'var(--mantine-font-size-sm)',
    color: 'var(--mantine-color-text)',
    marginBottom: 'var(--mantine-spacing-xs)',
  },
} as const;

export interface SortSelectProps {
  readonly recordNoun: string;
  readonly sortOptions: readonly BrowseSortOption[];
  readonly currentSort?:
    { readonly field: string; readonly direction: 'asc' | 'desc' } | undefined;
  readonly onChange: (field: string, direction: 'asc' | 'desc') => void;
  readonly surface?: 'toolbar' | 'drawer';
}

export function SortSelect({
  recordNoun,
  sortOptions,
  currentSort,
  onChange,
  surface = 'toolbar',
}: SortSelectProps): ReactElement {
  const selectedValue = currentSort
    ? `${currentSort.field}:${currentSort.direction}`
    : null;

  const data = useMemo(
    () =>
      sortOptions.map((opt) => ({
        value: `${opt.field}:${opt.direction}`,
        label: opt.label,
      })),
    [sortOptions],
  );

  const select = (
    <Select
      aria-label={surface === 'toolbar' ? `Sort ${recordNoun}` : undefined}
      label={surface === 'drawer' ? 'Sort' : undefined}
      size="sm"
      checkIconPosition="left"
      withAlignedLabels
      allowDeselect={false}
      value={selectedValue}
      data={data}
      onChange={(value) => {
        if (!value) return;
        const opt = sortOptions.find(
          (o) => `${o.field}:${o.direction}` === value,
        );
        if (opt) {
          onChange(opt.field, opt.direction);
        }
      }}
      w={surface === 'drawer' ? '100%' : { base: '100%', md: 230 }}
      {...(surface === 'drawer' ? { styles: DRAWER_SELECT_STYLES } : {})}
    />
  );

  if (surface === 'drawer') return select;

  return (
    <Group gap={6} align="center">
      <Text size="xs" c="dimmed">
        Sort:
      </Text>
      {select}
    </Group>
  );
}

export interface ToolbarProps<TRecord extends Record<string, unknown>> {
  readonly columns: readonly TableColumn<TRecord>[];
  readonly idAccessor: keyof TRecord & string;
  readonly identityField: keyof TRecord & string;
  readonly hiddenColumns: readonly string[];
  readonly defaultHiddenColumns: readonly string[];
  readonly recordNoun: string;
  readonly pageSize: number;
  readonly pageSizeOptions: readonly number[];
  readonly onHiddenColumnsChange: (hiddenColumns: readonly string[]) => void;
  readonly onColumnVisibilityChange: (field: string, visible: boolean) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

/** Column visibility and page-size controls for the desktop comparison surface. */
export function Toolbar<TRecord extends Record<string, unknown>>({
  columns,
  idAccessor,
  identityField,
  hiddenColumns,
  defaultHiddenColumns,
  recordNoun,
  pageSize,
  pageSizeOptions,
  onHiddenColumnsChange,
  onColumnVisibilityChange,
  onPageSizeChange,
}: ToolbarProps<TRecord>): ReactElement {
  const dataColumns = columns.filter(
    (column) =>
      column.accessor !== idAccessor && column.accessor !== identityField,
  );
  const visibleDataColumns = dataColumns.filter(
    (column) => !hiddenColumns.includes(column.accessor),
  );

  return (
    <Group gap="xs">
      <Popover position="bottom-end" withArrow shadow="sm">
        <Popover.Target>
          <ActionIcon
            variant="default"
            size={36}
            aria-label={`Choose columns, ${visibleDataColumns.length} of ${dataColumns.length} shown`}
          >
            <Gear aria-hidden="true" size={18} weight="bold" />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            <Text size="sm" fw={650} component="p" m={0}>
              Choose columns
            </Text>
            <Text size="xs" c="dimmed" component="p" m={0}>
              The first column is always visible.
            </Text>
            {dataColumns.map((column) => {
              const visible = !hiddenColumns.includes(column.accessor);
              return (
                <Checkbox
                  key={column.accessor}
                  // Abbreviated headers stay in the table; the picker uses the
                  // full name so a choice does not read as a second abbreviation.
                  label={column.fullLabel ?? column.title}
                  checked={visible}
                  disabled={
                    visible &&
                    !canHideColumn(column.accessor, dataColumns, hiddenColumns)
                  }
                  onChange={(event) =>
                    onColumnVisibilityChange(
                      column.accessor,
                      event.currentTarget.checked,
                    )
                  }
                />
              );
            })}
            <Button
              type="button"
              variant="subtle"
              size="compact-sm"
              onClick={() => onHiddenColumnsChange([])}
              disabled={hiddenColumns.length === 0}
            >
              Show all columns
            </Button>
            <Button
              type="button"
              variant="subtle"
              size="compact-sm"
              onClick={() => onHiddenColumnsChange(defaultHiddenColumns)}
              disabled={sameFields(hiddenColumns, defaultHiddenColumns)}
            >
              Reset columns
            </Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>
      <PageSizeSelect
        recordNoun={recordNoun}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onChange={onPageSizeChange}
      />
    </Group>
  );
}
