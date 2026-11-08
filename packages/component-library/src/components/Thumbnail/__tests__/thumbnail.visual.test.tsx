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

const visualCase: VisualCase = {
  name: 'thumbnail-gallery-dark',
  story: dark.Gallery,
  storyId: 'components-thumbnail--gallery',
  width: 640,
  height: 360,
  element: page.getByTestId('thumbnail-story'),
};

describe('thumbnail-gallery-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await expect.element(page.getByTestId('thumbnail-story')).toBeVisible();
    await expectApprovedScreenshot(visualCase);
  });
});
