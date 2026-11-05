import { MantineProvider } from '@mantine/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { QuickFacets } from '@/components/FacetedBrowser/QuickFacets/QuickFacets';

/** Real overflow/scroll behavior; labels and counts are jsdom component tests. */
describe('QuickFacets in a real browser', () => {
  it('keeps a long row inside its own horizontal scroll area', async () => {
    await page.viewport(320, 640);
    await render(
      <MantineProvider>
        <QuickFacets
          activeTotal={0}
          facets={Array.from({ length: 12 }, (_, index) => ({
            id: `facet-${index}`,
            label: `Facet ${index + 1}`,
            active: 0,
          }))}
          onOpen={() => undefined}
        />
      </MantineProvider>,
    );
    const region = page.getByRole('region', { name: 'Quick filters' });
    const scroller = region
      .element()
      .querySelector<HTMLElement>('.mantine-Scroller-container')!;
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
  });
});
