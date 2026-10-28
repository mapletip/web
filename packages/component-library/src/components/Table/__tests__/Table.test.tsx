import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../../styles.css';
import { Table } from '@/components/Table/Table';
import type { TableColumn } from '@/components/Table/types';
import {
  demoRecords,
  makeDemoColumns,
  type DemoRecord,
} from '@/fixtures/records';
import { theme } from '@/theme';

beforeEach(async () => {
  document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  await page.viewport(1024, 768);
});

const nameColumns: TableColumn<DemoRecord>[] = [
  { accessor: 'name', title: 'Record' },
  { accessor: 'group', title: 'Group' },
];

describe('Table (Mantine DataTable)', () => {
  it('renders through Mantine DataTable with caller rows, columns and an accessible name', async () => {
    await render(
      <MantineProvider theme={theme}>
        <Table
          ariaLabel="Visible records"
          records={demoRecords.slice(0, 2)}
          columns={nameColumns}
          idAccessor="id"
        />
      </MantineProvider>,
    );
    expect(document.querySelector('.mantine-datatable')).not.toBeNull();
    expect(
      page.getByRole('table', { name: 'Visible records' }).element(),
    ).not.toBeNull();
    expect(document.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(document.querySelector('tbody tr td')?.textContent).toBe(
      demoRecords[0]?.name,
    );
  });

  it('activates sortable headers with Enter and leaves row ordering to the host', async () => {
    // Known upstream limitation (#844): sortable headers are role="button" and respond to
    // Enter but not Space.
    const onSortChange = vi.fn();
    await render(
      <MantineProvider theme={theme}>
        <Table
          ariaLabel="Sortable"
          records={demoRecords.slice(0, 3)}
          columns={makeDemoColumns()}
          idAccessor="id"
          sortStatus={{ field: 'value1', direction: 'desc' }}
          onSortChange={onSortChange}
        />
      </MantineProvider>,
    );
    const before = [...document.querySelectorAll('tbody tr')].map(
      (row) => row.textContent,
    );
    const header = document.querySelector<HTMLElement>(
      'th[data-accessor="group"]',
    )!;
    header.focus();
    await userEvent.keyboard('{Enter}');
    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange.mock.calls[0]?.[0]).toMatchObject({ field: 'group' });
    expect(
      [...document.querySelectorAll('tbody tr')].map((row) => row.textContent),
    ).toEqual(before);
  });

  it('records the upstream Space-key limitation without patching DataTable', async () => {
    const onSortChange = vi.fn();
    await render(
      <MantineProvider theme={theme}>
        <Table
          ariaLabel="Space limitation"
          records={demoRecords.slice(0, 3)}
          columns={makeDemoColumns()}
          idAccessor="id"
          sortStatus={{ field: 'value1', direction: 'desc' }}
          onSortChange={onSortChange}
        />
      </MantineProvider>,
    );
    const header = document.querySelector<HTMLElement>(
      'th[data-accessor="group"]',
    )!;
    header.focus();
    await userEvent.keyboard(' ');
    expect(onSortChange).not.toHaveBeenCalled();
  });

  it('visually marks the sorted column', async () => {
    await render(
      <MantineProvider theme={theme}>
        <Table
          ariaLabel="Sorted"
          records={demoRecords.slice(0, 2)}
          columns={makeDemoColumns()}
          idAccessor="id"
          sortStatus={{ field: 'group', direction: 'asc' }}
          onSortChange={() => undefined}
        />
      </MantineProvider>,
    );
    const cells = [...document.querySelectorAll('tbody tr:first-child td')];
    expect(
      cells.filter((cell) => cell.className.includes('sortedCell')),
    ).toHaveLength(1);
  });

  it('renders the default and a custom empty state without stale rows', async () => {
    const { unmount } = await render(
      <MantineProvider theme={theme}>
        <Table
          ariaLabel="Empty"
          records={[]}
          columns={nameColumns}
          idAccessor="id"
          noRecordsText="Nothing here"
        />
      </MantineProvider>,
    );
    expect(
      document.querySelector('.mantine-datatable-empty-state'),
    ).not.toBeNull();
    expect(document.body.textContent).toContain('Nothing here');
    expect(
      document.querySelectorAll('tbody tr td[data-accessor]'),
    ).toHaveLength(0);
    await unmount();

    await render(
      <MantineProvider theme={theme}>
        <Table
          ariaLabel="Empty custom"
          records={[]}
          columns={nameColumns}
          idAccessor="id"
          emptyState={<p>Custom empty</p>}
        />
      </MantineProvider>,
    );
    expect(document.body.textContent).toContain('Custom empty');
  });

  it('forwards row clicks with the record', async () => {
    const onRowClick = vi.fn();
    await render(
      <MantineProvider theme={theme}>
        <Table
          ariaLabel="Clickable"
          records={demoRecords.slice(0, 2)}
          columns={nameColumns}
          idAccessor="id"
          onRowClick={onRowClick}
          rowClassName="custom-row"
        />
      </MantineProvider>,
    );
    const row = document.querySelector('tbody tr')!;
    expect(row.className).toContain('custom-row');
    await userEvent.click(row);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick.mock.calls[0]?.[0]).toMatchObject({
      record: demoRecords[0],
    });
  });

  it('shows loading feedback while keeping the rows and layout', async () => {
    await render(
      <MantineProvider theme={theme}>
        <Table
          ariaLabel="Fetching"
          records={demoRecords.slice(0, 2)}
          columns={nameColumns}
          idAccessor="id"
          fetching
        />
      </MantineProvider>,
    );
    expect(
      document.querySelector('.mantine-datatable-loader-fetching'),
    ).not.toBeNull();
    expect(document.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('applies column alignment and wrapping through DataTable column props', async () => {
    const columns: TableColumn<DemoRecord>[] = [
      {
        accessor: 'name',
        title: 'Centered',
        textAlign: 'center',
        nowrap: true,
      },
      { accessor: 'group', title: 'Right', textAlign: 'right', ellipsis: true },
    ];
    await render(
      <MantineProvider theme={theme}>
        <Table
          ariaLabel="Styled columns"
          records={demoRecords.slice(0, 1)}
          columns={columns}
          idAccessor="id"
        />
      </MantineProvider>,
    );
    const first = document.querySelector('tbody tr td:nth-child(1)')!;
    expect(getComputedStyle(first).textAlign).toBe('center');
    const second = document.querySelector('tbody tr td:nth-child(2)')!;
    expect(getComputedStyle(second).textAlign).toBe('right');
    expect(getComputedStyle(second).textOverflow).toBe('ellipsis');
  });
});
