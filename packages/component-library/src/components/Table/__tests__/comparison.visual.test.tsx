import { composeStories } from '@storybook/react-vite';
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';

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

const hoverScrolledLight: VisualCase = {
  name: 'comparison-table-hover-scrolled-light',
  story: light.ComparisonTable,
  storyId: 'components-table--comparison-table',
  width: 1366,
  height: 768,
};

const hoverScrolledDark: VisualCase = {
  ...hoverScrolledLight,
  name: 'comparison-table-hover-scrolled-dark',
  story: dark.ComparisonTable,
};

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

/**
 * Scroll a bounded comparison table to its bottom-right extent, then hover a
 * non-pinned column. Asserts the painted state: the pinned identity stays at the
 * scrollport edge, the hovered column has the full-height overlay, adjacent and
 * pinned cells do not, and the overlay does not grow the scroll region.
 */
async function hoverColumnAfterScrolling(): Promise<void> {
  const viewport = document.querySelector<HTMLElement>(
    '[data-scrollarea-viewport="true"]',
  );
  const table = document.querySelector(
    'table[aria-label="Comparison records"]',
  );
  if (viewport === null || table === null) {
    throw new Error('Comparison table is not rendered');
  }

  viewport.scrollLeft = viewport.scrollWidth;
  viewport.scrollTop = viewport.scrollHeight;
  await nextFrame();

  const row = document.querySelector<HTMLTableRowElement>(
    'tbody tr:last-child',
  );
  if (row === null) throw new Error('Comparison table has no body rows');
  const cells = [...row.querySelectorAll<HTMLTableCellElement>('td')];
  const hovered = cells[4];
  const previous = cells[3];
  const following = cells[5];
  const pinned = row.querySelector<HTMLTableCellElement>('td[data-pinned]');
  const header = document.querySelector<HTMLElement>('thead');
  if (
    hovered === undefined ||
    previous === undefined ||
    following === undefined ||
    pinned === null ||
    header === null
  ) {
    throw new Error('Comparison table cells are incomplete');
  }

  const before = {
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop,
    scrollWidth: viewport.scrollWidth,
    scrollHeight: viewport.scrollHeight,
  };
  expect(before.scrollLeft).toBeGreaterThan(0);
  expect(before.scrollTop).toBeGreaterThan(0);

  await userEvent.hover(hovered);
  await nextFrame();

  expect(viewport.scrollLeft).toBeGreaterThan(0);
  expect(viewport.scrollTop).toBeGreaterThan(0);
  expect(getComputedStyle(row).backgroundColor).not.toBe('transparent');

  const overlay = getComputedStyle(hovered, '::before');
  expect(overlay.content).toBe('""');
  expect(overlay.left).toBe('0px');
  expect(overlay.right).toBe('0px');
  expect(getComputedStyle(previous, '::before').content).toBe('none');
  expect(getComputedStyle(following, '::before').content).toBe('none');
  expect(getComputedStyle(pinned, '::before').content).toBe('none');

  expect(
    Math.abs(
      pinned.getBoundingClientRect().left -
        viewport.getBoundingClientRect().left,
    ),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      header.getBoundingClientRect().top - viewport.getBoundingClientRect().top,
    ),
  ).toBeLessThanOrEqual(1);
  expect(hovered.getBoundingClientRect().left).toBeGreaterThan(
    pinned.getBoundingClientRect().right,
  );

  // overflow-y: clip must contain the taller column overlay, not grow the
  // scrollport or introduce an inner horizontal scroll container.
  expect({
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop,
    scrollWidth: viewport.scrollWidth,
    scrollHeight: viewport.scrollHeight,
  }).toEqual(before);
  expect(getComputedStyle(table).overflowX).toBe('visible');
}

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

test('comparison-table-hover-scrolled-light', async () => {
  await openVisualCase(hoverScrolledLight);
  await hoverColumnAfterScrolling();
  await expectApprovedScreenshot(hoverScrolledLight);
});

test('comparison-table-hover-scrolled-dark', async () => {
  await openVisualCase(hoverScrolledDark);
  await hoverColumnAfterScrolling();
  await expectApprovedScreenshot(hoverScrolledDark);
});
