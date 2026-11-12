import { composeStories } from '@storybook/react-vite';
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import * as stories from '@/components/SpriteStage/__stories__/SpriteStage.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

// The preview forces MapleTip's single shipped dark scheme.
const dark = composeStories(stories);

const gallery = page.getByTestId('sprite-stage-story');

const visualCase: VisualCase = {
  name: 'sprite-stage-gallery-dark',
  story: dark.Gallery,
  storyId: 'components-spritestage--gallery',
  width: 1200,
  height: 1000,
  element: gallery,
  visible: [
    page.getByRole('img', { name: 'Synthetic small sprite' }),
    page.getByRole('img', { name: 'Synthetic ordinary sprite' }),
    page.getByRole('img', { name: 'Synthetic oversized sprite' }),
    page.getByText('No sprite is available for this record.'),
  ],
};

describe('sprite-stage-gallery-dark', () => {
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
