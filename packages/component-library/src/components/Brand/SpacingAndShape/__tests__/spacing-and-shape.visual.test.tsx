import { composeStories } from '@storybook/react-vite';
import { describe, test } from 'vitest';

import * as stories from '@/components/Brand/SpacingAndShape/__stories__/SpacingAndShape.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const { FoundationScale: SpacingAndShape } = composeStories(stories);

const visualCases: readonly VisualCase[] = [
  {
    name: 'spacing-and-shape-default',
    story: SpacingAndShape,
    storyId: 'brand-spacing-and-shape--foundation-scale',
    width: 1366,
    height: 1280,
  },
];

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await expectApprovedScreenshot(visualCase);
  });
});
