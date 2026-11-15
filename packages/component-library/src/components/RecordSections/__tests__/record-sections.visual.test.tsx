import { composeStories } from '@storybook/react-vite';
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import * as stories from '@/components/RecordSections/__stories__/RecordSections.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const dark = composeStories(stories);

const threeSections: VisualCase = {
  name: 'record-sections-three-dark',
  story: dark.ThreeSections,
  storyId: 'components-recordsections--three-sections',
  width: 1200,
  height: 620,
  element: page.getByTestId('record-sections-three'),
  visible: [
    page.getByRole('link', { name: 'Overview (3)' }),
    page.getByRole('heading', { name: 'Related records (2)' }),
  ],
};

const phone: VisualCase = {
  name: 'record-sections-phone-dark',
  story: dark.FourSectionsOnPhone,
  storyId: 'components-recordsections--four-sections-on-phone',
  width: 390,
  height: 820,
  element: page.getByTestId('record-sections-phone'),
  visible: [page.getByRole('link', { name: 'Additional notes (1)' })],
};

const unknownCount: VisualCase = {
  name: 'record-sections-unknown-count-dark',
  story: dark.UnknownCount,
  storyId: 'components-recordsections--unknown-count',
  width: 1200,
  height: 620,
  element: page.getByTestId('record-sections-unknown'),
  visible: [page.getByRole('link', { name: 'Overview (?)' })],
};

const omittedSection: VisualCase = {
  name: 'record-sections-omitted-dark',
  story: dark.OmittedSection,
  storyId: 'components-recordsections--omitted-section',
  width: 1200,
  height: 540,
  element: page.getByTestId('record-sections-omitted'),
  visible: [page.getByRole('link', { name: 'Overview (3)' })],
  hidden: [page.getByRole('link', { name: 'Details (8)' })],
};

describe('record-sections-three-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(threeSections);

    for (const locator of threeSections.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      threeSections.width,
    );
    await expectApprovedScreenshot(threeSections);
  });
});

describe('record-sections-phone-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(phone);

    for (const locator of phone.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      phone.width,
    );
    await expectApprovedScreenshot(phone);
  });
});

describe('record-sections-unknown-count-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(unknownCount);

    for (const locator of unknownCount.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      unknownCount.width,
    );
    await expectApprovedScreenshot(unknownCount);
  });
});

describe('record-sections-omitted-dark', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(omittedSection);

    for (const locator of omittedSection.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }
    for (const locator of omittedSection.hidden ?? []) {
      await expect.element(locator).not.toBeInTheDocument();
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      omittedSection.width,
    );
    await expectApprovedScreenshot(omittedSection);
  });
});
