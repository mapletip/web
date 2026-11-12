import { composeStories } from '@storybook/react-vite';
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import * as stories from '@/components/FactSheet/__stories__/FactSheet.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

// The preview forces MapleTip's single shipped dark scheme.
const dark = composeStories(stories);

const twelveFacts: VisualCase = {
  name: 'fact-sheet-twelve-facts-dark',
  story: dark.TwelveFacts,
  storyId: 'components-factsheet--twelve-facts',
  width: 1200,
  height: 600,
  element: page.getByTestId('fact-sheet-twelve-facts'),
  visible: [
    page.getByText('Level'),
    page.getByText('Speed'),
    page.getByText('23,000,000'),
    page.getByText('-20'),
  ],
};

const mixedKnown: VisualCase = {
  name: 'fact-sheet-mixed-known-dark',
  story: dark.MixedKnown,
  storyId: 'components-factsheet--mixed-known',
  width: 1200,
  height: 500,
  element: page.getByTestId('fact-sheet-mixed-known'),
  visible: [
    page.getByText('Unknown'),
    page.getByText('Not recorded'),
    page.getByText('Unavailable'),
    page.getByText('23,000,000'),
  ],
};

const narrow: VisualCase = {
  name: 'fact-sheet-narrow-dark',
  story: dark.Narrow,
  storyId: 'components-factsheet--narrow',
  width: 390,
  height: 700,
  element: page.getByTestId('fact-sheet-narrow'),
  visible: [
    page.getByText('Level'),
    page.getByText('Speed'),
    page.getByText('23,000,000'),
  ],
};

describe('fact-sheet-twelve-facts-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(twelveFacts);

    for (const locator of twelveFacts.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      twelveFacts.width,
    );

    await expectApprovedScreenshot(twelveFacts);
  });
});

describe('fact-sheet-mixed-known-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(mixedKnown);

    for (const locator of mixedKnown.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      mixedKnown.width,
    );

    await expectApprovedScreenshot(mixedKnown);
  });
});

describe('fact-sheet-narrow-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(narrow);

    for (const locator of narrow.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      narrow.width,
    );

    await expectApprovedScreenshot(narrow);
  });
});
