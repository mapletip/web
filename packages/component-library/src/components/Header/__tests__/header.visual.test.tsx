import { composeStories } from '@storybook/react-vite';
import { describe, expect, test } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';

import * as stories from '@/components/Header/__stories__/Header.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

// The preview forces MapleTip's single shipped dark scheme.
const dark = composeStories(stories);

const header = page.getByRole('banner');
const desktopNavigation = page.getByRole('navigation', {
  name: 'Primary navigation',
});
const hiddenDesktopNavigation = page.getByRole('navigation', {
  name: 'Primary navigation',
  includeHidden: true,
});
const openNavigation = page.getByRole('button', {
  name: 'Open navigation',
  includeHidden: true,
});
const showCollections = page.getByRole('button', { name: 'Collections' });
const maps = page.getByRole('link', { name: 'Maps' });
const drawer = page.getByRole('dialog', { name: 'Navigation' });

const visualCases: readonly VisualCase[] = [
  {
    name: 'header-desktop-dark',
    story: dark.Default,
    storyId: 'components-header--default',
    width: 1366,
    height: 768,
    element: header,
    visible: [desktopNavigation],
    hidden: [openNavigation],
  },
  {
    name: 'header-focus-adjacent-hover-dark',
    story: dark.Default,
    storyId: 'components-header--default',
    width: 1366,
    height: 768,
    element: header,
    beforeScreenshot: async () => {
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      if (document.activeElement?.textContent !== 'Field guide') {
        throw new Error('Field guide did not receive keyboard focus');
      }
      await userEvent.hover(page.getByRole('button', { name: 'Collections' }));
    },
    afterScreenshot: async () => {
      await commands.movePointer(-1, -1);
    },
  },
  {
    name: 'header-group-focus-adjacent-hover-dark',
    story: dark.Default,
    storyId: 'components-header--default',
    width: 1366,
    height: 768,
    element: header,
    beforeScreenshot: async () => {
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      if (document.activeElement?.textContent !== 'Collections') {
        throw new Error('Collections trigger did not receive keyboard focus');
      }
      await userEvent.hover(page.getByRole('link', { name: 'Journal' }));
    },
    afterScreenshot: async () => {
      await commands.movePointer(-1, -1);
    },
  },
  {
    name: 'header-active-dark',
    story: dark.ActiveDestination,
    storyId: 'components-header--active-destination',
    width: 1080,
    height: 768,
    element: header,
    visible: [desktopNavigation],
  },
  {
    name: 'header-grouped-open-dark',
    story: dark.GroupedNavigationOpen,
    storyId: 'components-header--grouped-navigation-open',
    width: 1080,
    height: 768,
    beforeScreenshot: async () => {
      await userEvent.click(showCollections);
    },
    visible: [maps],
  },
  {
    name: 'header-detailed-open-dark',
    story: dark.DetailedNavigationOpen,
    storyId: 'components-header--detailed-navigation-open',
    width: 1366,
    height: 768,
    beforeScreenshot: async () => {
      await userEvent.click(page.getByRole('button', { name: 'Library' }));
    },
    visible: [
      page.getByRole('heading', { name: 'Library' }),
      page.getByRole('button', { name: 'Close Library navigation' }),
    ],
  },
  {
    name: 'header-detailed-open-1080-dark',
    story: dark.DetailedNavigationOpen,
    storyId: 'components-header--detailed-navigation-open',
    width: 1080,
    height: 768,
    beforeScreenshot: async () => {
      await userEvent.click(page.getByRole('button', { name: 'Library' }));
    },
    visible: [page.getByRole('heading', { name: 'Library' })],
  },
  {
    name: 'header-detailed-partial-dark',
    story: dark.DetailedPartialMetadata,
    storyId: 'components-header--detailed-partial-metadata',
    width: 1080,
    height: 768,
    beforeScreenshot: async () => {
      await userEvent.click(page.getByRole('button', { name: 'Library' }));
    },
    visible: [page.getByRole('heading', { name: 'Library' })],
  },
  {
    name: 'header-detailed-long-dark',
    story: dark.DetailedLongLabels,
    storyId: 'components-header--detailed-long-labels',
    width: 1080,
    height: 768,
    beforeScreenshot: async () => {
      await userEvent.click(
        page.getByRole('button', { name: 'Library and special collections' }),
      );
    },
    visible: [
      page.getByRole('heading', { name: 'Library and special collections' }),
    ],
  },
  {
    name: 'header-detailed-phone-drawer-open-dark',
    story: dark.DetailedMobileNavigationOpen,
    storyId: 'components-header--detailed-mobile-navigation-open',
    width: 375,
    height: 812,
    beforeScreenshot: async () => {
      await userEvent.click(openNavigation);
    },
    visible: [drawer],
  },
  {
    name: 'header-detailed-320-drawer-open-dark',
    story: dark.DetailedMobileNavigationOpen,
    storyId: 'components-header--detailed-mobile-navigation-open',
    width: 320,
    height: 640,
    beforeScreenshot: async () => {
      await userEvent.click(openNavigation);
    },
    visible: [drawer],
  },
  {
    name: 'header-long-labels-dark',
    story: dark.LongLabels,
    storyId: 'components-header--long-labels',
    width: 1080,
    height: 768,
    element: header,
    visible: [desktopNavigation],
  },
  {
    name: 'header-phone-closed-dark',
    story: dark.Default,
    storyId: 'components-header--default',
    width: 375,
    height: 812,
    element: header,
    visible: [openNavigation],
    hidden: [hiddenDesktopNavigation],
  },
  {
    name: 'header-phone-drawer-open-dark',
    story: dark.Default,
    storyId: 'components-header--default',
    width: 375,
    height: 812,
    beforeScreenshot: async () => {
      await userEvent.click(openNavigation);
    },
    visible: [drawer],
  },
  {
    name: 'header-320-drawer-open-dark',
    story: dark.Default,
    storyId: 'components-header--default',
    width: 320,
    height: 640,
    beforeScreenshot: async () => {
      await userEvent.click(openNavigation);
    },
    visible: [drawer],
  },
  {
    name: 'header-breakpoint-991-dark',
    story: dark.Default,
    storyId: 'components-header--default',
    width: 991,
    height: 768,
    element: header,
    visible: [openNavigation],
    hidden: [hiddenDesktopNavigation],
  },
  {
    name: 'header-breakpoint-992-dark',
    story: dark.Default,
    storyId: 'components-header--default',
    width: 992,
    height: 768,
    element: header,
    visible: [desktopNavigation],
    hidden: [openNavigation],
  },
  {
    name: 'header-wide-dark',
    story: dark.Default,
    storyId: 'components-header--default',
    width: 1920,
    height: 1080,
    element: header,
    visible: [desktopNavigation],
  },
  {
    name: 'header-mobile-group-collapsed-dark',
    story: dark.MobileGroupCollapsed,
    storyId: 'components-header--mobile-group-collapsed',
    width: 375,
    height: 812,
    beforeScreenshot: async () => {
      await userEvent.click(openNavigation);
    },
    visible: [drawer],
  },
  {
    name: 'header-mobile-group-expanded-dark',
    story: dark.MobileGroupExpanded,
    storyId: 'components-header--mobile-group-expanded',
    width: 375,
    height: 812,
    beforeScreenshot: async () => {
      await userEvent.click(openNavigation);
      await userEvent.click(page.getByRole('button', { name: 'Library' }));
    },
    visible: [drawer],
  },
  {
    name: 'header-mobile-group-expanded-320-dark',
    story: dark.MobileGroupExpanded,
    storyId: 'components-header--mobile-group-expanded',
    width: 320,
    height: 640,
    beforeScreenshot: async () => {
      await userEvent.click(openNavigation);
      await userEvent.click(page.getByRole('button', { name: 'Library' }));
    },
    visible: [drawer],
  },
  {
    name: 'header-mobile-compact-group-dark',
    story: dark.MobileCompactGroup,
    storyId: 'components-header--mobile-compact-group',
    width: 375,
    height: 812,
    beforeScreenshot: async () => {
      await userEvent.click(openNavigation);
      await userEvent.click(page.getByRole('button', { name: 'Collections' }));
    },
    visible: [drawer],
  },
];

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await visualCase.beforeScreenshot?.();

    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    for (const locator of visualCase.hidden ?? []) {
      await expect.element(locator).not.toBeVisible();
    }

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      visualCase.width,
    );

    const screenshotCase = { ...visualCase };
    delete screenshotCase.beforeScreenshot;
    await expectApprovedScreenshot(screenshotCase);
  });
});
