import { MantineProvider } from '@mantine/core';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import '@/styles.css';
import { FacetedBrowser } from '@/components/FacetedBrowser';
import type {
  BrowseSortOption,
  BrowseState,
  FacetDefinition,
  QueryFieldDefinition,
} from '@/components/FacetedBrowser';
import { demoGroupFacetOptions } from '@/fixtures/facetOptions';
import type { DemoRecord } from '@/fixtures/records';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

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

describe('sort options control', () => {
  const sortOptions: readonly BrowseSortOption[] = [
    { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
    { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
    { label: 'Value (Highest)', field: 'value1', direction: 'desc' },
  ];

  const sortableFields: readonly QueryFieldDefinition<DemoRecord>[] = [
    { id: 'name', accessor: 'name', sortable: true },
    { id: 'value1', accessor: 'value1', sortable: true },
  ];

  it('renders a Mantine Select alongside page size in non-comparison (cards) mode', async () => {
    const onStateChange = vi.fn();
    const state: BrowseState = {
      search: '',
      filters: {},
      sort: { field: 'name', direction: 'asc' },
      page: 2,
      pageSize: 20,
      hiddenColumns: [],
    };

    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          queryFields={sortableFields}
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          sortOptions={sortOptions}
          state={state}
          onStateChange={onStateChange}
        />
      </MantineProvider>,
    );

    const sortSelect = screen.getByRole('combobox', { name: 'Sort records' });
    expect(sortSelect).toBeVisible();
    expect(sortSelect).toHaveValue('Name (A–Z)');

    // Page size select is also rendered alongside
    expect(
      screen.getByRole('combobox', { name: 'records per page' }),
    ).toBeVisible();

    // Changing sort triggers canonical transition: explicit direction, page resets to 1
    await userEvent.click(sortSelect);
    const descOption = await screen.findByRole('option', {
      name: 'Name (Z–A)',
      hidden: true,
    });
    fireEvent.click(descOption);

    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: { field: 'name', direction: 'desc' },
        page: 1, // page reset
      }),
    );
  });

  it('renders a Mantine Select alongside page size in comparison mode', () => {
    const onStateChange = vi.fn();
    const state: BrowseState = {
      search: '',
      filters: {},
      sort: { field: 'name', direction: 'asc' },
      page: 1,
      pageSize: 20,
      hiddenColumns: [],
    };

    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          identityField="name"
          columns={makeDemoColumns()}
          presentation="comparison"
          renderCard={(record) => <div>{record.name}</div>}
          recordNoun="monsters"
          sortOptions={sortOptions}
          state={state}
          onStateChange={onStateChange}
        />
      </MantineProvider>,
    );

    const sortSelect = screen.getByRole('combobox', { name: 'Sort monsters' });
    expect(sortSelect).toBeVisible();
    expect(
      screen.getByRole('combobox', { name: 'monsters per page' }),
    ).toBeVisible();
  });

  it('omitting sortOptions renders only page size select without a sort select', () => {
    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
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

    expect(
      screen.queryByRole('combobox', { name: 'Sort records' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'records per page' }),
    ).toBeVisible();
  });

  it('renders Filters button when sortOptions is present with zero facets, and omits it with neither', () => {
    const { unmount } = render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          sortOptions={sortOptions}
          facets={[]}
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

    expect(screen.getByRole('button', { name: /Filters/i })).toBeVisible();

    unmount();

    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          facets={[]}
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

    expect(
      screen.queryByRole('button', { name: /Filters/i }),
    ).not.toBeInTheDocument();
  });

  it('renders Sort section in drawer only with sortOptions, and with zero facets drawer contains only Sort', () => {
    const onDrawerOpenedChange = vi.fn();
    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          sortOptions={sortOptions}
          facets={[]}
          drawerOpened={true}
          onDrawerOpenedChange={onDrawerOpenedChange}
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

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    const drawerSort = within(dialog).getByRole('combobox', { name: 'Sort' });
    expect(drawerSort).toBeVisible();
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('stages sort change in the drawer: Cancel leaves sort unchanged, Apply commits it via onStateChange', async () => {
    const onStateChange = vi.fn();
    const onDrawerOpenedChange = vi.fn();
    const state: BrowseState = {
      search: '',
      filters: {},
      sort: { field: 'name', direction: 'asc' },
      page: 2,
      pageSize: 20,
      hiddenColumns: [],
    };

    const { rerender } = render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          queryFields={sortableFields}
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          sortOptions={sortOptions}
          state={state}
          onStateChange={onStateChange}
          drawerOpened={true}
          onDrawerOpenedChange={onDrawerOpenedChange}
        />
      </MantineProvider>,
    );

    const dialog = screen.getByRole('dialog');
    const drawerSort = within(dialog).getByRole('combobox', { name: 'Sort' });
    expect(drawerSort).toHaveValue('Name (A–Z)');

    await userEvent.click(drawerSort);
    const listboxId = drawerSort.getAttribute('aria-controls')!;
    const drawerListbox = document.getElementById(listboxId)!;
    const descOption = within(drawerListbox).getByRole('option', {
      name: 'Name (Z–A)',
      hidden: true,
    });
    fireEvent.click(descOption);

    const cancelButton = within(dialog).getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);
    expect(onStateChange).not.toHaveBeenCalled();
    expect(onDrawerOpenedChange).toHaveBeenCalledWith(false);

    rerender(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Items</h1>}
          records={demoRecords}
          idAccessor="id"
          queryFields={sortableFields}
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          sortOptions={sortOptions}
          state={state}
          onStateChange={onStateChange}
          drawerOpened={true}
          onDrawerOpenedChange={onDrawerOpenedChange}
        />
      </MantineProvider>,
    );

    const reopenedDialog = screen.getByRole('dialog');
    const reopenedSort = within(reopenedDialog).getByRole('combobox', {
      name: 'Sort',
    });
    expect(reopenedSort).toHaveValue('Name (A–Z)');

    await userEvent.click(reopenedSort);
    const reopenedListboxId = reopenedSort.getAttribute('aria-controls')!;
    const reopenedListbox = document.getElementById(reopenedListboxId)!;
    const descOption2 = within(reopenedListbox).getByRole('option', {
      name: 'Name (Z–A)',
      hidden: true,
    });
    fireEvent.click(descOption2);

    const applyButton = within(reopenedDialog).getByRole('button', {
      name: /Show/i,
    });
    await userEvent.click(applyButton);

    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: { field: 'name', direction: 'desc' },
        page: 1,
      }),
    );
  });
});

describe('responsive navigation slot', () => {
  const genericNavigation = {
    label: 'Categories',
    rootLabel: 'All Products',
    categoryLabel: 'Clothing',
    subCategoryLabel: 'Shirts',
    items: ['Clothing', 'Electronics'],
    currentId: 'clothing',
    apply: vi.fn(),
  };

  it('renders the rail when navigation exists even with zero facets, without a Filters heading and with navigation.label aside aria-label', () => {
    const { container } = render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Catalog</h1>}
          records={demoRecords}
          idAccessor="id"
          facets={[]}
          navigation={{
            label: genericNavigation.label,
            currentLabel: genericNavigation.rootLabel,
            currentId: genericNavigation.currentId,
            apply: genericNavigation.apply,
            render: () => (
              <nav aria-label={genericNavigation.label}>
                <ul>
                  {genericNavigation.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
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
    expect(aside).toHaveAttribute('aria-label', genericNavigation.label);
    expect(
      screen.getByRole('navigation', { name: genericNavigation.label }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Filters' }),
    ).not.toBeInTheDocument();
  });

  it('renders navigation above the Filters heading and facet list when facets exist', () => {
    const { container } = render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Catalog</h1>}
          records={demoRecords}
          idAccessor="id"
          queryFields={queryFields}
          facets={facets}
          navigation={{
            label: genericNavigation.label,
            currentLabel: genericNavigation.categoryLabel,
            currentId: genericNavigation.currentId,
            apply: genericNavigation.apply,
            render: () => (
              <nav aria-label={genericNavigation.label}>
                <span>{genericNavigation.label}</span>
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
    expect(aside).toHaveAttribute('aria-label', genericNavigation.label);
    const nav = screen.getByRole('navigation', {
      name: genericNavigation.label,
    });
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
          title={<h1>Catalog</h1>}
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
          title={<h1>Catalog</h1>}
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
          title={<h1>Catalog</h1>}
          records={demoRecords}
          idAccessor="id"
          facets={[]}
          navigation={{
            label: genericNavigation.label,
            currentLabel: genericNavigation.subCategoryLabel,
            currentId: genericNavigation.currentId,
            apply: genericNavigation.apply,
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
      name: `${genericNavigation.label}: ${genericNavigation.subCategoryLabel}. Open ${genericNavigation.label}`,
    });
    expect(navChip).toBeVisible();
    expect(navChip.textContent).toContain(genericNavigation.subCategoryLabel);

    // Filters button should NOT exist when facets are empty
    expect(
      screen.queryByRole('button', { name: /Open all filters/i }),
    ).not.toBeInTheDocument();
  });

  it('renders navigation chip with decorative currentIcon when given, keeping accessible name unchanged', () => {
    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Catalog</h1>}
          records={demoRecords}
          idAccessor="id"
          facets={[]}
          navigation={{
            label: genericNavigation.label,
            currentLabel: genericNavigation.subCategoryLabel,
            currentId: genericNavigation.currentId,
            apply: genericNavigation.apply,
            currentIcon: <span data-testid="chip-icon">custom-icon</span>,
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
      name: `${genericNavigation.label}: ${genericNavigation.subCategoryLabel}. Open ${genericNavigation.label}`,
    });
    expect(navChip).toBeVisible();
    expect(navChip.textContent).toContain(genericNavigation.subCategoryLabel);

    const iconWrapper = navChip.querySelector('[class*="icon"]');
    expect(iconWrapper).toBeInTheDocument();
    expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('chip-icon')).toBeInTheDocument();
  });

  it('renders navigation chip without icon when currentIcon is omitted', () => {
    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Catalog</h1>}
          records={demoRecords}
          idAccessor="id"
          facets={[]}
          navigation={{
            label: genericNavigation.label,
            currentLabel: genericNavigation.subCategoryLabel,
            currentId: genericNavigation.currentId,
            apply: genericNavigation.apply,
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
      name: `${genericNavigation.label}: ${genericNavigation.subCategoryLabel}. Open ${genericNavigation.label}`,
    });
    expect(navChip).toBeVisible();
    expect(navChip.querySelector('[class*="icon"]')).toBeNull();
  });

  it('renders Filters button when facets are present but none are quick', () => {
    const nonQuickFacets = facets.map((f) => ({ ...f, quick: false }));
    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Catalog</h1>}
          records={demoRecords}
          idAccessor="id"
          queryFields={queryFields}
          facets={nonQuickFacets}
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

    expect(
      screen.getByRole('button', { name: /Open all filters/i }),
    ).toBeVisible();
  });

  it('opens separate navigation drawer on chip click and closes on cancel', async () => {
    const apply = vi.fn();

    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Catalog</h1>}
          records={demoRecords}
          idAccessor="id"
          facets={[]}
          navigation={{
            label: genericNavigation.label,
            currentLabel: genericNavigation.subCategoryLabel,
            currentId: 'clothing',
            apply,
            render: (context) => (
              <div>
                <span>Category Content</span>
                {context.mode === 'drawer' ? (
                  <button
                    type="button"
                    onClick={() => {
                      context.onSelect(
                        { id: 'clothing/shirts', count: 10 },
                        { isLeaf: true },
                      );
                    }}
                  >
                    Select Leaf
                  </button>
                ) : null}
              </div>
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

    const navChip = screen.getByRole('button', {
      name: `${genericNavigation.label}: ${genericNavigation.subCategoryLabel}. Open ${genericNavigation.label}`,
    });
    fireEvent.click(navChip);

    // Wait for the navigation drawer dialog to mount
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', {
      name: `Close ${genericNavigation.label}`,
    });
    expect(closeBtn).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Verify filter drawer Reset button does not exist in this drawer
    expect(
      screen.queryByRole('button', { name: 'Reset' }),
    ).not.toBeInTheDocument();
  });

  it('keeps filter drawer untouched and distinct from navigation drawer when facets exist', async () => {
    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Catalog</h1>}
          records={demoRecords}
          idAccessor="id"
          queryFields={queryFields}
          facets={facets}
          navigation={{
            label: genericNavigation.label,
            currentLabel: genericNavigation.subCategoryLabel,
            currentId: genericNavigation.currentId,
            apply: genericNavigation.apply,
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
      name: `${genericNavigation.label}: ${genericNavigation.subCategoryLabel}. Open ${genericNavigation.label}`,
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
