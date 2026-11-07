import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import '@/styles.css';
import { FacetedBrowser } from '@/components/FacetedBrowser';
import type {
  BrowseState,
  FacetDefinition,
  QueryFieldDefinition,
} from '@/components/FacetedBrowser';
import { demoGroupFacetOptions } from '@/fixtures/facetOptions';
import type { DemoRecord } from '@/fixtures/records';
import { demoRecords } from '@/fixtures/records';

/**
 * States that are plain React/card presentation (no DataTable measurement, no
 * overlay mechanics): empty-result guidance and the result summary. The shared
 * browser composition suite keeps only what needs a real browser.
 */
const emptyState = {
  search: '',
  filters: {},
  page: 1,
  pageSize: 20,
  hiddenColumns: [],
} satisfies BrowseState;

const queryFields: readonly QueryFieldDefinition<DemoRecord>[] = [
  { id: 'group', accessor: 'group', sortable: false },
  { id: 'name', accessor: 'name', sortable: false },
  { id: 'region', accessor: 'region', sortable: false },
  { id: 'value1', accessor: 'value1', sortable: true },
  {
    id: 'hasImage',
    accessor: (record) => record.image !== null,
    sortable: false,
  },
];

const facets: readonly FacetDefinition<DemoRecord>[] = [
  {
    id: 'category',
    field: 'group',
    label: 'Category',
    kind: 'multi-select',
    quick: true,
    options: demoGroupFacetOptions.map(({ value, label }) => ({
      value,
      label,
    })),
  },
  {
    id: 'region',
    field: 'region',
    label: 'Region',
    kind: 'multi-select',
    quick: true,
  },
  {
    id: 'value-range',
    field: 'value1',
    label: 'Value 1',
    kind: 'range',
  },
  {
    id: 'image-availability',
    field: 'hasImage',
    label: 'Image available',
    kind: 'boolean',
  },
];

function EmptyBrowser(props: {
  readonly records: readonly DemoRecord[];
  readonly state?: BrowseState;
  readonly onStateChange?: (next: BrowseState) => void;
  readonly customEmptyState?: ReactNode;
}) {
  const browseState = props.state ?? emptyState;
  return (
    <MantineProvider>
      {props.onStateChange ? (
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={props.records}
          facets={facets}
          queryFields={queryFields}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          state={browseState}
          onStateChange={props.onStateChange}
          emptyState={props.customEmptyState}
        />
      ) : (
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={props.records}
          facets={facets}
          queryFields={queryFields}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          defaultState={browseState}
          emptyState={props.customEmptyState}
        />
      )}
    </MantineProvider>
  );
}

describe('empty result guidance', () => {
  it('explains a genuinely empty dataset without a no-op clear action', async () => {
    render(<EmptyBrowser records={[]} />);

    expect(await screen.findByText('No records available')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument();
  });

  it('offers one clear action for filters with zero matches and resets once', async () => {
    const onStateChange = vi.fn();
    render(
      <EmptyBrowser
        records={demoRecords}
        state={{
          ...emptyState,
          filters: { group: ['Alpha'] },
          search: 'no-such-record',
        }}
        onStateChange={onStateChange}
      />,
    );
    expect(await screen.findByText('No records match')).toBeVisible();
    onStateChange.mockClear();

    // The active-filter bar and the empty-state panel both offer "Clear
    // filters"; either path must emit exactly the same single reset.
    const clearActions = screen.getAllByRole('button', {
      name: 'Clear filters',
    });
    await userEvent.click(clearActions.at(-1)!);

    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: '', filters: {}, page: 1 }),
    );
  });

  it('offers a clear action for a zero-match search only', async () => {
    render(
      <EmptyBrowser
        records={demoRecords}
        state={{ ...emptyState, search: 'no-such-record' }}
      />,
    );

    expect(await screen.findByText('No records match')).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: 'Clear filters' }).length,
    ).toBeGreaterThan(0);
  });

  it('preserves a custom empty state', async () => {
    render(
      <EmptyBrowser
        records={[]}
        customEmptyState={<p>Nothing has been recorded for this build.</p>}
      />,
    );

    expect(
      await screen.findByText('Nothing has been recorded for this build.'),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument();
  });
});

describe('result summary', () => {
  const defaultState = {
    search: '',
    filters: {},
    sort: { field: 'name', direction: 'asc' },
    page: 1,
    pageSize: 20,
    hiddenColumns: [],
  } satisfies BrowseState;

  function Monsters({
    records = demoRecords,
    ...props
  }: {
    readonly records?: readonly DemoRecord[];
    readonly summaryMode?: 'page-window' | 'total';
    readonly summaryNoun?: { readonly one: string; readonly other: string };
    readonly recordNoun?: string;
  }) {
    return (
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Monsters</h1>}
          records={records}
          idAccessor="id"
          queryFields={queryFields}
          presentation="cards"
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          defaultState={defaultState}
          {...props}
        />
      </MantineProvider>
    );
  }

  it('keeps the page window by default for consumers that do not opt in', () => {
    render(<Monsters />);

    expect(screen.getAllByText('1–20 of 200 records')[0]).toBeVisible();
    expect(screen.queryByText('200 records')).not.toBeInTheDocument();
  });

  it('counts the whole result set with the short noun in total mode', () => {
    render(
      <Monsters
        summaryMode="total"
        recordNoun="MapleStory Classic World Monsters"
        summaryNoun={{ one: 'Monster', other: 'Monsters' }}
      />,
    );

    expect(screen.getAllByText('200 Monsters')[0]).toBeVisible();
    expect(
      screen.queryByText('1–20 of 200 MapleStory Classic World Monsters'),
    ).not.toBeInTheDocument();
  });

  it('uses the singular short noun when exactly one record matches', () => {
    render(
      <Monsters
        records={[demoRecords[0]!]}
        summaryMode="total"
        summaryNoun={{ one: 'Monster', other: 'Monsters' }}
      />,
    );

    expect(screen.getAllByText('1 Monster')[0]).toBeVisible();
  });

  it('falls back to the descriptive record noun when no short noun is given', () => {
    render(<Monsters records={[]} summaryMode="total" />);

    expect(screen.getAllByText('0 records')[0]).toBeVisible();
  });

  it('keeps the total in step with pages in total mode', async () => {
    render(
      <Monsters
        summaryMode="total"
        recordNoun="MapleStory Classic World Monsters"
        summaryNoun={{ one: 'Monster', other: 'Monsters' }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() =>
      expect(screen.getAllByText('200 Monsters')[0]).toBeVisible(),
    );
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

describe('responsive navigation slot', () => {
  it('renders the rail when navigation exists even with zero facets, without a Filters heading and with navigation.label aside aria-label', () => {
    const { container } = render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          facets={[]}
          navigation={{
            label: 'Item categories',
            currentLabel: 'All Items',
            render: () => (
              <nav aria-label="Item categories">
                <ul>
                  <li>Use</li>
                  <li>ETC</li>
                </ul>
              </nav>
            ),
          }}
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 20,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside).toHaveAttribute('aria-label', 'Item categories');
    expect(
      screen.getByRole('navigation', { name: 'Item categories' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Filters' }),
    ).not.toBeInTheDocument();
  });

  it('renders navigation above the Filters heading and facet list when facets exist', () => {
    const { container } = render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          queryFields={queryFields}
          facets={facets}
          navigation={{
            label: 'Item categories',
            currentLabel: 'Use',
            render: () => (
              <nav aria-label="Item categories">
                <span>Categories</span>
              </nav>
            ),
          }}
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 20,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside).toHaveAttribute('aria-label', 'Item categories');
    const nav = screen.getByRole('navigation', { name: 'Item categories' });
    const filtersHeading = screen.getByRole('heading', { name: 'Filters' });

    expect(nav).toBeVisible();
    expect(filtersHeading).toBeVisible();
    expect(
      nav.compareDocumentPosition(filtersHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders no aside when neither navigation nor facets exist', () => {
    const { container } = render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          facets={[]}
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 20,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    expect(container.querySelector('aside')).toBeNull();
  });

  it('uses Filters aria-label when facets exist without navigation', () => {
    const { container } = render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Monsters</h1>}
          records={demoRecords}
          idAccessor="id"
          queryFields={queryFields}
          facets={facets}
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 20,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside).toHaveAttribute('aria-label', 'Filters');
  });

  it('renders navigation chip and omits Filters button when facets is empty', () => {
    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          facets={[]}
          navigation={{
            label: 'Item categories',
            currentLabel: 'Recovery',
            render: () => <div>Nav Body</div>,
          }}
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 20,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    const navChip = screen.getByRole('button', {
      name: 'Item categories: Recovery. Open Item categories',
    });
    expect(navChip).toBeVisible();
    expect(navChip.textContent).toContain('Recovery');

    // Filters button should NOT exist when facets are empty
    expect(
      screen.queryByRole('button', { name: /Open all filters/i }),
    ).not.toBeInTheDocument();
  });

  it('opens separate navigation drawer on chip click and closes on onNavigate', async () => {
    let capturedOnNavigate: (() => void) | undefined;

    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          facets={[]}
          navigation={{
            label: 'Item categories',
            currentLabel: 'Recovery',
            render: ({ onNavigate }) => {
              capturedOnNavigate = onNavigate;
              return (
                <div>
                  <span>Category Content</span>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate?.();
                    }}
                  >
                    Click Category
                  </button>
                </div>
              );
            },
          }}
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 20,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    const navChip = screen.getByRole('button', {
      name: 'Item categories: Recovery. Open Item categories',
    });
    fireEvent.click(navChip);

    // Wait for the navigation drawer dialog to mount
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', {
      name: 'Close Item categories',
    });
    expect(closeBtn).toBeInTheDocument();

    // Calling onNavigate closes the drawer
    expect(capturedOnNavigate).toBeDefined();
    capturedOnNavigate?.();

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Verify filter drawer Apply/Reset buttons do not exist in this drawer
    expect(
      screen.queryByRole('button', { name: 'Reset' }),
    ).not.toBeInTheDocument();
  });

  it('keeps filter drawer untouched and distinct from navigation drawer when facets exist', async () => {
    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          queryFields={queryFields}
          facets={facets}
          navigation={{
            label: 'Item categories',
            currentLabel: 'Recovery',
            render: () => <div>Nav Drawer Body</div>,
          }}
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 20,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    // Both navigation chip and Filters button exist
    const navChip = screen.getByRole('button', {
      name: 'Item categories: Recovery. Open Item categories',
    });
    expect(navChip).toBeVisible();

    const filtersBtn = screen.getByRole('button', {
      name: /Open all filters/i,
    });
    expect(filtersBtn).toBeVisible();

    // Opening filter drawer opens filter drawer with Reset/Cancel/Apply
    fireEvent.click(filtersBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
