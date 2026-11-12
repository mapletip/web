import { composeStories } from '@storybook/react-vite';
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import * as stories from '@/components/EntityChip/__stories__/EntityChip.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

// The preview forces MapleTip's single shipped dark scheme.
const dark = composeStories(stories);

const gallery = page.getByTestId('entity-chip-story');

const visualCase: VisualCase = {
  name: 'entity-chip-gallery-dark',
  story: dark.Gallery,
  storyId: 'components-entitychip--gallery',
  width: 720,
  height: 820,
  element: gallery,
  visible: [
    page.getByRole('link', { name: 'Linked item one' }),
    page.getByRole('link', { name: 'Linked item without an icon' }),
    page.getByText('Unlinked item one'),
    page.getByRole('link', { name: 'Confirmed item' }),
    page.getByRole('button', { name: 'Confirmed' }).first(),
    page.getByRole('button', { name: 'Unconfirmed' }),
    page.getByRole('link', { name: /Synthetic summoning item/ }),
    page.getByRole('link', { name: 'Wrapping item one' }),
  ],
};

describe('entity-chip-gallery-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);

    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    // Unlinked chips add no anchor; their names stay plain text.
    expect(
      page.getByRole('link', { name: 'Unlinked item one' }).elements(),
    ).toHaveLength(0);

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      visualCase.width,
    );

    await expectApprovedScreenshot(visualCase);
  });
});
