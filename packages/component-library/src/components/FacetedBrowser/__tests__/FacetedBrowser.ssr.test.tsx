import { MantineProvider } from '@mantine/core';
import { gzipSync } from 'node:zlib';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { NeutralBrowserMarkup } from '@/components/FacetedBrowser/__tests__/fixtures/NeutralBrowserMarkup';
import { FacetedBrowser } from '@/components/FacetedBrowser/FacetedBrowser';
import { demoRecords } from '@/fixtures/records';
import { theme } from '@/theme';

describe('FacetedBrowser server rendering', () => {
  it('renders result links in both presentations and real pagination links without a DOM', () => {
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="light">
        <NeutralBrowserMarkup />
      </MantineProvider>,
    );

    const rawBytes = Buffer.byteLength(html, 'utf8');
    const gzipBytes = gzipSync(Buffer.from(html, 'utf8')).length;
    const tagCount = (html.match(/<[a-zA-Z0-9-]+/gu) ?? []).length;
    console.log(
      `[SSR Performance Measurement] HTML raw: ${(rawBytes / 1024).toFixed(1)} KB (${rawBytes} B) | gzip: ${(gzipBytes / 1024).toFixed(1)} KB (${gzipBytes} B) | DOM elements: ${tagCount}`,
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
      <MantineProvider theme={theme} forceColorScheme="light">
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

  it('fails clearly when a typed facet uses an unregistered query field', () => {
    expect(() =>
      renderToString(
        <MantineProvider theme={theme} forceColorScheme="light">
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
});
