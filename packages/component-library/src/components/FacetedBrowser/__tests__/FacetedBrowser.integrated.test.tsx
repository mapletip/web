import { MantineProvider, Title } from '@mantine/core';
import { StrictMode, useState } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { FacetedBrowser } from '@/components/FacetedBrowser/FacetedBrowser';
import type { FacetDefinition } from '@/components/FacetedBrowser/FacetedBrowser';
import type {
  BrowseState,
  QueryFieldDefinition,
} from '@/components/FacetedBrowser/hooks/useFacetedBrowser';
import { demoGroupFacetOptions } from '@/fixtures/facetOptions';
import type { DemoRecord } from '@/fixtures/records';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

const state: BrowseState = {
  search: '',
  filters: {},
  page: 4,
  pageSize: 20,
  hiddenColumns: [],
};

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

const alphaCategoryCount = demoRecords.filter(
  (record) => record.group === 'Alpha',
).length;

function Browser({
  state: browseState,
  onStateChange,
  drawerOpened,
  onDrawerOpenedChange,
  drawerContent,
  loading = false,
}: {
  readonly state: BrowseState;
  readonly onStateChange: (next: BrowseState) => void;
  readonly drawerOpened?: boolean;
  readonly onDrawerOpenedChange?: (opened: boolean) => void;
  readonly drawerContent?: ReactNode;
  readonly loading?: boolean;
}) {
  return (
    <MantineProvider>
      <FacetedBrowser
        title={<h1>Records</h1>}
        records={demoRecords}
        idAccessor="id"
        queryFields={queryFields}
        facets={facets}
        presentation="cards"
        renderCard={(record) => (
          <a href={record.href} data-testid="record-link">
            {record.name}
          </a>
        )}
        state={browseState}
        onStateChange={onStateChange}
        loading={loading}
        {...(drawerContent !== undefined ? { drawerContent } : {})}
        {...(drawerOpened !== undefined && onDrawerOpenedChange
          ? { drawerOpened, onDrawerOpenedChange }
          : {})}
      />
    </MantineProvider>
  );
}

describe('integrated FacetedBrowser', () => {
  it('emits one complete controlled transition for search and filtering', async () => {
    const changes: BrowseState[] = [];

    function Controlled() {
      const [current, setCurrent] = useState(state);
      return (
        <StrictMode>
          <Browser
            state={current}
            onStateChange={(next) => {
              changes.push(next);
              setCurrent(next);
            }}
          />
        </StrictMode>
      );
    }

    await render(<Controlled />);
    await page.viewport(1440, 900);
    const search = page.getByRole('textbox', { name: 'Search records' });
    await search.fill('Record 001');
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.at(-1)).toMatchObject({ search: 'Record 001', page: 1 });

    changes.length = 0;
    await search.fill('');
    changes.length = 0;
    await page.getByRole('checkbox', { name: /^Beta \(/u }).click();
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      page: 1,
      filters: { group: ['Beta'] },
    });
  });

  it('commits sorting and its page reset as one controlled transition', async () => {
    const initial: BrowseState = { ...state, page: 3 };
    const changes: BrowseState[] = [];

    function ControlledTable() {
      const [current, setCurrent] = useState(initial);
      return (
        <MantineProvider>
          <FacetedBrowser
            title={<h1>Records</h1>}
            records={demoRecords.slice(0, 80)}
            columns={makeDemoColumns()}
            idAccessor="id"
            identityField="name"
            presentation="comparison"
            renderCard={(record) => <a href={record.href}>{record.name}</a>}
            state={current}
            onStateChange={(next) => {
              changes.push(next);
              setCurrent(next);
            }}
          />
        </MantineProvider>
      );
    }

    await render(<ControlledTable />);
    await page.viewport(1440, 900);
    const sortHeader = document.querySelector('th[data-accessor="value1"]');
    expect(sortHeader).not.toBeNull();
    await userEvent.click(sortHeader!);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      page: 1,
      sort: { field: 'value1', direction: 'desc' },
    });
  });

  it('uses a query-field first direction override for table header clicks', async () => {
    const changes: BrowseState[] = [];

    function OverrideTable() {
      const [current, setCurrent] = useState({
        ...state,
        page: 1,
        pageSize: 20,
      });
      return (
        <MantineProvider>
          <FacetedBrowser
            title={<h1>Override records</h1>}
            records={demoRecords.slice(0, 40)}
            columns={makeDemoColumns()}
            queryFields={[
              {
                id: 'value1',
                firstSortDirection: 'asc',
                sortable: true,
              },
            ]}
            idAccessor="id"
            identityField="name"
            presentation="comparison"
            renderCard={(record) => <a href={record.href}>{record.name}</a>}
            state={current}
            onStateChange={(next) => {
              changes.push(next);
              setCurrent(next);
            }}
          />
        </MantineProvider>
      );
    }

    await render(<OverrideTable />);
    await page.viewport(1440, 900);
    const header = document.querySelector('th[data-accessor="value1"]');
    expect(header).not.toBeNull();
    await userEvent.click(header!);
    expect(changes).toHaveLength(1);
    expect(changes[0]?.sort).toEqual({ field: 'value1', direction: 'asc' });
  });

  it('lets pagination anchors own navigation without committing duplicate state', async () => {
    const changes: BrowseState[] = [];

    function LinkedPagination() {
      const [current, setCurrent] = useState({
        ...state,
        page: 1,
        pageSize: 20,
      });
      return (
        <MantineProvider>
          <FacetedBrowser
            title={<h1>Linked records</h1>}
            records={demoRecords}
            idAccessor="id"
            presentation="cards"
            renderCard={(record) => <a href={record.href}>{record.name}</a>}
            getPageHref={(pageNumber) => `/records?page=${pageNumber}`}
            state={current}
            onStateChange={(next) => {
              changes.push(next);
              setCurrent(next);
            }}
          />
          <button
            type="button"
            onClick={() => setCurrent({ ...current, page: 2 })}
          >
            Restore linked page 2
          </button>
        </MantineProvider>
      );
    }

    await render(<LinkedPagination />);
    await page.viewport(1440, 900);

    const currentPage = page.getByRole('link', { name: 'Page 1' });
    const pageTwo = page.getByRole('link', { name: 'Page 2' });
    expect(currentPage).toHaveAttribute('aria-current', 'page');
    expect(currentPage).toHaveAttribute('href', '/records?page=1');
    expect(pageTwo).toHaveAttribute('href', '/records?page=2');
    expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    const nextLink = page.getByRole('link', { name: 'Next page' });
    expect(nextLink).toHaveAttribute('href', '/records?page=2');

    const clicks: {
      readonly ctrlKey: boolean;
      readonly button: number;
      readonly defaultPrevented: boolean;
    }[] = [];
    const capture = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      if (!(mouseEvent.target instanceof Element)) return;
      if (!mouseEvent.target.closest('a[href]')) return;
      clicks.push({
        ctrlKey: mouseEvent.ctrlKey,
        button: mouseEvent.button,
        defaultPrevented: mouseEvent.defaultPrevented,
      });
      mouseEvent.preventDefault();
    };
    document.addEventListener('click', capture);
    document.addEventListener('auxclick', capture);

    try {
      await userEvent.click(pageTwo);
      expect(clicks.at(-1)).toMatchObject({
        ctrlKey: false,
        button: 0,
        defaultPrevented: false,
      });

      await userEvent.click(nextLink);
      expect(clicks.at(-1)).toMatchObject({
        ctrlKey: false,
        button: 0,
        defaultPrevented: false,
      });

      await userEvent.click(pageTwo, { modifiers: ['Control'] });
      expect(clicks.at(-1)).toMatchObject({
        ctrlKey: true,
        button: 0,
        defaultPrevented: false,
      });

      await userEvent.click(pageTwo, { button: 'middle' });
      expect(clicks.at(-1)).toMatchObject({
        ctrlKey: false,
        button: 1,
        defaultPrevented: false,
      });
    } finally {
      document.removeEventListener('click', capture);
      document.removeEventListener('auxclick', capture);
    }

    expect(changes).toHaveLength(0);
    await page.getByRole('button', { name: 'Restore linked page 2' }).click();
    expect(changes).toHaveLength(0);
    expect(pageTwo).toHaveAttribute('aria-current', 'page');
  });

  it('updates canonical state with local pagination buttons', async () => {
    const changes: BrowseState[] = [];

    function LocalPagination() {
      const [current, setCurrent] = useState({
        ...state,
        page: 1,
        pageSize: 20,
      });
      return (
        <MantineProvider>
          <FacetedBrowser
            title={<h1>Local records</h1>}
            records={demoRecords}
            idAccessor="id"
            presentation="cards"
            renderCard={(record) => <a href={record.href}>{record.name}</a>}
            state={current}
            onStateChange={(next) => {
              changes.push(next);
              setCurrent(next);
            }}
          />
        </MantineProvider>
      );
    }

    await render(<LocalPagination />);
    await page.viewport(1440, 900);
    expect(document.querySelector('a[href^="?page="]')).toBeNull();

    await page.getByRole('button', { name: 'Next page' }).click();
    expect(changes).toHaveLength(1);
    expect(changes[0]?.page).toBe(2);
    expect(page.getByText('21–40 of 200 records').first()).toBeVisible();
  });

  it('restores a controlled page and clamps it once under StrictMode', async () => {
    const changes: BrowseState[] = [];
    const restored: BrowseState = {
      ...state,
      sort: { field: 'value1', direction: 'desc' },
      page: 12,
      pageSize: 20,
    };

    function RestoredBrowser() {
      const [current, setCurrent] = useState(restored);
      return (
        <StrictMode>
          <Browser
            state={current}
            onStateChange={(next) => {
              changes.push(next);
              setCurrent(next);
            }}
          />
        </StrictMode>
      );
    }

    await render(<RestoredBrowser />);
    await expect.poll(() => changes.length).toBe(1);
    expect(changes[0]).toMatchObject({ page: 10, pageSize: 20 });
    expect(page.getByText('181–200 of 200 records').first()).toBeVisible();
  });

  it('stages drawer edits and commits all facets once on Apply', async () => {
    const changes: BrowseState[] = [];
    const openedChanges: boolean[] = [];

    function ControlledDrawer() {
      const [current, setCurrent] = useState({ ...state, page: 2 });
      const [opened, setOpened] = useState(false);
      return (
        <Browser
          state={current}
          onStateChange={(next) => {
            changes.push(next);
            setCurrent(next);
          }}
          drawerOpened={opened}
          onDrawerOpenedChange={(next) => {
            openedChanges.push(next);
            setOpened(next);
          }}
        />
      );
    }

    await render(<ControlledDrawer />);
    await page.viewport(375, 812);
    const initialSummary = page.getByText('21–40 of 200 records').first();
    expect(initialSummary).toBeVisible();
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();
    expect(openedChanges).toEqual([true]);
    await page.getByRole('checkbox', { name: /^Beta \(/u }).click();
    expect(changes).toHaveLength(0);
    expect(page.getByText('21–40 of 200 records').first()).toBeVisible();
    await page.getByRole('button', { name: /^Show \d+ records$/u }).click();
    expect(changes).toHaveLength(1);
    expect(changes[0]?.filters).toEqual({ group: ['Beta'] });
    expect(changes[0]?.page).toBe(1);
    expect(openedChanges).toEqual([true, false]);
  });

  it('closes without a state change when the drawer draft is unchanged', async () => {
    const changes: BrowseState[] = [];
    const openedChanges: boolean[] = [];

    function NoopDrawer() {
      const [current, setCurrent] = useState({ ...state, page: 1 });
      const [opened, setOpened] = useState(false);
      return (
        <Browser
          state={current}
          onStateChange={(next) => {
            changes.push(next);
            setCurrent(next);
          }}
          drawerOpened={opened}
          onDrawerOpenedChange={(next) => {
            openedChanges.push(next);
            setOpened(next);
          }}
        />
      );
    }

    await render(<NoopDrawer />);
    await page.viewport(375, 812);
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();
    await page.getByRole('button', { name: /^Show \d+ records$/u }).click();

    expect(changes).toEqual([]);
    expect(openedChanges).toEqual([true, false]);
  });

  it('updates the pending count synchronously when the draft changes', async () => {
    const betaCount = demoRecords.filter(
      (record) => record.group === 'Beta',
    ).length;
    const gammaCount = demoRecords.filter(
      (record) => record.group === 'Gamma',
    ).length;

    await render(
      <Browser state={{ ...state, page: 1 }} onStateChange={() => {}} />,
    );
    await page.viewport(375, 812);
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();

    const beta = page.getByRole('checkbox', { name: /^Beta \(/u });
    const gamma = page.getByRole('checkbox', { name: /^Gamma \(/u });
    await beta.click();
    await expect
      .element(page.getByRole('button', { name: `Show ${betaCount} records` }))
      .toBeVisible();
    await beta.click();
    await gamma.click();
    await expect
      .element(page.getByRole('button', { name: `Show ${gammaCount} records` }))
      .toBeVisible();
  });

  it('updates drawer facet counts from the staged draft', async () => {
    const globalEastCount = demoRecords.filter(
      (record) => record.region === 'East',
    ).length;
    const alphaEastCount = demoRecords.filter(
      (record) => record.group === 'Alpha' && record.region === 'East',
    ).length;
    expect(alphaEastCount).not.toBe(globalEastCount);

    await render(
      <Browser state={{ ...state, page: 1 }} onStateChange={() => {}} />,
    );
    await page.viewport(375, 812);
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();

    expect(
      page.getByRole('checkbox', { name: `East (${globalEastCount})` }),
    ).toBeVisible();
    await page.getByRole('checkbox', { name: /^Alpha \(/u }).click();

    await vi.waitFor(() => {
      expect(
        page.getByRole('checkbox', { name: `East (${alphaEastCount})` }),
      ).toBeVisible();
    });
    expect(page.getByRole('checkbox', { name: /^Beta \(/u })).toBeVisible();
  });

  it('focuses a direct-entry facet, returns to the overview and restores its opener', async () => {
    await render(
      <Browser state={{ ...state, page: 1 }} onStateChange={() => {}} />,
    );
    await page.viewport(375, 812);
    const opener = page.getByRole('button', {
      name: 'Category. Open Category filters',
    });
    await opener.click();
    await expect
      .poll(() => document.activeElement?.textContent)
      .toBe('Category');

    await page.getByRole('button', { name: 'Back to all filters' }).click();
    await expect
      .poll(() => document.activeElement?.textContent)
      .toBe('Filters');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect
      .poll(() => document.activeElement?.textContent)
      .toBe('Category');
  });

  it('resets only the drawer draft and keeps committed search and sort on Apply', async () => {
    const changes: BrowseState[] = [];
    const initial: BrowseState = {
      ...state,
      search: 'Record',
      filters: { group: ['Alpha'] },
      sort: { field: 'value1', direction: 'desc' },
      page: 1,
    };

    function ResettableBrowser() {
      const [current, setCurrent] = useState(initial);
      return (
        <Browser
          state={current}
          onStateChange={(next) => {
            changes.push(next);
            setCurrent(next);
          }}
        />
      );
    }

    await render(<ResettableBrowser />);
    await page.viewport(375, 812);
    await page
      .getByRole('button', { name: /Category, 1 active filter/u })
      .click();
    expect(page.getByRole('checkbox', { name: /^Alpha \(/u })).toBeChecked();
    await page.getByRole('button', { name: 'Reset' }).click();
    expect(
      page.getByRole('checkbox', { name: /^Alpha \(/u }),
    ).not.toBeChecked();
    expect(changes).toHaveLength(0);
    await page.getByRole('button', { name: /^Show \d+ records$/u }).click();

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      search: 'Record',
      filters: {},
      sort: { field: 'value1', direction: 'desc' },
      page: 1,
    });
  });

  it('clears a draft when a host closes and reopens the drawer', async () => {
    function HostDrawer() {
      const [current, setCurrent] = useState({ ...state, page: 1 });
      const [opened, setOpened] = useState(false);
      return (
        <>
          <Browser
            state={current}
            onStateChange={setCurrent}
            drawerOpened={opened}
            onDrawerOpenedChange={setOpened}
            drawerContent={
              <>
                <button type="button" onClick={() => setOpened(false)}>
                  Host close
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrent({ ...current, filters: { group: ['Gamma'] } })
                  }
                >
                  Restore host state
                </button>
              </>
            }
          />
          <button type="button" onClick={() => setOpened(true)}>
            Host reopen
          </button>
        </>
      );
    }

    await render(<HostDrawer />);
    await page.viewport(375, 812);
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();
    await page.getByRole('checkbox', { name: /^Beta \(/u }).click();
    expect(page.getByRole('checkbox', { name: /^Beta \(/u })).toBeChecked();

    await page.getByRole('button', { name: 'Host close' }).click();
    await expect
      .poll(
        () =>
          document.querySelector('[role="dialog"]')?.getClientRects().length ??
          0,
      )
      .toBe(0);

    await page.getByRole('button', { name: 'Host reopen' }).click();
    await expect
      .element(page.getByRole('checkbox', { name: /^Beta \(/u }))
      .not.toBeChecked();
    await expect
      .element(page.getByRole('button', { name: /^Show \d+ records$/u }))
      .toBeVisible();

    await page.getByRole('button', { name: 'Restore host state' }).click();
    await expect
      .poll(
        () =>
          document.querySelector('[role="dialog"]')?.getClientRects().length ??
          0,
      )
      .toBe(0);
  });

  it('discards a drawer draft when controlled state is restored externally', async () => {
    const componentChanges: BrowseState[] = [];
    const drawerChanges: boolean[] = [];

    function ExternalRestore() {
      const [current, setCurrent] = useState({ ...state, page: 1 });
      const [opened, setOpened] = useState(false);
      return (
        <Browser
          state={current}
          onStateChange={(next) => {
            componentChanges.push(next);
            setCurrent(next);
          }}
          drawerOpened={opened}
          onDrawerOpenedChange={(next) => {
            drawerChanges.push(next);
            setOpened(next);
          }}
          drawerContent={
            <button
              type="button"
              onClick={() =>
                setCurrent({ ...current, filters: { group: ['Gamma'] } })
              }
            >
              Restore external browse state
            </button>
          }
        />
      );
    }

    await render(<ExternalRestore />);
    await page.viewport(375, 812);
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();
    await page.getByRole('checkbox', { name: /^Beta \(/u }).click();
    await page
      .getByRole('button', { name: 'Restore external browse state' })
      .click();

    expect(componentChanges).toEqual([]);
    expect(drawerChanges).toEqual([true, false]);
    expect(
      page.getByRole('button', {
        name: 'Category, 1 active filter. Open Category filters',
      }),
    ).toBeVisible();
    await expect
      .poll(
        () =>
          document.querySelector('[role="dialog"]')?.getClientRects().length ??
          0,
      )
      .toBe(0);
  });

  it('closes for drawer scope links without committing the staged filters', async () => {
    const changes: BrowseState[] = [];
    const drawerChanges: boolean[] = [];

    function NavigableBrowser() {
      const [current, setCurrent] = useState({ ...state, page: 1 });
      const [opened, setOpened] = useState(false);
      return (
        <Browser
          state={current}
          onStateChange={(next) => {
            changes.push(next);
            setCurrent(next);
          }}
          drawerOpened={opened}
          onDrawerOpenedChange={(next) => {
            drawerChanges.push(next);
            setOpened(next);
          }}
          drawerContent={
            <a href="/records/region/north">Browse the North region</a>
          }
        />
      );
    }

    await render(<NavigableBrowser />);
    await page.viewport(375, 812);
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();
    await page.getByRole('checkbox', { name: /^Beta \(/u }).click();
    const scopeLink = page
      .getByRole('link', { name: 'Browse the North region' })
      .element();
    const click = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });
    scopeLink.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
    expect(changes).toEqual([]);
    expect(drawerChanges).toEqual([true, false]);
    await expect
      .poll(
        () =>
          document.querySelector('[role="dialog"]')?.getClientRects().length ??
          0,
      )
      .toBe(0);
  });

  it('uses the generic apply label when results are loading', async () => {
    await render(
      <Browser
        state={{ ...state, page: 1 }}
        onStateChange={() => {}}
        loading
      />,
    );
    await page.viewport(375, 812);
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();
    await page.getByRole('checkbox', { name: /^Beta \(/u }).click();
    expect(page.getByRole('button', { name: 'Show results' })).toBeEnabled();
  });

  it('uses contextual counts and excludes unknown values from boolean false', async () => {
    interface AvailabilityRecord extends Record<string, unknown> {
      readonly id: string;
      readonly available: boolean | undefined;
    }
    const records: readonly AvailabilityRecord[] = [
      { id: 'yes', available: true },
      { id: 'no', available: false },
      { id: 'unknown', available: undefined },
    ];
    const initial: BrowseState = {
      search: '',
      filters: {},
      page: 1,
      pageSize: 10,
      hiddenColumns: [],
    };
    const changes: BrowseState[] = [];

    function BooleanBrowser() {
      const [current, setCurrent] = useState(initial);
      return (
        <MantineProvider>
          <FacetedBrowser
            title={<h1>Availability</h1>}
            recordNoun="entry"
            records={records}
            queryFields={[{ id: 'available', accessor: 'available' }]}
            idAccessor="id"
            facets={[
              {
                id: 'availability',
                field: 'available',
                label: 'Availability',
                kind: 'boolean',
                quick: true,
              },
            ]}
            presentation="cards"
            renderCard={(record) => <a href={`/${record.id}`}>{record.id}</a>}
            state={current}
            onStateChange={(next) => {
              changes.push(next);
              setCurrent(next);
            }}
          />
        </MantineProvider>
      );
    }

    await render(<BooleanBrowser />);
    await page.viewport(375, 812);
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();
    await page.getByRole('combobox', { name: 'Availability' }).click();
    await page.getByRole('option', { name: 'No (1)' }).click();
    expect(page.getByRole('button', { name: 'Show 1 entry' })).toBeEnabled();
    await page.getByRole('button', { name: 'Show 1 entry' }).click();

    expect(changes).toHaveLength(1);
    expect(changes[0]?.filters).toEqual({ available: false });
    expect(page.getByRole('link', { name: 'no' })).toBeVisible();
    expect(document.querySelector('a[href="/unknown"]')).toBeNull();
  });

  it('passes only the canonical current page to custom results without a table', async () => {
    await render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Record discovery</h1>}
          records={demoRecords.slice(0, 25)}
          queryFields={queryFields}
          idAccessor="id"
          presentation="custom"
          renderResults={({ records, state: current }) => (
            <ul data-testid="custom-results" data-page={current.page}>
              {records.map((record) => (
                <li key={record.id}>
                  <a href={record.href}>{record.name}</a>
                </li>
              ))}
            </ul>
          )}
          defaultState={{
            search: '',
            filters: {},
            page: 2,
            pageSize: 10,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    const results = document.querySelector<HTMLElement>(
      '[data-testid="custom-results"]',
    );
    expect(results?.dataset['page']).toBe('2');
    expect(results?.querySelectorAll('li')).toHaveLength(10);
    expect(
      results?.querySelector('a[href="/records/record-011"]'),
    ).not.toBeNull();
    expect(document.querySelector('table')).toBeNull();
    expect(page.getByRole('button', { name: 'Next page' })).toBeVisible();
    expect(document.querySelector('a[href^="?page="]')).toBeNull();
  });

  it('renders cards-only presentations at desktop and mobile widths', async () => {
    await render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Cards only</h1>}
          records={demoRecords.slice(0, 10)}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 10,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    for (const width of [320, 375, 500, 991, 992, 1440]) {
      await page.viewport(width, 900);
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
      expect(document.querySelector('table')).toBeNull();
      expect(
        document
          .querySelector('[role="list"][aria-label="records cards"]')
          ?.getClientRects().length,
      ).toBeGreaterThan(0);
    }
  });

  it('keeps uncontrolled defaults on the initial mount only', async () => {
    const defaultState: BrowseState = {
      search: 'Record 001',
      filters: {},
      page: 1,
      pageSize: 20,
      hiddenColumns: [],
    };
    const browser = await render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={demoRecords}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          defaultState={defaultState}
        />
      </MantineProvider>,
    );
    expect(page.getByRole('textbox', { name: 'Search records' })).toHaveValue(
      'Record 001',
    );
    await browser.rerender(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={demoRecords}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          defaultState={{ ...defaultState, search: '' }}
        />
      </MantineProvider>,
    );
    expect(page.getByRole('textbox', { name: 'Search records' })).toHaveValue(
      'Record 001',
    );
  });

  it('limits rail options to three until See more is used', async () => {
    await render(
      <Browser state={{ ...state, page: 1 }} onStateChange={() => {}} />,
    );
    await page.viewport(1440, 900);

    const rail = document.querySelector<HTMLElement>(
      'aside[aria-label="Filters"]',
    )!;
    const railCheckboxes = () =>
      rail.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const seeMoreButtons = () =>
      [...rail.querySelectorAll<HTMLButtonElement>('button')].filter(
        (button) => button.textContent === 'See more',
      );

    expect(railCheckboxes()).toHaveLength(6);
    expect(rail.textContent).not.toContain('Delta');
    expect(seeMoreButtons()).toHaveLength(2);

    await userEvent.click(seeMoreButtons()[0]!);

    expect(railCheckboxes()).toHaveLength(16);
    expect(rail.textContent).toContain('Delta');
    expect(rail.textContent).toContain('See less');
  });

  it('limits drawer options to three until See more is used', async () => {
    await render(
      <Browser state={{ ...state, page: 1 }} onStateChange={() => {}} />,
    );
    await page.viewport(375, 812);
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();
    await vi.waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    });

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    const dialogCheckboxes = () =>
      dialog.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const seeMoreButtons = () =>
      [...dialog.querySelectorAll<HTMLButtonElement>('button')].filter(
        (button) => button.textContent === 'See more',
      );

    expect(dialogCheckboxes()).toHaveLength(6);
    expect(dialog.textContent).not.toContain('Delta');
    expect(seeMoreButtons()).toHaveLength(2);

    await userEvent.click(seeMoreButtons()[0]!);

    expect(dialogCheckboxes()).toHaveLength(16);
    expect(dialog.textContent).toContain('Delta');
    expect(dialog.textContent).toContain('See less');
  });

  it('keeps comparison, card, rail and quick-facet presentation inside the viewport', async () => {
    await render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={demoRecords.slice(0, 30)}
          columns={makeDemoColumns()}
          idAccessor="id"
          identityField="name"
          presentation="comparison"
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          facets={facets}
          queryFields={queryFields}
          defaultState={{
            search: '',
            filters: { group: ['Beta', 'Gamma'] },
            page: 1,
            pageSize: 10,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    const desktopColumnWidths: {
      category: number;
      firstMetric: number;
      metric: number;
    }[] = [];
    const desktopTableWidths: number[] = [];
    const toolbarHeights: { columns: number; pageSize: number }[] = [];

    for (const width of [320, 375, 500, 991, 992, 1440, 1711, 2400]) {
      await page.viewport(width, 900);
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
      const table = document.querySelector<HTMLTableElement>(
        'table[aria-label="records comparison"]',
      );
      const cards = document.querySelector<HTMLElement>(
        '[role="list"][aria-label="records cards"]',
      );
      expect(table).not.toBeNull();
      expect(cards).not.toBeNull();
      const quickFilters = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Filters, 2 active. Open all filters"]',
      );
      expect((table?.getClientRects().length ?? 0) > 0).toBe(width >= 992);
      expect((cards?.getClientRects().length ?? 0) > 0).toBe(width < 992);
      expect((quickFilters?.getClientRects().length ?? 0) > 0).toBe(
        width < 992,
      );
      const chooseColumns = document.querySelector<HTMLButtonElement>(
        'button[aria-label^="Choose columns,"]',
      );
      const pageSize = document.querySelector<HTMLInputElement>(
        'input[aria-label="records per page"]',
      );
      expect(chooseColumns?.querySelector('svg')).not.toBeNull();
      toolbarHeights.push({
        columns: chooseColumns?.getBoundingClientRect().height ?? 0,
        pageSize: pageSize?.getBoundingClientRect().height ?? 0,
      });

      if (width >= 992) {
        const table = document.querySelector<HTMLTableElement>(
          '.mantine-datatable-table',
        );
        desktopTableWidths.push(table?.getBoundingClientRect().width ?? 0);
        desktopColumnWidths.push({
          category:
            document
              .querySelector('th[data-accessor="group"]')
              ?.getBoundingClientRect().width ?? 0,
          firstMetric:
            document
              .querySelector('th[data-accessor="value1"]')
              ?.getBoundingClientRect().width ?? 0,
          metric:
            document
              .querySelector('th[data-accessor="value2"]')
              ?.getBoundingClientRect().width ?? 0,
        });
      }
    }

    expect(
      toolbarHeights.every(({ columns, pageSize }) => columns === pageSize),
    ).toBe(true);
    expect(new Set(desktopTableWidths).size).toBe(1);
    expect(
      desktopColumnWidths.every(
        (widths) =>
          widths.category > 0 && widths.firstMetric > 0 && widths.metric > 0,
      ),
    ).toBe(true);

    await page.getByRole('combobox', { name: 'records per page' }).click();
    const visiblePageSizeOptions = [
      ...document.querySelectorAll<HTMLElement>('[role="option"]'),
    ].filter((option) => option.getClientRects().length > 0);
    const pageSizeLabelOffsets = visiblePageSizeOptions.map(
      (option) => option.querySelector('span')?.getBoundingClientRect().left,
    );
    const selectedPageSize = visiblePageSizeOptions.find(
      (option) => option.getAttribute('aria-selected') === 'true',
    );
    expect(new Set(pageSizeLabelOffsets).size).toBe(1);
    expect(
      selectedPageSize?.querySelector('span')?.previousElementSibling?.tagName,
    ).toBe('svg');
  });

  it('bounds the DataTable scroll region when tableMaxHeight is set', async () => {
    await page.viewport(1440, 900);
    await render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={demoRecords}
          columns={makeDemoColumns()}
          idAccessor="id"
          identityField="name"
          presentation="comparison"
          facets={facets}
          queryFields={queryFields}
          tableMaxHeight={480}
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 50,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    const rows = document.querySelectorAll('.mantine-datatable-table tbody tr');
    const scrollArea = document.querySelector<HTMLElement>(
      '.mantine-datatable [data-scrollarea-viewport="true"]',
    );
    expect(rows).toHaveLength(50);
    expect(scrollArea).not.toBeNull();
    expect(scrollArea!.clientHeight).toBeLessThanOrEqual(480);
    expect(scrollArea!.scrollHeight).toBeGreaterThan(scrollArea!.clientHeight);
    expect(scrollArea!.scrollWidth).toBeGreaterThan(scrollArea!.clientWidth);

    const header = document.querySelector<HTMLElement>(
      '.mantine-datatable-header',
    )!;
    scrollArea!.scrollTop = 30;
    expect(
      Math.abs(
        header.getBoundingClientRect().top -
          scrollArea!.getBoundingClientRect().top,
      ),
    ).toBeLessThanOrEqual(1);

    await userEvent.click(page.getByRole('checkbox', { name: /^Alpha \(/u }));
    await vi.waitFor(() => {
      expect(
        document.querySelectorAll('.mantine-datatable-table tbody tr'),
      ).toHaveLength(alphaCategoryCount);
    });
    expect(document.body.textContent).toContain('Category: Alpha');
  });

  it('keeps the rail in normal page flow inside a realistic page', async () => {
    await page.viewport(1440, 900);
    await render(
      <MantineProvider>
        <div>
          <header style={{ height: 200 }}>Site header</header>
          <main>
            <FacetedBrowser
              title={<h1>Records</h1>}
              records={demoRecords}
              columns={makeDemoColumns()}
              idAccessor="id"
              identityField="name"
              presentation="comparison"
              facets={facets}
              queryFields={queryFields}
              tableMaxHeight={480}
              renderCard={(record) => <a href={record.href}>{record.name}</a>}
              defaultState={{
                search: '',
                filters: {},
                page: 1,
                pageSize: 50,
                hiddenColumns: [],
              }}
            />
          </main>
          <footer style={{ height: 600 }}>Site footer</footer>
        </div>
      </MantineProvider>,
    );

    const rail = document.querySelector<HTMLElement>('aside')!;
    const railTop = rail.getBoundingClientRect().top;
    expect(getComputedStyle(rail).overflowY).not.toBe('auto');
    expect(getComputedStyle(rail).overflowY).not.toBe('scroll');
    expect(document.documentElement.scrollHeight).toBeGreaterThan(900);

    window.scrollTo(0, 200);
    await vi.waitFor(() => {
      expect(rail.getBoundingClientRect().top).toBeLessThan(railTop);
    });
    expect(window.scrollY).toBe(200);

    const scrollArea = document.querySelector<HTMLElement>(
      '.mantine-datatable [data-scrollarea-viewport="true"]',
    )!;
    expect(scrollArea.clientHeight).toBeLessThanOrEqual(480);
    expect(scrollArea.scrollHeight).toBeGreaterThan(scrollArea.clientHeight);
  });

  it('keeps comparison rows moving down when scrolling over a row', async () => {
    await page.viewport(1711, 736);

    const columns = makeDemoColumns();
    columns.push(
      { accessor: 'region', title: 'Region' },
      { accessor: 'status', title: 'Status' },
      { accessor: 'value10', title: 'Value 10', numeric: true },
      { accessor: 'href', title: 'Record URL' },
    );

    await render(
      <MantineProvider>
        <FacetedBrowser
          title={<Title order={1}>Browse records</Title>}
          records={demoRecords}
          columns={columns}
          idAccessor="id"
          identityField="name"
          presentation="comparison"
          queryFields={queryFields}
          facets={facets}
          tableMaxHeight={480}
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          defaultState={{
            search: '',
            filters: {},
            sort: { field: 'value1', direction: 'desc' },
            page: 1,
            pageSize: 50,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>,
    );

    const scrollArea = document.querySelector<HTMLElement>(
      '.mantine-datatable [data-scrollarea-viewport="true"]',
    )!;
    expect(scrollArea.scrollWidth).toBeGreaterThan(scrollArea.clientWidth);
    const pinnedCell = scrollArea.querySelector<HTMLElement>(
      'tbody td[data-pinned]',
    )!;
    expect(getComputedStyle(pinnedCell).overflowX).toBe('visible');

    const initialPinnedCellLeft = pinnedCell.getBoundingClientRect().left;
    scrollArea.scrollLeft = 120;
    expect(pinnedCell.getBoundingClientRect().left).toBe(initialPinnedCellLeft);
    scrollArea.scrollLeft = 0;

    const wheelDownToBottom = async () => {
      const initialScrollHeight = scrollArea.scrollHeight;
      const scrollPositions = [scrollArea.scrollTop];
      const recordScrollPosition = () => {
        scrollPositions.push(scrollArea.scrollTop);
      };
      scrollArea.addEventListener('scroll', recordScrollPosition);

      const firstNonPinnedCell = scrollArea.querySelector<HTMLElement>(
        'tbody tr td:nth-child(6)',
      )!;
      expect(firstNonPinnedCell.hasAttribute('data-pinned')).toBe(false);
      await userEvent.wheel(firstNonPinnedCell, {
        delta: { y: 180 },
        times: 16,
      });
      await vi.waitFor(() => {
        expect(scrollArea.scrollTop).toBe(
          scrollArea.scrollHeight - scrollArea.clientHeight,
        );
      });

      const lastRow = scrollArea.querySelector<HTMLElement>(
        'tbody tr:last-child',
      )!;
      const bottomScrollTop = scrollArea.scrollTop;
      await userEvent.wheel(lastRow, { delta: { y: 180 }, times: 3 });
      await vi.waitFor(() => {
        expect(scrollArea.scrollTop).toBe(bottomScrollTop);
      });
      scrollArea.removeEventListener('scroll', recordScrollPosition);

      expect(scrollArea.scrollHeight).toBe(initialScrollHeight);
      expect(
        scrollPositions.every(
          (position, index) =>
            index === 0 || position >= scrollPositions[index - 1]!,
        ),
      ).toBe(true);
      expect(window.scrollY).toBe(0);
    };

    await wheelDownToBottom();

    await userEvent.click(page.getByRole('checkbox', { name: /^Alpha \(/u }));
    await vi.waitFor(() => {
      expect(
        document.querySelectorAll('.mantine-datatable-table tbody tr'),
      ).toHaveLength(alphaCategoryCount);
    });

    scrollArea.scrollTop = 0;
    await vi.waitFor(() => expect(scrollArea.scrollTop).toBe(0));
    await wheelDownToBottom();

    await page.viewport(1280, 720);
  });

  it('renders with poisoned empty localStorage state and keeps canonical visibility', async () => {
    await page.viewport(1440, 900);
    const previousEmptyKey = localStorage.getItem('');
    localStorage.setItem('', '[]');

    try {
      const view = await render(
        <MantineProvider>
          <FacetedBrowser
            title={<h1>Records</h1>}
            records={demoRecords}
            columns={makeDemoColumns()}
            idAccessor="id"
            identityField="name"
            presentation="comparison"
            tableMaxHeight={480}
            renderCard={(record) => <a href={record.href}>{record.name}</a>}
            defaultState={{
              search: '',
              filters: {},
              page: 1,
              pageSize: 50,
              hiddenColumns: ['group'],
            }}
          />
        </MantineProvider>,
      );

      const table = document.querySelector<HTMLTableElement>(
        'table[aria-label="records comparison"]',
      );
      await vi.waitFor(() => expect(table).not.toBeNull());
      expect(table!.getClientRects().length).toBeGreaterThan(0);
      expect(
        document.querySelectorAll('.mantine-datatable-table tbody tr').length,
      ).toBeGreaterThan(0);
      expect(
        document.querySelector('thead th[data-accessor="group"]'),
      ).toBeNull();
      expect(
        document.querySelector('thead th[data-accessor="value1"]'),
      ).not.toBeNull();
      expect(
        document.querySelector('tbody a[href^="/records/"]'),
      ).not.toBeNull();

      await view.unmount();
      await render(
        <MantineProvider>
          <FacetedBrowser
            title={<h1>Records remount</h1>}
            records={demoRecords}
            columns={makeDemoColumns()}
            idAccessor="id"
            identityField="name"
            presentation="comparison"
            tableMaxHeight={480}
            renderCard={(record) => <a href={record.href}>{record.name}</a>}
            defaultState={{
              search: '',
              filters: {},
              page: 1,
              pageSize: 50,
              hiddenColumns: ['group'],
            }}
          />
        </MantineProvider>,
      );
      await vi.waitFor(() => {
        expect(document.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
      });
      expect(
        document.querySelector('thead th[data-accessor="group"]'),
      ).toBeNull();
      expect(
        document.querySelector('thead th[data-accessor="value1"]'),
      ).not.toBeNull();

      const namespacedKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith('mapletip:component-library:datatable:v1:'),
      );
      expect(namespacedKeys.length).toBeGreaterThan(0);
      expect(namespacedKeys.every((key) => key.length > 0)).toBe(true);
    } finally {
      if (previousEmptyKey === null) localStorage.removeItem('');
      else localStorage.setItem('', previousEmptyKey);
    }
  });

  it('reuses one bounded DataTable bucket for identical browsers', async () => {
    localStorage.clear();
    const isolatedState: BrowseState = {
      search: '',
      filters: {},
      page: 1,
      pageSize: 20,
      hiddenColumns: [],
    };
    const columns = makeDemoColumns();
    const records = demoRecords.slice(0, 3);
    const tree = (
      <MantineProvider>
        <FacetedBrowser
          title={<h1>First browser</h1>}
          records={records}
          columns={columns}
          idAccessor="id"
          identityField="name"
          presentation="comparison"
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          state={isolatedState}
          onStateChange={() => undefined}
        />
        <FacetedBrowser
          title={<h1>Second browser</h1>}
          records={records}
          columns={columns}
          idAccessor="id"
          identityField="name"
          presentation="comparison"
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          state={isolatedState}
          onStateChange={() => undefined}
        />
      </MantineProvider>
    );
    await render(tree);
    await page.viewport(1440, 900);

    await vi.waitFor(() => {
      const widthKeys = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith('mapletip:component-library:datatable:v1:') &&
          key.endsWith('-columns-width'),
      );
      expect(widthKeys).toHaveLength(1);
    });
  });

  it('keeps canonical visibility authoritative while DataTable persists widths', async () => {
    await page.viewport(1440, 900);
    const columns = makeDemoColumns();
    const columnAccessors = columns
      .map((column) => String(column.accessor))
      .sort()
      .join(',');
    const staleStoreKey = `mapletip:component-library:datatable:v1:id:name:${columnAccessors}`;
    const staleWidthsKey = `${staleStoreKey}-columns-width`;
    const previousWidths = localStorage.getItem(staleWidthsKey);
    localStorage.setItem(staleWidthsKey, JSON.stringify([{ group: '220px' }]));

    function VisibilityHarness() {
      const [browse, setBrowse] = useState<BrowseState>({
        search: '',
        filters: {},
        page: 1,
        pageSize: 50,
        hiddenColumns: ['group'],
      });
      return (
        <>
          <button
            type="button"
            onClick={() => setBrowse({ ...browse, hiddenColumns: [] })}
          >
            Show group
          </button>
          <button
            type="button"
            onClick={() => setBrowse({ ...browse, hiddenColumns: ['group'] })}
          >
            Hide group
          </button>
          <FacetedBrowser
            title={<h1>Records</h1>}
            records={demoRecords}
            columns={columns}
            idAccessor="id"
            identityField="name"
            presentation="comparison"
            renderCard={(record) => <a href={record.href}>{record.name}</a>}
            state={browse}
            onStateChange={setBrowse}
          />
        </>
      );
    }

    try {
      await render(
        <MantineProvider>
          <VisibilityHarness />
        </MantineProvider>,
      );

      // Canonical state hides the column: DataTable storage cannot reveal it.
      await vi.waitFor(() => {
        expect(
          document.querySelector('thead th[data-accessor="value1"]'),
        ).not.toBeNull();
      });
      expect(
        document.querySelector('thead th[data-accessor="group"]'),
      ).toBeNull();

      // Canonical state shows it again, regardless of persisted widths.
      await userEvent.click(page.getByRole('button', { name: 'Show group' }));
      await vi.waitFor(() => {
        expect(
          document.querySelector('thead th[data-accessor="group"]'),
        ).not.toBeNull();
      });

      await userEvent.click(page.getByRole('button', { name: 'Hide group' }));
      await vi.waitFor(() => {
        expect(
          document.querySelector('thead th[data-accessor="group"]'),
        ).toBeNull();
      });
    } finally {
      if (previousWidths === null) localStorage.removeItem(staleWidthsKey);
      else localStorage.setItem(staleWidthsKey, previousWidths);
    }
  });

  it('keeps one bounded storage bucket across remounts and visibility changes', async () => {
    await page.viewport(1440, 900);
    localStorage.clear();
    const columns = makeDemoColumns();
    const records = demoRecords.slice(0, 3);
    const widthKeys = () =>
      Object.keys(localStorage).filter(
        (key) =>
          key.startsWith('mapletip:component-library:datatable:v1:') &&
          key.endsWith('-columns-width'),
      );

    for (let mount = 0; mount < 3; mount += 1) {
      const view = await render(
        <MantineProvider>
          <FacetedBrowser
            title={<h1>Records {mount}</h1>}
            records={records}
            columns={columns}
            idAccessor="id"
            identityField="name"
            presentation="comparison"
            renderCard={(record) => <a href={record.href}>{record.name}</a>}
            defaultState={{
              search: '',
              filters: {},
              page: 1,
              pageSize: 50,
              hiddenColumns:
                mount === 0 ? [] : ['group', 'value1', 'value2', 'value3'],
            }}
          />
        </MantineProvider>,
      );
      await vi.waitFor(() =>
        expect(document.querySelector('.mantine-datatable')).not.toBeNull(),
      );
      await view.unmount();
    }

    expect(widthKeys()).toHaveLength(1);
  });

  it('restores explicitly scoped widths and isolates unrelated scopes', async () => {
    await page.viewport(1440, 900);
    localStorage.clear();
    const columns = makeDemoColumns();
    const records = demoRecords.slice(0, 3);
    const renderTable = (storageKey: string) => (
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={records}
          columns={columns}
          idAccessor="id"
          identityField="name"
          presentation="comparison"
          tableStorageKey={storageKey}
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 50,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>
    );

    const first = await render(renderTable('mapletip:test:domain-a'));
    const firstHeader = document.querySelector<HTMLElement>(
      'thead th[data-accessor="group"]',
    )!;
    const widthBefore = firstHeader.getBoundingClientRect().width;
    const handle = firstHeader.querySelector<HTMLElement>(
      '.mantine-datatable-header-resizable-handle',
    )!;
    const headerRight = firstHeader.getBoundingClientRect().right;
    handle.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, clientX: headerRight }),
    );
    document.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: headerRight + 40,
      }),
    );
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await vi.waitFor(() =>
      expect(firstHeader.getBoundingClientRect().width).toBeGreaterThan(
        widthBefore,
      ),
    );
    const resizedWidth = firstHeader.getBoundingClientRect().width;
    await first.unmount();

    await render(renderTable('mapletip:test:domain-a'));
    const restoredHeader = document.querySelector<HTMLElement>(
      'thead th[data-accessor="group"]',
    )!;
    await vi.waitFor(() =>
      expect(
        Math.abs(restoredHeader.getBoundingClientRect().width - resizedWidth),
      ).toBeLessThanOrEqual(1),
    );
    const scopedKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith('mapletip:test:domain-a'),
    );
    expect(scopedKeys.length).toBeGreaterThan(0);
    expect(
      Object.keys(localStorage).some((key) =>
        key.startsWith('mapletip:test:domain-b'),
      ),
    ).toBe(false);
  });

  it('places retry below the error message', async () => {
    let retried = false;
    await render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={demoRecords}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <span>{record.name}</span>}
          facets={[]}
          error="The records could not be loaded."
          onRetry={() => {
            retried = true;
          }}
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

    const alert = document.querySelector<HTMLElement>('[role="alert"]')!;
    const message = [...alert.querySelectorAll<HTMLElement>('div')].find(
      (element) => element.textContent === 'The records could not be loaded.',
    )!;
    const retry = alert.querySelector<HTMLButtonElement>('button')!;
    expect(retry).not.toBeNull();
    expect(retry.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      message.getBoundingClientRect().bottom,
    );

    await userEvent.click(retry);
    expect(retried).toBe(true);
  });

  it('capitalizes the unavailable status copy', async () => {
    await render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={demoRecords}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <span>{record.name}</span>}
          facets={[]}
          unavailable="There are no records for this build."
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

    expect(page.getByText('Records are unavailable')).toBeVisible();
  });

  it('keeps the drawer boolean select compact instead of full width', async () => {
    await render(
      <Browser state={{ ...state, page: 1 }} onStateChange={() => {}} />,
    );
    await page.viewport(500, 900);
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();

    const imageAvailable = page.getByRole('combobox', {
      name: 'Image available',
    });
    const width = imageAvailable.element().getBoundingClientRect().width;
    const dialogWidth = document
      .querySelector('[role="dialog"]')!
      .getBoundingClientRect().width;

    expect(width).toBeGreaterThan(150);
    expect(width).toBeLessThan(dialogWidth * 0.6);
  });

  it('supports computed query fields without a table and rejects invalid ranges', async () => {
    await render(
      <Browser state={{ ...state, page: 1 }} onStateChange={() => {}} />,
    );
    await page.viewport(500, 900);
    await page
      .getByRole('button', { name: 'Filters, 0 active. Open all filters' })
      .click();
    await page.getByRole('combobox', { name: 'Image available' }).click();
    await page.getByRole('option', { name: /^Yes \(/u }).click();
    expect(
      page.getByRole('button', { name: /^Show \d+ records$/u }),
    ).toBeEnabled();

    const minimum = page.getByRole('textbox', { name: 'Value 1 minimum' });
    const maximum = page.getByRole('textbox', { name: 'Value 1 maximum' });
    await minimum.fill('90');
    await maximum.fill('10');
    expect(page.getByRole('button', { name: 'Show results' })).toBeDisabled();
    expect(page.getByText('Minimum must not exceed maximum.')).toBeVisible();
  });
});

describe('empty result guidance', () => {
  const emptyState = {
    search: '',
    filters: {},
    page: 1,
    pageSize: 20,
    hiddenColumns: [],
  } satisfies BrowseState;

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

  it('explains a genuinely empty dataset without a no-op clear action', async () => {
    await render(<EmptyBrowser records={[]} />);
    await vi.waitFor(() =>
      expect(page.getByText('No records available')).toBeVisible(),
    );
    expect(
      page.getByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument();
  });

  it('offers a clear action for filters with zero matches and resets once', async () => {
    const onStateChange = vi.fn();
    await render(
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
    await vi.waitFor(() =>
      expect(page.getByText('No records match')).toBeVisible(),
    );
    onStateChange.mockClear();
    await userEvent.click(
      page.getByRole('button', { name: 'Clear filters' }).nth(1),
    );
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: '', filters: {}, page: 1 }),
    );
  });

  it('offers a clear action for a zero-match search only', async () => {
    await render(
      <EmptyBrowser
        records={demoRecords}
        state={{ ...emptyState, search: 'no-such-record' }}
      />,
    );
    await vi.waitFor(() =>
      expect(page.getByText('No records match')).toBeVisible(),
    );
    expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
  });

  it('preserves a custom empty state', async () => {
    await render(
      <EmptyBrowser
        records={[]}
        customEmptyState={<p>Nothing has been recorded for this build.</p>}
      />,
    );
    expect(
      page.getByText('Nothing has been recorded for this build.'),
    ).toBeVisible();
    expect(
      page.getByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument();
  });
});
