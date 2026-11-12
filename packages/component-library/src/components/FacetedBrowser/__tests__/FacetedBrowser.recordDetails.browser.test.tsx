import { MantineProvider } from '@mantine/core';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { FacetedBrowser } from '@/components/FacetedBrowser';
import type { DemoRecord } from '@/fixtures/records';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

const records = demoRecords.slice(0, 2);

function Browser() {
  return (
    <MantineProvider>
      <FacetedBrowser
        title={<h1>Records</h1>}
        records={records}
        idAccessor="id"
        identityField="name"
        columns={makeDemoColumns()}
        presentation="comparison"
        renderCard={(record, { openDetails }) => (
          <button type="button" aria-haspopup="dialog" onClick={openDetails}>
            Details for {record.name}
          </button>
        )}
        rowExpansionTitle={(record: DemoRecord) => `Details: ${record.name}`}
        rowExpansionContent={(record, { surface }) => (
          <p>{`${surface}: content for ${record.name}`}</p>
        )}
        defaultState={{
          search: '',
          filters: {},
          sort: { field: 'value1', direction: 'desc' },
          page: 1,
          pageSize: 25,
          hiddenColumns: [],
        }}
      />
    </MantineProvider>
  );
}

describe('FacetedBrowser record details in a real browser', () => {
  it('opens one drawer from a card, returns focus on Escape, and switches records', async () => {
    const first = records[0]!;
    const second = records[1]!;
    await page.viewport(991, 800);
    await render(<Browser />);

    const firstTrigger = page.getByRole('button', {
      name: `Details for ${first.name}`,
    });
    await userEvent.click(firstTrigger);

    const firstDrawer = page.getByRole('dialog', {
      name: `Details: ${first.name}`,
    });
    await expect.element(firstDrawer).toBeVisible();
    await expect
      .element(page.getByText(`drawer: content for ${first.name}`))
      .toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect.element(firstDrawer).not.toBeInTheDocument();
    await expect.element(firstTrigger).toHaveFocus();

    await userEvent.click(
      page.getByRole('button', { name: `Details for ${second.name}` }),
    );
    const secondDrawer = page.getByRole('dialog', {
      name: `Details: ${second.name}`,
    });
    await expect.element(secondDrawer).toBeVisible();
    await expect
      .element(page.getByText(`drawer: content for ${second.name}`))
      .toBeVisible();
    await expect
      .element(page.getByText(`drawer: content for ${first.name}`))
      .not.toBeInTheDocument();

    await userEvent.click(
      page.getByRole('button', {
        name: `Close details for ${second.name}`,
      }),
    );
    await expect.element(secondDrawer).not.toBeInTheDocument();
  });
});
