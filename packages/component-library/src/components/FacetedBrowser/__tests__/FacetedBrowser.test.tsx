import { MantineProvider } from '@mantine/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import {
  Layout,
  type LayoutProps,
} from '@/components/FacetedBrowser/Layout/Layout';
import { ComparisonTable } from '@/components/Table/ComparisonTable';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

const required: LayoutProps = {
  title: <h1>Things</h1>,
  resultsLabel: 'Results',
  table: <table aria-label="t" />,
  cards: <ul aria-label="c" />,
};

async function mount(extra: Partial<LayoutProps> = {}) {
  const { container } = await render(
    <MantineProvider>
      <Layout {...required} {...extra} />
    </MantineProvider>,
  );
  return container.querySelector<HTMLElement>(':scope > div')!;
}
const results = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('section[aria-label="Results"]')!;

describe('optional regions', () => {
  it('renders no empty wrapper when everything optional is omitted', async () => {
    const root = await mount();
    expect(root.querySelector('aside')).toBeNull();
    expect(root.hasAttribute('data-has-rail')).toBe(false);
    // header, table wrapper, cards wrapper: nothing else.
    expect(results(root).children).toHaveLength(3);
    for (const child of results(root).children) {
      expect(child.textContent === '' && child.children.length === 0).toBe(
        false,
      );
    }
  });

  it('omitting the rail leaves no aside and one column', async () => {
    const root = await mount();
    expect(root.querySelector('aside')).toBeNull();
    expect(getComputedStyle(root).gridTemplateColumns).not.toContain(' ');
  });

  it('omitting quickFacets leaves no wrapper for them', async () => {
    const without = await mount();
    const count = results(without).children.length;
    const withQuick = await mount({
      quickFacets: <button type="button">Q</button>,
    });
    expect(results(withQuick).children.length).toBe(count + 1);
  });

  it('omitting toolbar and summary leaves no bar', async () => {
    const root = await mount();
    expect(results(root).querySelector('[class*="bar"]')).toBeNull();
    const withSummary = await mount({ summary: <p>5 results</p> });
    expect(results(withSummary).querySelector('[class*="bar"]')).not.toBeNull();
  });

  it('renders the rail as a labelled aside when given', async () => {
    const root = await mount({ rail: <p>Facets</p>, railLabel: 'Filters' });
    const aside = root.querySelector('aside')!;
    expect(aside.getAttribute('aria-label')).toBe('Filters');
    expect(root.hasAttribute('data-has-rail')).toBe(true);
  });

  it('replaces the results with status', async () => {
    const root = await mount({ status: <p>Nothing here</p> });
    expect(results(root).textContent).toContain('Nothing here');
    expect(results(root).querySelector('table')).toBeNull();
    expect(results(root).querySelector('ul')).toBeNull();
  });

  it('switches presentations at 992 px across all specified responsive viewports', async () => {
    const component = await mount({
      rail: <p>Facets</p>,
      railLabel: 'Filters',
      quickFacets: <button type="button">Quick facet</button>,
    });
    const table = component.querySelector('table[aria-label="t"]')!;
    const cards = component.querySelector('ul[aria-label="c"]')!;

    // Mobile viewports: cards + quick facets active, table + rail inactive
    for (const width of [320, 375, 500, 768, 991]) {
      await page.viewport(width, 700);
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
      expect(getComputedStyle(component).gridTemplateColumns).not.toContain(
        '240px',
      );
      expect(table.getClientRects()).toHaveLength(0);
      expect(cards.getClientRects().length).toBeGreaterThan(0);
    }

    // Desktop viewports: table + rail active, cards + quick facets inactive
    for (const width of [992, 1024, 1440]) {
      await page.viewport(width, 768);
      expect(getComputedStyle(component).gridTemplateColumns).toContain(
        '240px',
      );
      expect(component.querySelector('aside')?.getAttribute('aria-label')).toBe(
        'Filters',
      );
      expect(table.getClientRects().length).toBeGreaterThan(0);
      expect(cards.getClientRects()).toHaveLength(0);
    }
  });

  it('scrolls wide results inside the table at desktop widths', async () => {
    await page.viewport(1366, 768);
    const { container } = await render(
      <MantineProvider>
        <Layout
          title={<h1>Records</h1>}
          rail={<p>Categories</p>}
          railLabel="Filters"
          resultsLabel="Records"
          table={
            <div style={{ height: 480, minWidth: 0 }}>
              <ComparisonTable
                ariaLabel="Records"
                records={demoRecords.slice(0, 12)}
                columns={makeDemoColumns()}
                idAccessor="id"
                identityField="name"
                height="100%"
                maxHeight={480}
              />
            </div>
          }
          cards={<ul aria-label="Record cards" />}
        />
      </MantineProvider>,
    );
    const scrollArea = container.querySelector<HTMLElement>(
      '[data-scrollarea-viewport="true"]',
    )!;
    expect(scrollArea.clientWidth).toBeLessThan(1452);
    expect(scrollArea.scrollWidth).toBeGreaterThan(scrollArea.clientWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(1366);

    const leftBeforeScroll = scrollArea.getBoundingClientRect().left;
    scrollArea.scrollLeft = 160;
    expect(scrollArea.scrollLeft).toBeGreaterThan(0);
    const identity = container.querySelector<HTMLTableCellElement>(
      'tbody tr:first-child :first-child',
    )!;
    expect(
      Math.abs(identity.getBoundingClientRect().left - leftBeforeScroll),
    ).toBeLessThanOrEqual(1);
  });

  it('shows the summary as polite text and preserves real links in slots', async () => {
    const root = await mount({
      search: (
        <form role="search">
          <input aria-label="Search records" />
        </form>
      ),
      activeFilters: <p>One filter is active</p>,
      summary: <p aria-live="polite">1–5 of 5 results</p>,
      toolbar: <button type="button">Columns</button>,
      table: <a href="/records/one">First result</a>,
      cards: <a href="/records/one">First result card</a>,
      pagination: <a href="?page=2">Next page</a>,
    });
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toBe(
      '1–5 of 5 results',
    );
    expect(root.querySelector('[role="search"] input')).not.toBeNull();
    expect(root.textContent).toContain('One filter is active');
    expect(root.querySelector('button')?.textContent).toBe('Columns');
    expect(root.querySelector('a[href="/records/one"]')).not.toBeNull();
    expect(root.querySelector('a[href="?page=2"]')).not.toBeNull();
  });

  it('renders domain-owned results directly without requiring a desktop table', async () => {
    const root = await mount({
      table: undefined,
      cards: undefined,
      results: (
        <div data-testid="map-minimap-cards">Minimap discovery cards</div>
      ),
    });
    expect(
      root.querySelector('[data-testid="map-minimap-cards"]')?.textContent,
    ).toBe('Minimap discovery cards');
    // Does not create dual-presentation wrappers
    expect(root.querySelector('.mantine-visible-from-md')).toBeNull();
  });

  it('renders cards across all viewports when no comparison table is supplied', async () => {
    const root = await mount({
      table: undefined,
      cards: (
        <ul data-testid="card-only-list">
          <li>Card 1</li>
        </ul>
      ),
    });
    expect(
      root.querySelector('[data-testid="card-only-list"]')?.textContent,
    ).toBe('Card 1');
    expect(root.querySelector('.mantine-visible-from-md')).toBeNull();
  });
});
