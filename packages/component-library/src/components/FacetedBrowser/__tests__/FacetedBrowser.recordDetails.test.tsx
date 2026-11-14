import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

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
  loading = false,
}: {
  readonly rows?: readonly DemoRecord[];
  readonly withDetails?: boolean;
  readonly loading?: boolean;
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
        loading={loading}
        renderCard={(record, { openDetails, isDetailsOpen }) => (
          <>
            <a href={record.href}>{record.name}</a>
            {openDetails === undefined ? (
              <span>No details</span>
            ) : (
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isDetailsOpen}
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

function ControlledBrowser({
  rows = records,
  onSelectedIdChange,
}: {
  readonly rows?: readonly DemoRecord[];
  readonly onSelectedIdChange?: (
    selectedId: string | null,
    reason: 'open' | 'dismiss' | 'invalidate',
  ) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <MantineProvider>
      <FacetedBrowser
        title={<h1>Records</h1>}
        records={rows}
        idAccessor="id"
        identityField="name"
        columns={makeDemoColumns()}
        presentation="comparison"
        renderCard={(record, { openDetails, isDetailsOpen }) => (
          <button
            type="button"
            aria-expanded={isDetailsOpen}
            onClick={openDetails}
          >
            Details for {record.name}
          </button>
        )}
        rowExpansionContent={(record) => <p>content for {record.name}</p>}
        recordDetails={{
          selectedId,
          onSelectedIdChange: (nextId, reason) => {
            onSelectedIdChange?.(nextId, reason);
            setSelectedId(nextId);
          },
        }}
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
    const firstTrigger = screen.getByRole('button', {
      name: `Details for ${first.name}`,
    });
    const secondTrigger = screen.getByRole('button', {
      name: `Details for ${second.name}`,
    });

    await user.click(firstTrigger);
    const drawer = await screen.findByRole('dialog', { name: first.name });
    expect(
      within(drawer).getByText(`drawer: content for ${first.name}`),
    ).toBeInTheDocument();
    expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(secondTrigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(
      screen.getByRole('button', { name: `Close details for ${first.name}` }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(secondTrigger);
    expect(
      await screen.findByRole('dialog', { name: second.name }),
    ).toBeInTheDocument();
    expect(secondTrigger).toHaveAttribute('aria-expanded', 'true');
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

    // Restoring the record must not restore the old selection.
    rerender(<Browser />);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: `Details for ${first.name}` }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('invalidates the selection while results are loading', async () => {
    const user = userEvent.setup();
    const first = records[0]!;
    const { rerender } = render(<Browser />);

    await user.click(
      screen.getByRole('button', { name: `Details for ${first.name}` }),
    );
    expect(
      await screen.findByRole('dialog', { name: first.name }),
    ).toBeInTheDocument();

    rerender(<Browser loading />);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    rerender(<Browser />);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('supports host-controlled selection and reports dismissal once', async () => {
    const user = userEvent.setup();
    const first = records[0]!;
    const onSelectedIdChange = vi.fn();
    render(<ControlledBrowser onSelectedIdChange={onSelectedIdChange} />);

    const trigger = screen.getByRole('button', {
      name: `Details for ${first.name}`,
    });
    await user.click(trigger);
    expect(onSelectedIdChange).toHaveBeenCalledWith(first.id, 'open');
    expect(
      await screen.findByRole('dialog', { name: first.name }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: `Close details for ${first.name}` }),
    );
    expect(onSelectedIdChange).toHaveBeenLastCalledWith(null, 'dismiss');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      onSelectedIdChange.mock.calls.filter(
        ([, reason]) => reason === 'dismiss',
      ),
    ).toHaveLength(1);
  });

  it('closes a host-cleared selection without echoing and reports invalidation', async () => {
    const first = records[0]!;
    const second = records[1]!;
    const onSelectedIdChange = vi.fn();
    const { rerender } = render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={records}
          idAccessor="id"
          identityField="name"
          columns={makeDemoColumns()}
          presentation="comparison"
          renderCard={(record) => <span>{record.name}</span>}
          rowExpansionContent={(record) => <p>content for {record.name}</p>}
          recordDetails={{
            selectedId: first.id,
            onSelectedIdChange,
          }}
          defaultState={defaultState}
        />
      </MantineProvider>,
    );

    expect(
      await screen.findByRole('dialog', { name: first.name }),
    ).toBeInTheDocument();

    rerender(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={records}
          idAccessor="id"
          identityField="name"
          columns={makeDemoColumns()}
          presentation="comparison"
          renderCard={(record) => <span>{record.name}</span>}
          rowExpansionContent={(record) => <p>content for {record.name}</p>}
          recordDetails={{ selectedId: null, onSelectedIdChange }}
          defaultState={defaultState}
        />
      </MantineProvider>,
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(onSelectedIdChange).not.toHaveBeenCalled();

    rerender(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={records}
          idAccessor="id"
          identityField="name"
          columns={makeDemoColumns()}
          presentation="comparison"
          renderCard={(record) => <span>{record.name}</span>}
          rowExpansionContent={(record) => <p>content for {record.name}</p>}
          recordDetails={{ selectedId: first.id, onSelectedIdChange }}
          defaultState={defaultState}
        />
      </MantineProvider>,
    );
    expect(
      await screen.findByRole('dialog', { name: first.name }),
    ).toBeInTheDocument();

    rerender(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={[second]}
          idAccessor="id"
          identityField="name"
          columns={makeDemoColumns()}
          presentation="comparison"
          renderCard={(record) => <span>{record.name}</span>}
          rowExpansionContent={(record) => <p>content for {record.name}</p>}
          recordDetails={{ selectedId: first.id, onSelectedIdChange }}
          defaultState={defaultState}
        />
      </MantineProvider>,
    );
    await waitFor(() =>
      expect(onSelectedIdChange).toHaveBeenCalledWith(null, 'invalidate'),
    );
    expect(
      onSelectedIdChange.mock.calls.filter(
        ([, reason]) => reason === 'invalidate',
      ),
    ).toHaveLength(1);
  });

  it('gives cards no details action without record-expansion content', () => {
    render(<Browser withDetails={false} />);

    expect(screen.getAllByText('No details')).toHaveLength(records.length);
    expect(
      screen.queryByRole('button', { name: /^Details for/u }),
    ).not.toBeInTheDocument();
  });
});
