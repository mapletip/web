import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { FacetedBrowser, type BrowseState } from '@/components/FacetedBrowser';
import { NeutralBrowserMarkup } from '@/components/FacetedBrowser/__tests__/fixtures/NeutralBrowserMarkup';
import { demoRecords } from '@/fixtures/records';

describe('FacetedBrowser server rendering', () => {
  it('renders result links in both presentations and real pagination links without a DOM', () => {
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <NeutralBrowserMarkup />
      </MantineProvider>,
    );

    expect(html).toContain('<h1>Browse records</h1>');
    expect(html).toContain('aria-label="Records"');
    expect(html).toContain('Records sorted by value 1 descending');
    expect(html).toContain('aria-label="records pages"');
    expect(html).toContain('href="?page=1"');
    expect(html).toContain('href="?page=2"');
    expect(html.match(/href="\/records\/record-/gu)).toHaveLength(200);
    expect(html).toContain('Record 099');
  });

  it('renders an integrated card-only browser without dummy columns in Node', () => {
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <FacetedBrowser
          title={<h1>Live Browser</h1>}
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

    expect(html).toContain('Live Browser');
    expect(html).not.toContain('<table');
    expect(html).toContain('Record 001');
    expect(html).toContain('href="/records/record-001"');
  });

  it('renders normalized filter counts and chips for controlled state during SSR', () => {
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <FacetedBrowser
          title={<h1>Normalized filters</h1>}
          records={demoRecords.slice(0, 10)}
          idAccessor="id"
          queryFields={['group']}
          facets={[
            {
              id: 'category',
              field: 'group',
              label: 'Category',
              kind: 'multi-select',
              quick: true,
              options: [{ value: 'Alpha', label: 'Alpha' }],
            },
          ]}
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          state={
            {
              search: '',
              filters: {
                obsolete: ['legacy'],
                group: ['not-an-option'],
              },
              page: 1,
              pageSize: 10,
              hiddenColumns: [],
            } satisfies BrowseState
          }
          onStateChange={() => undefined}
        />
      </MantineProvider>,
    );

    expect(html).toContain('aria-label="Filters, 0 active. Open all filters"');
    expect(html).toContain('aria-label="Category. Open Category filters"');
    expect(html).not.toContain('aria-label="Category, 1 active filter.');
    expect(html).not.toContain('Remove Category: not-an-option');
    expect(html).not.toContain('not-an-option');
  });

  it('renders clamped rows, page number, and window during SSR when page is out of range', () => {
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <FacetedBrowser
          title={<h1>Clamped Browser</h1>}
          records={demoRecords.slice(0, 5)}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          state={{
            search: '',
            filters: {},
            page: 999,
            pageSize: 2,
            hiddenColumns: [],
          }}
          onStateChange={() => undefined}
        />
      </MantineProvider>,
    );

    // demoRecords.slice(0, 5) with pageSize: 2 has 3 pages:
    // page 1: Record 001, Record 002
    // page 2: Record 003, Record 004
    // page 3: Record 005
    // Page 999 must clamp to page 3 during SSR (not render 0 rows)
    expect(html).toContain('Clamped Browser');
    expect(html).toContain('Record 005');
    expect(html).not.toContain('Record 001');
    // Summary text must show window for page 3: 5–5 of 5
    expect(html).toContain('5–5 of 5 records');
  });

  it('fails clearly when a typed facet uses an unregistered query field', () => {
    expect(() =>
      renderToString(
        <MantineProvider theme={theme} forceColorScheme="dark">
          <FacetedBrowser
            title={<h1>Invalid browser</h1>}
            records={demoRecords.slice(0, 10)}
            idAccessor="id"
            presentation="cards"
            renderCard={(record) => <a href={record.href}>{record.name}</a>}
            facets={[
              {
                id: 'missing',
                field: 'notRegistered',
                label: 'Missing',
                kind: 'multi-select',
              },
            ]}
            defaultState={{
              search: '',
              filters: {},
              page: 1,
              pageSize: 10,
              hiddenColumns: [],
            }}
          />
        </MantineProvider>,
      ),
    ).toThrow('unregistered query field');
  });

  it('hides the toolbar sort select below md via the responsive mechanism while keeping the drawer closed during SSR', () => {
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <FacetedBrowser
          title={<h1>Sort SSR</h1>}
          records={demoRecords.slice(0, 5)}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <div>{record.name}</div>}
          sortOptions={[
            { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
            { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
          ]}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 10,
            hiddenColumns: [],
            sort: { field: 'name', direction: 'asc' },
          }}
        />
      </MantineProvider>,
    );

    expect(html).toContain('mantine-visible-from-md');
    expect(html).toContain('aria-label="Sort records"');
    expect(html).not.toContain('role="dialog"');
  });
});
