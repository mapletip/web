import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { ComparisonTable } from '@/components/Table';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

beforeEach(async () => {
  document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
  await page.viewport(320, 640);
});

/**
 * DataTable's ScrollArea defaults to `type="hover"`, which leaves both scrollbars
 * at `display: none` until the pointer enters the region. A clipped comparison
 * table became effectively unreachable on touch and keyboard-only input, so the
 * scrollbars must be present at rest whenever the content overflows.
 */
describe('Table scrollbars', () => {
  it('shows the horizontal scrollbar at rest when the comparison table overflows', async () => {
    await render(
      <MantineProvider theme={theme}>
        <ComparisonTable
          ariaLabel="Overflowing comparison"
          records={demoRecords.slice(0, 12)}
          columns={makeDemoColumns()}
          idAccessor="id"
          identityField="name"
          maxHeight={480}
          onSortChange={() => undefined}
        />
      </MantineProvider>,
    );

    // Scope to the table's own ScrollArea. Other, non-overflowing ScrollAreas
    // mount their scrollbars too, and under `type="auto"` those correctly stay
    // hidden — asserting on the first one in the document proves nothing.
    const table = document.querySelector(
      'table[aria-label="Overflowing comparison"]',
    );
    expect(table).not.toBeNull();

    const viewport = table!.closest<HTMLElement>(
      '[data-scrollarea-viewport="true"]',
    );
    expect(viewport).not.toBeNull();
    expect(viewport!.scrollWidth).toBeGreaterThan(viewport!.clientWidth);

    const scrollArea = viewport!.closest<HTMLElement>(
      '.mantine-ScrollArea-root',
    );
    expect(scrollArea).not.toBeNull();

    // No hover, no pointer movement: the scrollbar must paint on its own.
    // Mantine resolves `auto` visibility through a debounced resize observer,
    // so poll for the state instead of reading it once on mount.
    const scrollbar = await vi.waitFor(() => {
      const element = scrollArea!.querySelector<HTMLElement>(
        '.mantine-ScrollArea-scrollbar[data-orientation="horizontal"]',
      );
      if (element === null) {
        throw new Error('horizontal scrollbar is not mounted');
      }
      const state = element.getAttribute('data-state');
      if (state !== 'visible') {
        throw new Error(`horizontal scrollbar is "${String(state)}"`);
      }
      return element;
    });

    expect(getComputedStyle(scrollbar).display).not.toBe('none');
  });
});
