import { composeStories } from '@storybook/react-vite';
import { describe, test } from 'vitest';

import * as stories from '@/components/Brand/Typography/__stories__/Typography.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const { TypeScale: Typography } = composeStories(stories);

const visualCases: readonly VisualCase[] = [
  {
    name: 'typography-default',
    story: Typography,
    storyId: 'brand-typography--type-scale',
    width: 1366,
    height: 768,
  },
];

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await expectApprovedScreenshot(visualCase);
  });
});
