import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../../styles.css';
import { Table } from '@/components/Table/Table';
import type { TableProps } from '@/components/Table/Table';
import type { TableColumn } from '@/components/Table/types';
import { theme } from '@/theme';

interface TestRecord extends Record<string, unknown> {
  id: string;
  name: string;
  level: number;
  category: string;
}

const sampleRecords: readonly TestRecord[] = [
  { id: 'rec-3', name: 'Zebra', level: 90, category: 'Fauna' },
  { id: 'rec-1', name: 'Apple', level: 10, category: 'Flora' },
  { id: 'rec-2', name: 'Mango', level: 50, category: 'Flora' },
];

const sampleColumns: readonly TableColumn<TestRecord>[] = [
  {
    accessor: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    accessor: 'level',
    title: 'Level',
    sortable: true,
    numeric: true,
    firstSortDirection: 'desc',
  },
  {
    accessor: 'category',
    title: 'Category',
    sortable: true,
  },
];

beforeEach(async () => {
  document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  await page.viewport(1024, 768);
});

async function mountAdapter(props: Partial<TableProps<TestRecord>> = {}) {
  const onSortChange = props.onSortChange ?? vi.fn();

  await render(
    <MantineProvider theme={theme}>
      <Table<TestRecord>
        ariaLabel="Adapter test table"
        records={props.records ?? sampleRecords}
        columns={props.columns ?? sampleColumns}
        idAccessor="id"
        identityColumnAccessor="name"
        {...(props.sortStatus ? { sortStatus: props.sortStatus } : {})}
        onSortChange={onSortChange}
      />
    </MantineProvider>,
  );

  await vi.waitFor(() =>
    expect(document.querySelector('.mantine-datatable')).not.toBeNull(),
  );

  return { onSortChange };
}

describe('Table sort intent and ordering', () => {
  it('preserves supplied record order without independent client-side re-sorting', async () => {
    // Pass records in deliberate unsorted order with a sortStatus defined
    await mountAdapter({
      records: sampleRecords,
      sortStatus: { field: 'name', direction: 'asc' },
    });

    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    // Verify DOM order matches input order ['Zebra', 'Apple', 'Mango'], not sorted ['Apple', 'Mango', 'Zebra']
    const cellTexts = Array.from(rows).map((r) =>
      r.querySelector('td')?.textContent?.trim(),
    );
    expect(cellTexts).toEqual(['Zebra', 'Apple', 'Mango']);
  });

  it('places identity column first and applies left pinning even when defined later in columns', async () => {
    // Provide columns with 'level' first, 'name' second
    const reorderedColumns: readonly TableColumn<TestRecord>[] = [
      sampleColumns[1]!, // level
      sampleColumns[0]!, // name (identityField)
      sampleColumns[2]!, // category
    ];

    await mountAdapter({
      columns: reorderedColumns,
    });

    const headerCells = document.querySelectorAll('thead th');
    expect(headerCells.length).toBeGreaterThanOrEqual(3);

    // The first header cell should be 'name' (identity column)
    const firstHeader = headerCells[0];
    expect(firstHeader?.textContent).toContain('Name');
    expect(firstHeader?.getAttribute('data-pinned')).toBe('left');
  });

  it('reports the first click from an unsorted state using descending-first intent', async () => {
    const onSortChange = vi.fn();
    await mountAdapter({ onSortChange });

    const levelHeader = document.querySelector('th[data-accessor="level"]');
    expect(levelHeader).not.toBeNull();

    await userEvent.click(levelHeader!);

    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange).toHaveBeenCalledWith({
      field: 'level',
      direction: 'desc',
    });
  });

  it('toggles direction when clicking currently sorted column', async () => {
    const onSortChange = vi.fn();
    await mountAdapter({
      sortStatus: { field: 'name', direction: 'asc' },
      onSortChange,
    });

    const nameHeader = document.querySelector('th[data-accessor="name"]');
    expect(nameHeader).not.toBeNull();

    await userEvent.click(nameHeader!);

    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange).toHaveBeenCalledWith({
      field: 'name',
      direction: 'desc',
    });
  });

  it('respects firstSortDirection="desc" when switching from another column', async () => {
    const onSortChange = vi.fn();
    // Currently sorted by name 'asc'
    await mountAdapter({
      sortStatus: { field: 'name', direction: 'asc' },
      onSortChange,
    });

    const levelHeader = document.querySelector('th[data-accessor="level"]');
    expect(levelHeader).not.toBeNull();

    await userEvent.click(levelHeader!);

    // Level has firstSortDirection: 'desc', so switching to it must report 'desc'
    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange).toHaveBeenCalledWith({
      field: 'level',
      direction: 'desc',
    });
  });

  it('defaults to "asc" when switching to a column without firstSortDirection', async () => {
    const onSortChange = vi.fn();
    // Currently sorted by level 'desc'
    await mountAdapter({
      sortStatus: { field: 'level', direction: 'desc' },
      onSortChange,
    });

    const categoryHeader = document.querySelector(
      'th[data-accessor="category"]',
    );
    expect(categoryHeader).not.toBeNull();

    await userEvent.click(categoryHeader!);

    // Category has no firstSortDirection specified, so it defaults to 'asc'
    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange).toHaveBeenCalledWith({
      field: 'category',
      direction: 'asc',
    });
  });

  it('supports custom cell render callbacks with type safety', async () => {
    const customColumns: readonly TableColumn<TestRecord>[] = [
      {
        accessor: 'name',
        title: 'Name',
        render: (record) => (
          <span data-testid={`custom-${record.id}`}>
            {record.name} (Lv.{record.level})
          </span>
        ),
      },
    ];

    await mountAdapter({
      columns: customColumns,
      records: [sampleRecords[0]!],
    });

    const customCell = document.querySelector('[data-testid="custom-rec-3"]');
    expect(customCell).not.toBeNull();
    expect(customCell?.textContent).toBe('Zebra (Lv.90)');
  });
});
