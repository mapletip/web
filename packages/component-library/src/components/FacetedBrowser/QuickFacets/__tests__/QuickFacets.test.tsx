import { MantineProvider } from '@mantine/core';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { QuickFacets } from '@/components/FacetedBrowser/QuickFacets/QuickFacets';

describe('QuickFacets', () => {
  it('reports the selected section and active count accessibly', async () => {
    const onOpen = vi.fn();
    await render(
      <MantineProvider>
        <QuickFacets
          activeTotal={2}
          facets={[{ id: 'group', label: 'Group', active: 2 }]}
          onOpen={onOpen}
        />
      </MantineProvider>,
    );

    await userEvent.click(
      page.getByRole('button', {
        name: 'Group, 2 active filters. Open Group filters',
      }),
    );
    expect(onOpen).toHaveBeenCalledWith('group');
    await userEvent.click(
      page.getByRole('button', { name: 'Filters, 2 active. Open all filters' }),
    );
    expect(onOpen).toHaveBeenLastCalledWith(null);
  });

  it('keeps each facet shortcut reachable by keyboard', async () => {
    await render(
      <MantineProvider>
        <QuickFacets
          activeTotal={0}
          facets={[
            { id: 'group', label: 'Group', active: 0 },
            { id: 'range', label: 'Value range', active: 0 },
          ]}
          onOpen={() => undefined}
        />
      </MantineProvider>,
    );
    const buttons = [
      page.getByRole('button', { name: 'Filters, 0 active. Open all filters' }),
      page.getByRole('button', { name: 'Group. Open Group filters' }),
      page.getByRole('button', {
        name: 'Value range. Open Value range filters',
      }),
    ];
    buttons[0]!.element().focus();
    for (const target of buttons.slice(1)) {
      await userEvent.tab();
      expect(document.activeElement).toBe(target.element());
    }
  });

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
    const region = page
      .getByRole('region', { name: 'Quick filters' })
      .element();
    const scroller = region.querySelector<HTMLElement>(
      '.mantine-Scroller-container',
    )!;
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
  });
});
