import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import '@/styles.css';
import { FacetedBrowser } from '@/components/FacetedBrowser';
import type { BrowseState } from '@/components/FacetedBrowser';
import type { DemoRecord } from '@/fixtures/records';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

const records = demoRecords.slice(0, 2);
const defaultState: BrowseState = {
  search: '',
  filters: {},
  sort: { field: 'value1', direction: 'desc' },
  page: 1,
  pageSize: 25,
  hiddenColumns: [],
};

function Browser({
  rows = records,
  withDetails = true,
}: {
  readonly rows?: readonly DemoRecord[];
  readonly withDetails?: boolean;
}) {
  return (
    <MantineProvider>
      <FacetedBrowser
        title={<h1>Records</h1>}
        records={rows}
        idAccessor="id"
        identityField="name"
        columns={makeDemoColumns()}
        presentation="comparison"
        renderCard={(record, { openDetails }) => (
          <>
            <a href={record.href}>{record.name}</a>
            {openDetails === undefined ? (
              <span>No details</span>
            ) : (
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={openDetails}
              >
                Details for {record.name}
              </button>
            )}
          </>
        )}
        {...(withDetails
          ? {
              rowExpansionContent: (
                record: DemoRecord,
                { surface }: { surface: 'table' | 'drawer' },
              ) => <p>{`${surface}: content for ${record.name}`}</p>,
            }
          : {})}
        defaultState={defaultState}
      />
    </MantineProvider>
  );
}

describe('FacetedBrowser record details', () => {
  it('opens one shared drawer titled with the record identity', async () => {
    const user = userEvent.setup();
    const first = records[0]!;
    const second = records[1]!;
    render(<Browser />);

    await user.click(
      screen.getByRole('button', { name: `Details for ${first.name}` }),
    );
    const drawer = await screen.findByRole('dialog', { name: first.name });
    expect(
      within(drawer).getByText(`drawer: content for ${first.name}`),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: `Close details for ${first.name}` }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole('button', { name: `Details for ${second.name}` }),
    );
    expect(
      await screen.findByRole('dialog', { name: second.name }),
    ).toBeInTheDocument();
  });

  it('closes when the selected record leaves the current page', async () => {
    const user = userEvent.setup();
    const [first, second] = records;
    if (first === undefined || second === undefined) {
      throw new Error('Fixture produced too few records.');
    }
    const { rerender } = render(<Browser />);

    await user.click(
      screen.getByRole('button', { name: `Details for ${first.name}` }),
    );
    expect(
      await screen.findByRole('dialog', { name: first.name }),
    ).toBeInTheDocument();

    rerender(<Browser rows={[second]} />);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.queryByText(`drawer: content for ${first.name}`)).toBeNull();
  });

  it('gives cards no details action without record-expansion content', () => {
    render(<Browser withDetails={false} />);

    expect(screen.getAllByText('No details')).toHaveLength(records.length);
    expect(
      screen.queryByRole('button', { name: /^Details for/u }),
    ).not.toBeInTheDocument();
  });
});
