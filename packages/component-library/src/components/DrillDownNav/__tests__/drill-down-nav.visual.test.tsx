import { composeStories } from '@storybook/react-vite';
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';

import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

import * as stories from '../__stories__/DrillDownNav.stories';

const dark = composeStories(stories);

const visualCase: VisualCase = {
  name: 'drill-down-nav-leaf-siblings-dark',
  story: dark.LeafWithSiblings,
  storyId: 'components-drilldownnav--leaf-with-siblings',
  width: 390,
  height: 640,
  element: page.getByRole('navigation', { name: 'Store catalog' }),
};

describe('leaf with siblings in a 240px dark rail', () => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await expect.element(visualCase.element!).toBeVisible();
    await expectApprovedScreenshot(visualCase);
  });
});
