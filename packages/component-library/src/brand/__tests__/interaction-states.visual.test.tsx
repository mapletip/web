import { composeStories } from '@storybook/react-vite';
import { describe, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import * as stories from '@/brand/InteractionStates.stories';
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
    name: 'brand-control-default',
    story: ControlStates,
    storyId: 'brand-foundations-interaction-states--control-states',
    width: 900,
    height: 720,
    element: walnutAction,
  },
  {
    name: 'brand-control-hover',
    story: ControlStates,
    storyId: 'brand-foundations-interaction-states--control-states',
    width: 900,
    height: 720,
    element: walnutAction,
    beforeScreenshot: async () => {
      await userEvent.hover(walnutAction);
    },
    afterScreenshot: async () => {
      await walnutAction.unhover();
    },
  },
  {
    name: 'brand-control-focus-visible',
    story: ControlStates,
    storyId: 'brand-foundations-interaction-states--control-states',
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
    name: 'brand-control-pressed',
    story: ControlStates,
    storyId: 'brand-foundations-interaction-states--control-states',
    width: 900,
    height: 720,
    element: pressedAction,
  },
  {
    name: 'brand-control-disabled',
    story: ControlStates,
    storyId: 'brand-foundations-interaction-states--control-states',
    width: 900,
    height: 720,
    element: page.getByRole('button', {
      name: 'Disabled action',
      disabled: true,
    }),
  },
  {
    name: 'brand-record-selected',
    story: ControlStates,
    storyId: 'brand-foundations-interaction-states--control-states',
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
