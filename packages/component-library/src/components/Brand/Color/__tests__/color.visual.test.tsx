import { composeStories } from '@storybook/react-vite';
import { describe, test } from 'vitest';

import * as stories from '@/components/Brand/Color/__stories__/Color.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const { SemanticRoles: Color } = composeStories(stories);

const visualCases: readonly VisualCase[] = [
  {
    name: 'color-default',
    story: Color,
    storyId: 'brand-color--semantic-roles',
    width: 1366,
    height: 1600,
  },
];

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await expectApprovedScreenshot(visualCase);
  });
});
