import { expect, test } from 'playwright/test';

import { openStory } from './story';
import type { VisualCase } from './story';

/** Desktop comparison table; FacetedBrowser only renders it at 992px and wider. */
const DESKTOP_TABLE = 'table[aria-label="records comparison"]';
/** Mobile card list; FacetedBrowser only renders it below 992px. */
const MOBILE_CARDS = '[role="list"][aria-label="records cards"]';
const FILTER_DRAWER = '[role="dialog"]';

const TABLE_COMPONENT = 'table[aria-label="Records"]';
const COMPARISON_TABLE_COMPONENT = 'table[aria-label="Comparison records"]';

/**
 * Curated coverage matrix. Every entry earns its baseline:
 * - `faceted-browser-*`: the integrated public surface across desktop, mobile,
 *   drawer, empty and loading states in both schemes.
 * - `faceted-browser-breakpoint-*`: the 992px `md` boundary from both sides.
 * - `table-*` / `comparison-table-*`: the two public table renderers, including
 *   horizontal overflow at phone width.
 */
const visualCases: readonly VisualCase[] = [
  {
    name: 'faceted-browser-desktop-light',
    story: 'components-facetedbrowser--default',
    width: 1366,
    height: 768,
    colorScheme: 'light',
    visible: [DESKTOP_TABLE],
    hidden: [MOBILE_CARDS],
  },
  {
    name: 'faceted-browser-desktop-dark',
    story: 'components-facetedbrowser--default',
    width: 1366,
    height: 768,
    colorScheme: 'dark',
    visible: [DESKTOP_TABLE],
    hidden: [MOBILE_CARDS],
  },
  {
    name: 'faceted-browser-mobile-cards-light',
    story: 'components-facetedbrowser--mobile-cards',
    width: 375,
    height: 812,
    colorScheme: 'light',
    visible: [MOBILE_CARDS],
    hidden: [DESKTOP_TABLE],
  },
  {
    name: 'faceted-browser-mobile-cards-dark',
    story: 'components-facetedbrowser--mobile-cards',
    width: 375,
    height: 812,
    colorScheme: 'dark',
    visible: [MOBILE_CARDS],
    hidden: [DESKTOP_TABLE],
  },
  {
    name: 'faceted-browser-filter-drawer-light',
    story: 'components-facetedbrowser--drawer-open',
    width: 500,
    height: 800,
    colorScheme: 'light',
    visible: [FILTER_DRAWER],
  },
  {
    name: 'faceted-browser-filter-drawer-dark',
    story: 'components-facetedbrowser--drawer-open',
    width: 500,
    height: 800,
    colorScheme: 'dark',
    visible: [FILTER_DRAWER],
  },
  {
    name: 'faceted-browser-empty-light',
    story: 'components-facetedbrowser--empty',
    width: 900,
    height: 768,
    colorScheme: 'light',
  },
  {
    name: 'faceted-browser-loading-light',
    story: 'components-facetedbrowser--loading',
    width: 1366,
    height: 768,
    colorScheme: 'light',
  },
  {
    name: 'faceted-browser-breakpoint-992',
    story: 'components-facetedbrowser--default',
    width: 992,
    height: 768,
    colorScheme: 'light',
    visible: [DESKTOP_TABLE],
    hidden: [MOBILE_CARDS],
  },
  {
    name: 'faceted-browser-breakpoint-991',
    story: 'components-facetedbrowser--default',
    width: 991,
    height: 768,
    colorScheme: 'light',
    visible: [MOBILE_CARDS],
    hidden: [DESKTOP_TABLE],
  },
  {
    name: 'table-populated-light',
    story: 'components-table--table',
    width: 1366,
    height: 768,
    colorScheme: 'light',
    element: TABLE_COMPONENT,
  },
  {
    name: 'table-populated-dark',
    story: 'components-table--table',
    width: 1366,
    height: 768,
    colorScheme: 'dark',
    element: TABLE_COMPONENT,
  },
  {
    name: 'comparison-table-desktop-light',
    story: 'components-table--comparison-table',
    width: 1366,
    height: 768,
    colorScheme: 'light',
    element: COMPARISON_TABLE_COMPONENT,
  },
  {
    name: 'comparison-table-mobile-overflow-light',
    story: 'components-table--comparison-table',
    width: 375,
    height: 812,
    colorScheme: 'light',
  },
];

for (const visualCase of visualCases) {
  test(visualCase.name, async ({ page }) => {
    await openStory(page, visualCase);

    for (const selector of visualCase.visible ?? []) {
      await expect(page.locator(selector)).toBeVisible();
    }
    for (const selector of visualCase.hidden ?? []) {
      await expect(page.locator(selector)).toBeHidden();
    }

    const snapshot = `${visualCase.name}.png`;
    if (visualCase.element === undefined) {
      await expect(page).toHaveScreenshot(snapshot);
      return;
    }
    await expect(page.locator(visualCase.element)).toHaveScreenshot(snapshot);
  });
}
