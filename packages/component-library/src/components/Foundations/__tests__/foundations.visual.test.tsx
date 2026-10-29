import { composeStories } from '@storybook/react-vite';
import { describe, test } from 'vitest';

import * as stories from '@/components/Foundations/__stories__/Foundations.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const light = composeStories(stories, {
  initialGlobals: { colorScheme: 'light' },
});
const dark = composeStories(stories, {
  initialGlobals: { colorScheme: 'dark' },
});

const visualCases: readonly VisualCase[] = [
  {
    name: 'foundations-dark',
    story: dark.Default,
    storyId: 'foundations-maple-twilight--default',
    width: 1366,
    height: 1800,
  },
  {
    name: 'foundations-light',
    story: light.Default,
    storyId: 'foundations-maple-twilight--default',
    width: 1366,
    height: 1800,
  },
  {
    name: 'foundations-focus-dark',
    story: dark.Focus,
    storyId: 'foundations-maple-twilight--focus',
    width: 900,
    height: 420,
  },
];

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await expectApprovedScreenshot(visualCase);
  });
});
