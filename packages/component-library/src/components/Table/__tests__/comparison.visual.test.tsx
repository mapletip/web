import { composeStories } from '@storybook/react-vite';
import { test } from 'vitest';
import { page } from 'vitest/browser';

import * as stories from '@/components/Table/__stories__/ComparisonTable.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const light = composeStories(stories, {
  initialGlobals: { colorScheme: 'light' },
});
// Per-call annotations merge with the preview registered in the setup file.
const dark = composeStories(stories, {
  initialGlobals: { colorScheme: 'dark' },
});

const comparisonTable = page.getByRole('table', { name: 'Comparison records' });

/**
 * Overflow geometry alone does not prove the clipped columns are reachable:
 * `overflow-x: hidden` keeps the content wider than the viewport while making
 * ordinary scrolling impossible, and `clip` disables scrolling entirely. The
 * phone layout relies on Mantine's ScrollArea, so assert the overflow mode and
 * an actual scroll move, then restore the original position before capture.
 */
function assertTableScrollsHorizontally(): void {
  const table = document.querySelector(
    'table[aria-label="Comparison records"]',
  );
  if (table === null) {
    throw new Error('Comparison table is not rendered');
  }

  const viewport = table.closest('.mantine-ScrollArea-viewport');
  if (!(viewport instanceof HTMLElement)) {
    throw new Error('Comparison table has no scroll viewport');
  }

  if (viewport.scrollWidth <= viewport.clientWidth) {
    throw new Error(
      `Comparison table does not overflow its scroll viewport ` +
        `(${String(viewport.scrollWidth)}x${String(viewport.clientWidth)})`,
    );
  }

  const overflowX = getComputedStyle(viewport).overflowX;
  if (overflowX !== 'auto' && overflowX !== 'scroll') {
    throw new Error(
      `Comparison table scroll viewport has overflow-x: ${overflowX}, ` +
        'so clipped columns cannot be scrolled to by the user',
    );
  }

  // `behavior: 'instant'` ignores any smooth scrolling so the read below is final.
  const originalScrollLeft = viewport.scrollLeft;
  viewport.scrollTo({ left: 1, behavior: 'instant' });
  const scrolledTo = viewport.scrollLeft;
  viewport.scrollTo({ left: originalScrollLeft, behavior: 'instant' });

  if (scrolledTo === 0) {
    throw new Error(
      `Comparison table scroll viewport did not move when scrolled ` +
        `(overflow-x: ${overflowX}), so clipped columns are unreachable`,
    );
  }
}

const desktop: VisualCase = {
  name: 'comparison-table-desktop-light',
  story: light.ComparisonTable,
  storyId: 'components-table--comparison-table',
  width: 1366,
  height: 768,
  element: comparisonTable,
};

const desktopDark: VisualCase = {
  ...desktop,
  name: 'comparison-table-desktop-dark',
  story: dark.ComparisonTable,
};

const phoneOverflow: VisualCase = {
  name: 'comparison-table-mobile-overflow-light',
  story: light.ComparisonTable,
  storyId: 'components-table--comparison-table',
  width: 375,
  height: 812,
};

// Explicit tests rather than a case table: only the phone case also proves that
// the clipped columns stay reachable by scrolling.
test('comparison-table-desktop-light', async () => {
  await openVisualCase(desktop);
  await expectApprovedScreenshot(desktop);
});

test('comparison-table-desktop-dark', async () => {
  await openVisualCase(desktopDark);
  await expectApprovedScreenshot(desktopDark);
});

test('comparison-table-mobile-overflow-light', async () => {
  await openVisualCase(phoneOverflow);
  assertTableScrollsHorizontally();
  await expectApprovedScreenshot(phoneOverflow);
});
