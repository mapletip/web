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

const linked: VisualCase = {
  name: 'entity-chip-linked-dark',
  story: dark.Linked,
  storyId: 'components-entitychip--linked',
  width: 640,
  height: 240,
  element: page.getByTestId('entity-chip-linked'),
  visible: [
    page.getByRole('link', { name: 'Synthetic item one' }),
    page.getByRole('link', { name: 'Synthetic item two' }),
    page.getByRole('link', { name: 'Synthetic item with no icon' }),
  ],
};

const unlinked: VisualCase = {
  name: 'entity-chip-unlinked-dark',
  story: dark.Unlinked,
  storyId: 'components-entitychip--unlinked',
  width: 640,
  height: 240,
  element: page.getByTestId('entity-chip-unlinked'),
  visible: [page.getByText('Synthetic item one')],
};

const longName: VisualCase = {
  name: 'entity-chip-long-name-dark',
  story: dark.LongName,
  storyId: 'components-entitychip--long-name',
  width: 390,
  height: 300,
  element: page.getByTestId('entity-chip-long-name'),
  visible: [
    page.getByRole('link', { name: /Synthetic summoning item/ }),
    page.getByRole('button', { name: 'Confirmed' }),
  ],
};

const trailingControl: VisualCase = {
  name: 'entity-chip-trailing-control-dark',
  story: dark.TrailingControl,
  storyId: 'components-entitychip--trailing-control',
  width: 640,
  height: 280,
  element: page.getByTestId('entity-chip-trailing-control'),
  visible: [
    page.getByRole('link', { name: 'Synthetic item one' }),
    page.getByRole('button', { name: 'Confirmed' }).first(),
    page.getByRole('button', { name: 'Unconfirmed' }),
  ],
};

const wrappingGroup: VisualCase = {
  name: 'entity-chip-wrapping-group-dark',
  story: dark.WrappingGroup,
  storyId: 'components-entitychip--wrapping-group',
  width: 640,
  height: 360,
  element: page.getByTestId('entity-chip-wrapping-group'),
  visible: [
    page.getByRole('link', { name: 'Synthetic item one' }),
    page.getByRole('link', { name: /Synthetic summoning item/ }),
  ],
};

describe('entity-chip-linked-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(linked);

    for (const locator of linked.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    await expectApprovedScreenshot(linked);
  });
});

describe('entity-chip-unlinked-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(unlinked);

    for (const locator of unlinked.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    expect(page.getByRole('link').elements()).toHaveLength(0);

    await expectApprovedScreenshot(unlinked);
  });
});

describe('entity-chip-long-name-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(longName);

    for (const locator of longName.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      longName.width,
    );

    await expectApprovedScreenshot(longName);
  });
});

describe('entity-chip-trailing-control-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(trailingControl);

    for (const locator of trailingControl.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    await expectApprovedScreenshot(trailingControl);
  });
});

describe('entity-chip-wrapping-group-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(wrappingGroup);

    for (const locator of wrappingGroup.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      wrappingGroup.width,
    );

    await expectApprovedScreenshot(wrappingGroup);
  });
});
