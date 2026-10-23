import { MantineProvider } from '@mantine/core';
import { renderToString } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../styles.css';
import { theme } from '../../theme';

import { createSpikeMonsters } from './fixtures';
import {
  loadComparisonGrid,
  ResponsiveResultsProbe,
} from './ResponsiveResultsProbe';

const records = createSpikeMonsters(100);

function probe(loader: typeof loadComparisonGrid) {
  return (
    <MantineProvider theme={theme}>
      <ResponsiveResultsProbe records={records} loader={loader} />
    </MantineProvider>
  );
}

describe('Rendering strategy probe (D2) and import boundary (D4)', () => {
  test('server render contains every card link and no grid, without requesting the grid module', () => {
    const loader = vi.fn(loadComparisonGrid);
    const html = renderToString(probe(loader));
    const links = html.match(/href="\/monsters\/[^"]+"/gu) ?? [];
    console.info(
      `[spike] SSR html=${html.length} chars, entity links=${links.length}`,
    );
    expect(links).toHaveLength(100);
    expect(html).not.toContain('ag-');
    expect(loader).not.toHaveBeenCalled();
  });

  test('mobile (375px): cards visible, grid never mounted, grid module never requested', async () => {
    await page.viewport(375, 812);
    const loader = vi.fn(loadComparisonGrid);
    const screen = await render(probe(loader));
    await expect
      .element(screen.getByRole('list', { name: 'Monster results' }))
      .toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(screen.container.querySelector('[role="grid"]')).toBeNull();
    expect(loader).not.toHaveBeenCalled();
  });

  test('desktop (1440px): grid module requested once and mounted; cards hidden by CSS', async () => {
    await page.viewport(1440, 900);
    const loader = vi.fn(loadComparisonGrid);
    const screen = await render(probe(loader));
    await vi.waitFor(
      () =>
        expect(screen.container.querySelector('[role="grid"]')).not.toBeNull(),
      {
        timeout: 5000,
      },
    );
    expect(loader).toHaveBeenCalledOnce();
    const cards = screen.container.querySelector(
      'ul[aria-label="Monster results"]',
    )!;
    expect(getComputedStyle(cards).display).toBe('none');
  });
});
