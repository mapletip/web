import { composeStories } from '@storybook/react-vite';
import { describe, test } from 'vitest';

import * as stories from '@/components/Alert/__stories__/Alert.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const { SemanticStatuses: Alert } = composeStories(stories);

const visualCases: readonly VisualCase[] = [
  {
    name: 'alert-default',
    story: Alert,
    storyId: 'components-alert--semantic-statuses',
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
