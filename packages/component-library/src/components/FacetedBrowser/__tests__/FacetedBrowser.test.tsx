import { MantineProvider } from '@mantine/core';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import '@/styles.css';
import {
  Layout,
  type LayoutProps,
} from '@/components/FacetedBrowser/Layout/Layout';

const required: LayoutProps = {
  title: <h1>Things</h1>,
  resultsLabel: 'Results',
  table: <table aria-label="t" />,
  cards: <ul aria-label="c" />,
};

function mount(extra: Partial<LayoutProps> = {}) {
  const { container } = render(
    <MantineProvider>
      <Layout {...required} {...extra} />
    </MantineProvider>,
  );
  return container.querySelector<HTMLElement>(':scope > div')!;
}
const results = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('section[aria-label="Results"]')!;

describe('optional regions', () => {
  it('renders no empty wrapper when everything optional is omitted', () => {
    const root = mount();
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

  it('omitting the rail leaves no aside', () => {
    const root = mount();
    expect(root.querySelector('aside')).toBeNull();
  });

  it('omitting quickFacets leaves no wrapper for them', () => {
    const without = mount();
    const count = results(without).children.length;
    const withQuick = mount({
      quickFacets: <button type="button">Q</button>,
    });
    expect(results(withQuick).children.length).toBe(count + 1);
  });

  it('omitting toolbar and summary leaves no bar', () => {
    const root = mount();
    expect(results(root).querySelector('[class*="bar"]')).toBeNull();
    const withSummary = mount({ summary: <p>5 results</p> });
    expect(results(withSummary).querySelector('[class*="bar"]')).not.toBeNull();
  });

  it('renders the rail as a labelled aside when given', () => {
    const root = mount({ rail: <p>Facets</p>, railLabel: 'Filters' });
    const aside = root.querySelector('aside')!;
    expect(aside.getAttribute('aria-label')).toBe('Filters');
    expect(root.hasAttribute('data-has-rail')).toBe(true);
  });

  it('replaces the results with status', () => {
    const root = mount({ status: <p>Nothing here</p> });
    expect(results(root).textContent).toContain('Nothing here');
    expect(results(root).querySelector('table')).toBeNull();
    expect(results(root).querySelector('ul')).toBeNull();
  });

  it('places search below the heading and above the result count', () => {
    const root = mount({
      search: (
        <form role="search">
          <input aria-label="Search records" />
        </form>
      ),
      summary: <p>1–5 of 5 results</p>,
    });
    const header =
      results(root).querySelector<HTMLElement>('[class*="header"]')!;
    const search = results(root).querySelector<HTMLElement>('[role="search"]')!;
    const bar = results(root).querySelector<HTMLElement>('[class*="bar"]')!;

    // Search is its own row, not a compact control inside the heading row.
    expect(header.contains(search)).toBe(false);
    expect(
      header.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      search.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows the summary as polite text and preserves real links in slots', () => {
    const root = mount({
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

  it('renders domain-owned results directly without requiring a desktop table', () => {
    const root = mount({
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

  it('renders cards across all viewports when no comparison table is supplied', () => {
    const root = mount({
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

describe('fillHeight opt-in', () => {
  it('leaves the default layout content-sized', () => {
    const root = mount();
    expect(root.hasAttribute('data-fill-height')).toBe(false);
    expect(results(root).querySelector('[class*="tableRegion"]')).toBeNull();
  });
});
