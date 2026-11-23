import { composeStories } from '@storybook/react-vite';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { commands, page } from 'vitest/browser';

import * as stories from '@/components/StaticMap/__stories__/StaticMap.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const dark = composeStories(stories);

interface StaticMapVisualCase extends VisualCase {
  readonly imageAlt?: string;
}

const visualCases: readonly StaticMapVisualCase[] = [
  {
    name: 'static-map-wide-dark',
    story: dark.Wide,
    storyId: 'components-map-staticmap--wide',
    width: 720,
    height: 600,
    element: page.getByRole('group', { name: 'Synthetic wide image' }),
    imageAlt: 'Synthetic wide image',
    visible: [page.getByRole('img', { name: 'Synthetic wide image' })],
  },
  {
    name: 'static-map-tall-dark',
    story: dark.Tall,
    storyId: 'components-map-staticmap--tall',
    width: 320,
    height: 520,
    element: page.getByRole('group', { name: 'Synthetic tall image' }),
    imageAlt: 'Synthetic tall image',
    visible: [page.getByRole('img', { name: 'Synthetic tall image' })],
  },
  {
    name: 'static-map-tiny-dark',
    story: dark.Tiny,
    storyId: 'components-map-staticmap--tiny',
    width: 360,
    height: 400,
    element: page.getByRole('group', { name: 'Synthetic tiny image' }),
    imageAlt: 'Synthetic tiny image',
    visible: [page.getByRole('img', { name: 'Synthetic tiny image' })],
  },
  {
    name: 'static-map-coincident-markers-dark',
    story: dark.CoincidentMarkers,
    storyId: 'components-map-staticmap--coincident-markers',
    width: 720,
    height: 600,
    element: page.getByRole('group', { name: 'Synthetic wide image' }),
    imageAlt: 'Synthetic wide image',
    visible: [page.getByRole('img', { name: 'Synthetic wide image' })],
  },
  {
    name: 'static-map-unavailable-dark',
    story: dark.Unavailable,
    storyId: 'components-map-staticmap--unavailable',
    width: 720,
    height: 560,
    element: page.getByRole('group', { name: 'Image unavailable.' }),
    visible: [page.getByText('Image unavailable.', { exact: true })],
  },
];

beforeEach(async () => {
  await commands.emulateMedia({ reducedMotion: 'reduce' });
});

// The browser page is shared across visual files: restore the default media
// and park the pointer so later baselines never render with a hover state.
afterEach(async () => {
  await commands.emulateMedia({ reducedMotion: null });
  await commands.movePointer(0, 0);
});

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);

    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    const image = [...document.images].find(
      (candidate) => candidate.alt === visualCase.imageAlt,
    );
    expect(visualCase.imageAlt === undefined || image?.complete === true).toBe(
      true,
    );
    expect(
      visualCase.imageAlt === undefined || (image?.naturalWidth ?? 0) > 0,
    ).toBe(true);

    await expectApprovedScreenshot(visualCase);
  });
});
