import { composeStories } from '@storybook/react-vite';
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import * as stories from '@/components/RecordCard/__stories__/RecordCard.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const dark = composeStories(stories);

const cases: readonly VisualCase[] = [
  {
    name: 'record-card-with-media-dark',
    story: dark.WithMedia,
    storyId: 'components-recordcard--with-media',
    width: 720,
    height: 280,
    visible: [
      page.getByRole('link', {
        name: /Practice Meadow.*Synthetic region.*West Practice Grounds.*Meadow District.*12 spawns/u,
      }),
      page.getByText('12 spawns'),
    ],
  },
  {
    name: 'record-card-without-media-dark',
    story: dark.WithoutMedia,
    storyId: 'components-recordcard--without-media',
    width: 720,
    height: 220,
    visible: [
      page.getByRole('heading', { name: 'Quiet Clearing' }),
      page.getByText('1 spawn'),
    ],
  },
  {
    name: 'record-card-unlinked-dark',
    story: dark.UnlinkedCard,
    storyId: 'components-recordcard--unlinked-card',
    width: 720,
    height: 360,
    visible: [
      page.getByRole('heading', { name: 'Unlinked training map' }),
      page.getByRole('heading', { name: 'Linked training map' }),
    ],
  },
];

describe('RecordCard visual states', () => {
  test('matches the media card baseline', async () => {
    const visualCase = cases[0]!;
    await openVisualCase(visualCase);
    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      visualCase.width,
    );
    await expectApprovedScreenshot(visualCase);
  });

  test('matches the card without media baseline', async () => {
    const visualCase = cases[1]!;
    await openVisualCase(visualCase);
    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      visualCase.width,
    );
    await expectApprovedScreenshot(visualCase);
  });

  test('matches the unlinked cards baseline', async () => {
    const visualCase = cases[2]!;
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
