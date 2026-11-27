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
      page.getByRole('link', { name: 'Practice Meadow', exact: true }),
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
  {
    name: 'record-card-linked-footer-button-dark',
    story: dark.LinkedCardWithFooterButton,
    storyId: 'components-recordcard--linked-card-with-footer-button',
    width: 720,
    height: 280,
    element: page.getByTestId('record-card-linked-footer-button'),
    visible: [
      page.getByRole('link', { name: 'Practice Meadow', exact: true }),
      page.getByRole('button', { name: 'Locate', exact: true }),
    ],
  },
  {
    name: 'record-card-header-scoped-footer-button-dark',
    story: dark.HeaderScopedCardWithFooterButton,
    storyId: 'components-recordcard--header-scoped-card-with-footer-button',
    width: 720,
    height: 280,
    element: page.getByTestId('record-card-header-scoped-footer-button'),
    visible: [
      page.getByRole('link', { name: 'Practice Meadow', exact: true }),
      page.getByRole('button', { name: 'Locate', exact: true }),
    ],
  },
  {
    name: 'record-card-compact-two-column-narrow-dark',
    story: dark.CompactTwoColumnNarrow,
    storyId: 'components-recordcard--compact-two-column-narrow',
    width: 320,
    height: 240,
    visible: [
      page.getByRole('link', { name: 'Blue Gloop', exact: true }),
      page.getByRole('link', { name: 'Red Gloop', exact: true }),
    ],
  },
  {
    name: 'record-card-identity-gallery-desktop-dark',
    story: dark.IdentityGallery,
    storyId: 'components-recordcard--identity-gallery',
    width: 1440,
    height: 360,
    visible: [page.getByRole('link', { name: 'Copper Compass' })],
  },
  {
    name: 'record-card-identity-gallery-mobile-dark',
    story: dark.IdentityGallery,
    storyId: 'components-recordcard--identity-gallery',
    width: 390,
    height: 760,
    visible: [page.getByRole('link', { name: 'Copper Compass' })],
  },
  {
    name: 'record-card-identity-action-facts-dark',
    story: dark.IdentityActionFacts,
    storyId: 'components-recordcard--identity-action-facts',
    width: 420,
    height: 360,
    visible: [page.getByRole('button', { name: 'Copper Compass' })],
  },
  {
    name: 'record-card-identity-open-dark',
    story: dark.IdentityOpen,
    storyId: 'components-recordcard--identity-open',
    width: 720,
    height: 280,
    visible: [page.getByRole('button', { name: 'Copper Compass' })],
  },
  {
    name: 'record-card-picture-gallery-desktop-dark',
    story: dark.PictureGallery,
    storyId: 'components-recordcard--picture-gallery',
    width: 1440,
    height: 400,
    visible: [page.getByRole('link', { name: 'Copper Compass' })],
  },
  {
    name: 'record-card-picture-gallery-mobile-dark',
    story: dark.PictureGallery,
    storyId: 'components-recordcard--picture-gallery',
    width: 390,
    height: 1000,
    visible: [page.getByRole('link', { name: 'Copper Compass' })],
  },
  {
    name: 'record-facts-selected-dark',
    story: dark.SelectedFacts,
    storyId: 'components-recordcard--selected-facts',
    width: 720,
    height: 220,
    visible: [page.getByRole('button', { name: /Greater.*80% success/u })],
  },
  {
    name: 'record-card-quiet-identity-dark',
    story: dark.QuietIdentity,
    storyId: 'components-recordcard--quiet-identity',
    width: 720,
    height: 240,
    visible: [
      page.getByText('Used in tasks'),
      page.getByText('Found in the practice meadow'),
    ],
  },
];

describe('RecordCard visual states', () => {
  test.each(cases.slice(6))('matches $name', async (visualCase) => {
    await openVisualCase(visualCase);
    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      visualCase.width,
    );
    await expectApprovedScreenshot(visualCase);
  });
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

  test('matches the linked card with footer button baseline', async () => {
    const visualCase = cases[3]!;
    await openVisualCase(visualCase);
    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      visualCase.width,
    );
    await expectApprovedScreenshot(visualCase);
  });

  test('renders the header-scoped link with its footer action', async () => {
    const visualCase = cases[4]!;
    await openVisualCase(visualCase);
    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      visualCase.width,
    );
    await expectApprovedScreenshot(visualCase);
  });

  test('renders compact cards without horizontal overflow at 320px', async () => {
    const visualCase = cases[5]!;
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
