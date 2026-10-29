import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../../styles.css';
import { Table } from '@/components/Table/Table';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

describe('Table accessibility exposure', () => {
  beforeEach(async () => {
    document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
    await page.viewport(1440, 900);
  });

  async function mountTable() {
    await render(
      <MantineProvider theme={theme}>
        <Table
          ariaLabel="Sample records sorted by value 1 descending"
          records={demoRecords}
          columns={makeDemoColumns()}
          idAccessor="id"
          sortStatus={{ field: 'value1', direction: 'desc' }}
          onSortChange={vi.fn()}
        />
      </MantineProvider>,
    );
    await vi.waitFor(() => {
      if (document.querySelector('tbody tr') === null) {
        throw new Error('Table rows did not render');
      }
    });
  }

  // Accepted upstream deviation (mantine-datatable 9.4.0, issue #844): sortable headers
  // carry role="button", so Chromium exposes them as buttons, not columnheaders, and
  // there is no aria-sort. These assertions document actual behavior, not compliance.
  it('names the table and exposes sortable headers as buttons', async () => {
    await mountTable();
    await expect
      .element(
        page.getByRole('table', {
          name: 'Sample records sorted by value 1 descending',
        }),
      )
      .toBeInTheDocument();
    await expect
      .element(page.getByRole('button', { name: /^Record\b/u }))
      .toBeInTheDocument();
    await expect
      .element(page.getByRole('button', { name: /^Category\b/u }))
      .toBeInTheDocument();
    expect(page.getByRole('columnheader').elements()).toHaveLength(0);
    expect(document.querySelector('thead [aria-sort]')).toBeNull();
  });

  it('exposes unknown values and known zero', async () => {
    await mountTable();
    await expect
      .element(page.getByRole('cell', { name: 'Unknown' }).first())
      .toBeInTheDocument();
    await expect
      .element(page.getByRole('cell', { name: '0', exact: true }).first())
      .toBeInTheDocument();
  });
});
