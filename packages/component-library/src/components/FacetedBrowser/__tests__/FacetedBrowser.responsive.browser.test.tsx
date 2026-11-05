import { MantineProvider } from '@mantine/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import {
  Layout,
  type LayoutProps,
} from '@/components/FacetedBrowser/Layout/Layout';

/**
 * Deliberately small: real layout is the only thing these prove. The Layout's
 * structure and optional regions are covered by the jsdom component suite.
 */
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

describe('FacetedBrowser layout in a real browser', () => {
  it('switches presentation at the 992px boundary', async () => {
    const component = await mount({
      rail: <p>Facets</p>,
      railLabel: 'Filters',
    });
    const table = component.querySelector('table[aria-label="t"]')!;
    const cards = component.querySelector('ul[aria-label="c"]')!;

    await page.viewport(991, 700);
    expect(table.getClientRects()).toHaveLength(0);
    expect(cards.getClientRects().length).toBeGreaterThan(0);

    await page.viewport(992, 768);
    expect(table.getClientRects().length).toBeGreaterThan(0);
    expect(cards.getClientRects()).toHaveLength(0);
    expect(getComputedStyle(component).gridTemplateColumns).toContain('240px');
  });
});
