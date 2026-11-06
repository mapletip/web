import { composeStories } from '@storybook/react-vite';
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import * as stories from '@/components/Footer/__stories__/Footer.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

// The preview forces MapleTip's single shipped dark scheme.
const dark = composeStories(stories);

const footer = page.getByRole('contentinfo');
const navigation = page.getByRole('navigation', {
  name: 'Footer navigation',
});

const visualCases: readonly VisualCase[] = [
  {
    name: 'footer-default-dark',
    story: dark.Default,
    storyId: 'components-footer--default',
    width: 1366,
    height: 768,
    element: footer,
    visible: [navigation],
  },
  {
    name: 'footer-default-375-dark',
    story: dark.Default,
    storyId: 'components-footer--default',
    width: 375,
    height: 812,
    element: footer,
    visible: [navigation],
  },
  {
    name: 'footer-default-320-dark',
    story: dark.Default,
    storyId: 'components-footer--default',
    width: 320,
    height: 640,
    element: footer,
    visible: [navigation],
  },
  {
    name: 'footer-navigation-heavy-dark',
    story: dark.NavigationHeavy,
    storyId: 'components-footer--navigation-heavy',
    width: 1366,
    height: 768,
    element: footer,
    visible: [navigation],
  },
  {
    name: 'footer-long-content-dark',
    story: dark.LongContent,
    storyId: 'components-footer--long-content',
    width: 375,
    height: 812,
    element: footer,
    visible: [navigation],
  },
  {
    name: 'footer-legal-links-dark',
    story: dark.LegalAndExternalLinks,
    storyId: 'components-footer--legal-and-external-links',
    width: 1080,
    height: 768,
    element: footer,
    visible: [page.getByRole('link', { name: 'privacy notice' })],
  },
];

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);

    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      visualCase.width,
    );

    await expectApprovedScreenshot(visualCase);
  });
});
