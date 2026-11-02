import { composeStories } from '@storybook/react-vite';
import { describe, test } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';

import * as stories from '@/components/Brand/InteractionStates/__stories__/InteractionStates.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const { ControlStates } = composeStories(stories);

const walnutAction = page.getByRole('button', {
  name: 'Walnut primary action',
});
const pressedAction = page.getByRole('button', {
  name: 'Compare selected record',
  pressed: true,
});

const visualCases: readonly VisualCase[] = [
  {
    name: 'control-default',
    story: ControlStates,
    storyId: 'brand-interaction-states--control-states',
    width: 900,
    height: 720,
    element: walnutAction,
  },
  {
    name: 'control-hover',
    story: ControlStates,
    storyId: 'brand-interaction-states--control-states',
    width: 900,
    height: 720,
    element: walnutAction,
    beforeScreenshot: async () => {
      await userEvent.hover(walnutAction);
    },
    afterScreenshot: async () => {
      await commands.movePointer(-1, -1);
    },
  },
  {
    name: 'control-focus-visible',
    story: ControlStates,
    storyId: 'brand-interaction-states--control-states',
    width: 900,
    height: 720,
    element: walnutAction,
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
  },
  {
    name: 'control-pressed',
    story: ControlStates,
    storyId: 'brand-interaction-states--control-states',
    width: 900,
    height: 720,
    element: pressedAction,
  },
  {
    name: 'control-disabled',
    story: ControlStates,
    storyId: 'brand-interaction-states--control-states',
    width: 900,
    height: 720,
    element: page.getByRole('button', {
      name: 'Disabled action',
      disabled: true,
    }),
  },
  {
    name: 'record-selected',
    story: ControlStates,
    storyId: 'brand-interaction-states--control-states',
    width: 900,
    height: 720,
    element: page.getByRole('row', {
      name: /Crimson Balrog/,
      selected: true,
    }),
  },
];

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await expectApprovedScreenshot(visualCase);
  });
});
