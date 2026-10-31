import { composeStories } from '@storybook/react-vite';
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import * as stories from '@/components/FacetedBrowser/__stories__/FacetedBrowser.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

/** Stories composed with explicit scheme globals so the preview default cannot leak in. */
const light = composeStories(stories, {
  initialGlobals: { colorScheme: 'light' },
});
// Per-call annotations merge with the preview registered in the setup file.
const dark = composeStories(stories, {
  initialGlobals: { colorScheme: 'dark' },
});

/** Desktop comparison table; the browser only renders it at 992px and wider. */
const desktopTable = page.getByRole('table', { name: 'records comparison' });
/** Mobile card list; the browser only renders it below 992px. */
const mobileCards = page.getByRole('list', { name: 'records cards' });
const filterDrawer = page.getByRole('dialog');
/**
 * CSS-hidden elements are not in the accessibility tree, so `getByRole` needs
 * `includeHidden` to prove that the other presentation is *not* rendered.
 */
const hiddenTable = page.getByRole('table', {
  name: 'records comparison',
  includeHidden: true,
});
const hiddenCards = page.getByRole('list', {
  name: 'records cards',
  includeHidden: true,
});

const visualCases: readonly VisualCase[] = [
  {
    name: 'faceted-browser-desktop-light',
    story: light.Default,
    storyId: 'components-facetedbrowser--default',
    width: 1366,
    height: 768,
    visible: [desktopTable],
    hidden: [hiddenCards],
  },
  {
    name: 'faceted-browser-desktop-dark',
    story: dark.Default,
    storyId: 'components-facetedbrowser--default',
    width: 1366,
    height: 768,
    visible: [desktopTable],
    hidden: [hiddenCards],
  },
  {
    name: 'faceted-browser-active-light',
    story: light.Active,
    storyId: 'components-facetedbrowser--active',
    width: 1366,
    height: 768,
    visible: [desktopTable],
    hidden: [hiddenCards],
  },
  {
    name: 'faceted-browser-active-dark',
    story: dark.Active,
    storyId: 'components-facetedbrowser--active',
    width: 1366,
    height: 768,
    visible: [desktopTable],
    hidden: [hiddenCards],
  },
  {
    name: 'faceted-browser-focus-light',
    story: light.Default,
    storyId: 'components-facetedbrowser--default',
    width: 1366,
    height: 768,
    visible: [desktopTable],
    hidden: [hiddenCards],
    beforeScreenshot: async () => {
      await userEvent.tab();
      await userEvent.tab();
    },
  },
  {
    name: 'faceted-browser-focus-dark',
    story: dark.Default,
    storyId: 'components-facetedbrowser--default',
    width: 1366,
    height: 768,
    visible: [desktopTable],
    hidden: [hiddenCards],
    beforeScreenshot: async () => {
      await userEvent.tab();
      await userEvent.tab();
    },
  },
  {
    name: 'faceted-browser-mobile-cards-light',
    story: light.MobileCards,
    storyId: 'components-facetedbrowser--mobile-cards',
    width: 375,
    height: 812,
    visible: [mobileCards],
    hidden: [hiddenTable],
  },
  {
    name: 'faceted-browser-mobile-cards-dark',
    story: dark.MobileCards,
    storyId: 'components-facetedbrowser--mobile-cards',
    width: 375,
    height: 812,
    visible: [mobileCards],
    hidden: [hiddenTable],
  },
  {
    name: 'faceted-browser-mobile-cards-320-light',
    story: light.MobileCards,
    storyId: 'components-facetedbrowser--mobile-cards',
    width: 320,
    height: 640,
    visible: [mobileCards],
    hidden: [hiddenTable],
  },
  {
    name: 'faceted-browser-mobile-cards-320-dark',
    story: dark.MobileCards,
    storyId: 'components-facetedbrowser--mobile-cards',
    width: 320,
    height: 640,
    visible: [mobileCards],
    hidden: [hiddenTable],
  },
  {
    name: 'faceted-browser-filter-drawer-light',
    story: light.DrawerOpen,
    storyId: 'components-facetedbrowser--drawer-open',
    width: 500,
    height: 800,
    visible: [filterDrawer],
  },
  {
    name: 'faceted-browser-filter-drawer-dark',
    story: dark.DrawerOpen,
    storyId: 'components-facetedbrowser--drawer-open',
    width: 500,
    height: 800,
    visible: [filterDrawer],
  },
  {
    name: 'faceted-browser-empty-light',
    story: light.Empty,
    storyId: 'components-facetedbrowser--empty',
    width: 900,
    height: 768,
  },
  {
    name: 'faceted-browser-loading-light',
    story: light.Loading,
    storyId: 'components-facetedbrowser--loading',
    width: 1366,
    height: 768,
  },
  {
    name: 'faceted-browser-breakpoint-992',
    story: light.Default,
    storyId: 'components-facetedbrowser--default',
    width: 992,
    height: 768,
    visible: [desktopTable],
    hidden: [hiddenCards],
  },
  {
    name: 'faceted-browser-breakpoint-991',
    story: light.Default,
    storyId: 'components-facetedbrowser--default',
    width: 991,
    height: 768,
    visible: [mobileCards],
    hidden: [hiddenTable],
  },
];

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);

    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    for (const locator of visualCase.hidden ?? []) {
      await expect.element(locator).not.toBeVisible();
    }

    await expectApprovedScreenshot(visualCase);
  });
});
