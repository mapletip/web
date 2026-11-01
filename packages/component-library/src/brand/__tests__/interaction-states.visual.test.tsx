import { composeStories } from '@storybook/react-vite';
import { test } from 'vitest';
import { userEvent } from 'vitest/browser';

import * as stories from '@/brand/InteractionStates.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const { ControlStates } = composeStories(stories);

const focusedWalnutAction: VisualCase = {
  name: 'brand-walnut-focus',
  story: ControlStates,
  storyId: 'brand-foundations-interaction-states--control-states',
  width: 900,
  height: 720,
  beforeScreenshot: async () => {
    await userEvent.tab();
    const focused = document.activeElement;
    if (
      !(focused instanceof HTMLButtonElement) ||
      focused.textContent !== 'Walnut primary action'
    ) {
      throw new Error(
        'The Walnut primary action did not receive keyboard focus',
      );
    }
  },
};

test('Walnut action has a visible keyboard focus treatment', async () => {
  await openVisualCase(focusedWalnutAction);
  await expectApprovedScreenshot(focusedWalnutAction);
});
