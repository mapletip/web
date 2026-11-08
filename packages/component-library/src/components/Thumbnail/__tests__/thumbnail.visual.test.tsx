import { composeStories } from '@storybook/react-vite';
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import * as stories from '@/components/Thumbnail/__stories__/Thumbnail.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

// Storybook's preview forces the shipped dark theme for the default captures.
const dark = composeStories(stories);

const visualCases: readonly VisualCase[] = [
  {
    name: 'thumbnail-large-image-dark',
    story: dark.LargeImage,
    storyId: 'components-thumbnail--large-image',
    width: 720,
    height: 240,
    element: page.getByTestId('thumbnail-story'),
  },
  {
    name: 'thumbnail-small-image-dark',
    story: dark.SmallImage,
    storyId: 'components-thumbnail--small-image',
    width: 720,
    height: 240,
    element: page.getByTestId('thumbnail-story'),
  },
  {
    name: 'thumbnail-missing-image-dark',
    story: dark.MissingImage,
    storyId: 'components-thumbnail--missing-image',
    width: 720,
    height: 240,
    element: page.getByTestId('thumbnail-story'),
  },
  {
    name: 'thumbnail-broken-image-dark',
    story: dark.BrokenImage,
    storyId: 'components-thumbnail--broken-image',
    width: 720,
    height: 240,
    element: page.getByTestId('thumbnail-story'),
  },
  {
    name: 'thumbnail-size-row-dark',
    story: dark.SizeRow,
    storyId: 'components-thumbnail--size-row',
    width: 720,
    height: 240,
    element: page.getByTestId('thumbnail-story'),
  },
];

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await expect.element(page.getByTestId('thumbnail-story')).toBeVisible();

    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    await expectApprovedScreenshot(visualCase);
  });
});
