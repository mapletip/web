import { MantineProvider } from '@mantine/core';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { FacetedBrowser } from '@/components/FacetedBrowser/FacetedBrowser';

const { evaluateDraft } = vi.hoisted(() => ({
  evaluateDraft: vi.fn(() => ({
    matchingCount: 0,
    matchingRecords: [],
    getFacetValues: () => new Map<string, number>(),
  })),
}));

vi.mock('@/components/FacetedBrowser/hooks/useFacetedBrowser', () => ({
  useFacetedBrowser: () => ({
    table: {},
    records: [],
    rows: [],
    allFilteredRecords: [],
    totalMatchingCount: 0,
    totalRecordCount: 0,
    page: 1,
    pageCount: 1,
    pageSize: 20,
    pageStart: 0,
    pageEnd: 0,
    sort: undefined,
    setSort: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    setSearch: vi.fn(),
    filters: {},
    setFilter: vi.fn(),
    setFilters: vi.fn(),
    resetFilters: vi.fn(),
    visibleColumns: [],
    columnVisibility: {},
    setColumnVisibility: vi.fn(),
    getFacetCount: vi.fn(() => 0),
    getFacetValues: vi.fn(() => new Map<string, number>()),
    evaluateDraft,
    tableProps: {
      records: [],
      columns: [],
      idAccessor: 'id',
      onSortChange: vi.fn(),
    },
  }),
}));

function PendingHarness({
  drawerOpened,
  title = 'Records',
}: {
  readonly drawerOpened: boolean;
  readonly title?: string;
}) {
  return (
    <MantineProvider>
      <FacetedBrowser
        title={<h1>{title}</h1>}
        records={[]}
        idAccessor="id"
        presentation="cards"
        renderCard={() => null}
        facets={[]}
        drawerOpened={drawerOpened}
        onDrawerOpenedChange={() => undefined}
        defaultState={{
          search: '',
          filters: {},
          page: 1,
          pageSize: 20,
          hiddenColumns: [],
        }}
      />
    </MantineProvider>
  );
}

describe('FacetedBrowser pending draft evaluation', () => {
  it('does not evaluate while closed and reuses the evaluation while open', async () => {
    const browser = await render(<PendingHarness drawerOpened={false} />);
    expect(evaluateDraft).not.toHaveBeenCalled();

    await browser.rerender(<PendingHarness drawerOpened />);
    await vi.waitFor(() => expect(evaluateDraft).toHaveBeenCalled());
    const callsAfterOpen = evaluateDraft.mock.calls.length;

    await browser.rerender(
      <PendingHarness drawerOpened title="Still records" />,
    );
    expect(evaluateDraft).toHaveBeenCalledTimes(callsAfterOpen);
  });
});
