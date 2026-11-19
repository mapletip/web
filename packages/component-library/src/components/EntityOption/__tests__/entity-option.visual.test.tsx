import { composeStories } from '@storybook/react-vite';
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import * as stories from '@/components/EntityOption/__stories__/EntityOption.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const dark = composeStories(stories);

const visualCase: VisualCase = {
  name: 'entity-option-gallery-dark',
  story: dark.Gallery,
  storyId: 'components-entityoption--gallery',
  width: 480,
  height: 260,
  element: page.getByTestId('entity-option-story'),
};

describe('entity-option-gallery-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await expect.element(page.getByTestId('entity-option-story')).toBeVisible();
    await expectApprovedScreenshot(visualCase);
  });
});
