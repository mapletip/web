import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { useState, type ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../../styles.css';
import { Table } from '@/components/Table/Table';
import type { TableColumn } from '@/components/Table/types';

interface DetailRecord extends Record<string, unknown> {
  id: string;
  name: string;
  value: number;
  category: string;
}

const records: readonly DetailRecord[] = [
  { id: 'one', name: 'One', value: 1, category: 'Alpha' },
  { id: 'two', name: 'Two', value: 2, category: 'Beta' },
];

const columns: readonly TableColumn<DetailRecord>[] = [
  {
    accessor: 'name',
    title: 'Name',
    width: 180,
    render: (record) => (
      <a href={`/records/${record.id}`} target="_blank" rel="noreferrer">
        {record.name}
      </a>
    ),
  },
  {
    accessor: 'value',
    title: 'Value',
    width: 120,
    numeric: true,
  },
  { accessor: 'category', title: 'Category', width: 140 },
];

beforeEach(async () => {
  localStorage.clear();
  document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  await page.viewport(1024, 768);
});

function ControlledExpandableTable(): ReactElement {
  const [expandedRowIds, setExpandedRowIds] = useState<readonly unknown[]>([]);

  return (
    <Table<DetailRecord>
      ariaLabel="Expandable records"
      records={records}
      columns={columns}
      idAccessor="id"
      rowExpansionContent={(record) => (
        <div data-testid={`details-${record.id}`}>
          <a href={`/details/${record.id}`} target="_blank" rel="noreferrer">
            Details for {record.name}
          </a>
        </div>
      )}
      expandedRowIds={expandedRowIds}
      onExpandedRowIdsChange={setExpandedRowIds}
    />
  );
}

describe('Table DataTable mechanics', () => {
  it('keeps the header sticky inside a bounded DataTable scroll region', async () => {
    const tallRecords = Array.from({ length: 30 }, (_, index) => ({
      ...records[index % records.length]!,
      id: `row-${index}`,
    }));

    await render(
      <MantineProvider theme={theme}>
        <Table<DetailRecord>
          ariaLabel="Scrollable records"
          records={tallRecords}
          columns={columns}
          idAccessor="id"
          maxHeight={180}
        />
      </MantineProvider>,
    );

    const viewport = document.querySelector<HTMLElement>(
      '[data-scrollarea-viewport="true"]',
    )!;
    const header = document.querySelector<HTMLElement>(
      '.mantine-datatable thead',
    )!;
    expect(getComputedStyle(header).position).toBe('sticky');
    viewport.scrollTop = 240;
    await vi.waitFor(() => {
      expect(
        Math.abs(
          header.getBoundingClientRect().top -
            viewport.getBoundingClientRect().top,
        ),
      ).toBeLessThanOrEqual(1);
    });
  });

  it('exposes upstream resize handles and persists widths under a namespaced key', async () => {
    await render(
      <MantineProvider theme={theme}>
        <Table<DetailRecord>
          ariaLabel="Resizable records"
          records={records}
          columns={columns}
          idAccessor="id"
          resizable
          storeColumnsKey="mapletip:test:resizable-records"
        />
      </MantineProvider>,
    );

    const header = document.querySelector<HTMLElement>(
      'thead th[data-accessor="name"]',
    )!;
    const handle = header.querySelector<HTMLElement>(
      '.mantine-datatable-header-resizable-handle',
    );
    expect(handle).not.toBeNull();
    expect(header.className).toContain(
      'mantine-datatable-header-cell-resizable',
    );
    expect(
      localStorage.getItem('mapletip:test:resizable-records-columns-width'),
    ).not.toBeNull();

    const initialWidth = header.getBoundingClientRect().width;
    handle!.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        clientX: header.getBoundingClientRect().right,
      }),
    );
    document.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: header.getBoundingClientRect().right + 48,
      }),
    );
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    await vi.waitFor(
      () => {
        expect(header.getBoundingClientRect().width).toBeGreaterThan(
          initialWidth,
        );
      },
      { timeout: 5_000 },
    );

    const resizedHandle = header.querySelector<HTMLElement>(
      '.mantine-datatable-header-resizable-handle',
    )!;
    resizedHandle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await vi.waitFor(
      () => {
        expect(
          localStorage.getItem('mapletip:test:resizable-records-columns-width'),
        ).toContain('auto');
      },
      { timeout: 5_000 },
    );
  });

  it('uses one bounded derived bucket across remounts when no key is supplied', async () => {
    localStorage.setItem('', JSON.stringify([{ accessor: 'poisoned' }]));

    for (let mount = 0; mount < 3; mount += 1) {
      const view = await render(
        <MantineProvider theme={theme}>
          <Table<DetailRecord>
            ariaLabel={`Derived key records ${mount}`}
            records={records}
            columns={columns}
            idAccessor="id"
            resizable
          />
        </MantineProvider>,
      );
      await vi.waitFor(() => {
        expect(document.querySelectorAll('thead th')).toHaveLength(
          columns.length,
        );
      });
      expect(document.querySelectorAll('tbody tr')).toHaveLength(
        records.length,
      );
      expect(document.body.textContent).toContain('One');
      await view.unmount();
    }

    const widthKeys = Object.keys(localStorage).filter(
      (key) =>
        key.startsWith('mapletip:component-library:datatable:v1:') &&
        key.endsWith('-columns-width'),
    );
    expect(widthKeys).toHaveLength(1);
    expect(localStorage.getItem('')).toContain('poisoned');
  });

  it('shares one derived bucket for identical tables and separates different shapes', async () => {
    localStorage.clear();
    const otherColumns: readonly TableColumn<DetailRecord>[] = [
      { accessor: 'name', title: 'Name' },
      { accessor: 'value', title: 'Value', numeric: true },
    ];
    await render(
      <MantineProvider theme={theme}>
        <Table<DetailRecord>
          ariaLabel="First derived records"
          records={records}
          columns={columns}
          idAccessor="id"
          resizable
        />
        <Table<DetailRecord>
          ariaLabel="Second derived records"
          records={records}
          columns={columns}
          idAccessor="id"
          resizable
        />
        <Table<DetailRecord>
          ariaLabel="Other shaped records"
          records={records}
          columns={otherColumns}
          idAccessor="id"
          resizable
        />
      </MantineProvider>,
    );

    await vi.waitFor(() => {
      const keys = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith('mapletip:component-library:datatable:v1:') &&
          key.endsWith('-columns-width'),
      );
      expect(keys).toHaveLength(2);
      expect(new Set(keys).size).toBe(2);
    });
  });

  it('renders rows under an explicit key with a poisoned empty-string bucket', async () => {
    localStorage.setItem('', '[]');
    try {
      await render(
        <MantineProvider theme={theme}>
          <Table<DetailRecord>
            ariaLabel="Scoped persistence, poisoned storage"
            records={records}
            columns={columns}
            idAccessor="id"
            resizable
            storeColumnsKey="mapletip:test:poisoned-scope"
          />
        </MantineProvider>,
      );
      await vi.waitFor(() => {
        expect(document.querySelectorAll('thead th')).toHaveLength(
          columns.length,
        );
      });
      expect(document.querySelectorAll('tbody tr')).toHaveLength(
        records.length,
      );
      expect(localStorage.getItem('')).toContain('[]');
    } finally {
      localStorage.removeItem('');
      localStorage.removeItem('mapletip:test:poisoned-scope-columns-width');
      localStorage.removeItem('mapletip:test:poisoned-scope-columns-order');
      localStorage.removeItem('mapletip:test:poisoned-scope-columns-toggle');
      localStorage.removeItem('mapletip:test:poisoned-scope-columns-pinning');
    }
  });

  it('rejects an empty persistence key instead of using DataTable issue #845 key collisions', async () => {
    await expect(
      render(
        <MantineProvider theme={theme}>
          <Table<DetailRecord>
            ariaLabel="Invalid key"
            records={records}
            columns={columns}
            idAccessor="id"
            resizable
            storeColumnsKey="   "
          />
        </MantineProvider>,
      ),
    ).rejects.toThrow('storeColumnsKey');
  });

  it('controls expansion through DataTable and keeps detail links ordinary', async () => {
    await render(
      <MantineProvider theme={theme}>
        <ControlledExpandableTable />
      </MantineProvider>,
    );

    const expandButton = page.getByRole('button', {
      name: 'Expand details for One',
    });
    await expandButton.click();

    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-testid="details-one"]'),
      ).not.toBeNull(),
    );
    expect(
      document.querySelector('.mantine-datatable-row-expansion-cell'),
    ).not.toBeNull();

    const detailLink = document.querySelector<HTMLAnchorElement>(
      '[data-testid="details-one"] a',
    )!;
    const detailClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });
    detailLink.dispatchEvent(detailClick);
    expect(detailClick.defaultPrevented).toBe(false);

    await page
      .getByRole('button', { name: 'Collapse details for One' })
      .click();
    await vi.waitFor(() =>
      expect(document.querySelector('[data-testid="details-one"]')).toBeNull(),
    );
  });

  it('scopes expansion control ids to each table instance', async () => {
    const markup = (
      <MantineProvider theme={theme}>
        <Table<DetailRecord>
          ariaLabel="First records"
          records={records}
          columns={columns}
          idAccessor="id"
          rowExpansionContent={(record) => (
            <div data-testid={`first-details-${record.id}`}>
              First details for {record.name}
            </div>
          )}
        />
        <Table<DetailRecord>
          ariaLabel="Second records"
          records={records}
          columns={columns}
          idAccessor="id"
          rowExpansionContent={(record) => (
            <div data-testid={`second-details-${record.id}`}>
              Second details for {record.name}
            </div>
          )}
        />
      </MantineProvider>
    );
    await render(markup);

    const controls = page
      .getByRole('button', { name: 'Expand details for One' })
      .all()
      .map((button) => button.element().getAttribute('aria-controls'));
    expect(controls).toHaveLength(2);
    expect(new Set(controls).size).toBe(2);

    await page
      .getByRole('button', { name: 'Expand details for One' })
      .first()
      .click();
    await page
      .getByRole('button', { name: 'Expand details for One' })
      .first()
      .click();
    await vi.waitFor(() => {
      expect(
        document.querySelector('[data-testid="first-details-one"]'),
      ).not.toBeNull();
      expect(
        document.querySelector('[data-testid="second-details-one"]'),
      ).not.toBeNull();
    });

    for (const control of controls) {
      expect(control).not.toBeNull();
      expect(document.getElementById(control!)).not.toBeNull();
    }
    expect(
      document.querySelector('[data-testid="first-details-one"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="second-details-one"]'),
    ).not.toBeNull();
  });

  it('expands and collapses from the keyboard expansion control', async () => {
    await render(
      <MantineProvider theme={theme}>
        <ControlledExpandableTable />
      </MantineProvider>,
    );

    const expandButton = page.getByRole('button', {
      name: 'Expand details for One',
    });
    expandButton.element().focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-testid="details-one"]'),
      ).not.toBeNull(),
    );
    expect(
      page
        .getByRole('button', { name: 'Collapse details for One' })
        .element()
        .getAttribute('aria-expanded'),
    ).toBe('true');

    await userEvent.keyboard(' ');
    await vi.waitFor(() =>
      expect(document.querySelector('[data-testid="details-one"]')).toBeNull(),
    );
  });

  it('does not expand when activating an ordinary link inside a row', async () => {
    await render(
      <MantineProvider theme={theme}>
        <ControlledExpandableTable />
      </MantineProvider>,
    );

    const link = document.querySelector<HTMLAnchorElement>(
      'tbody tr:first-child td:first-child a',
    )!;
    const click = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });
    link.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
    expect(
      document.querySelector('.mantine-datatable-row-expansion-cell'),
    ).toBeNull();
  });
});
