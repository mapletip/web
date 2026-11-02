import { composeStories } from '@storybook/react-vite';
import { describe, test } from 'vitest';
import { page } from 'vitest/browser';

import * as stories from '@/components/Table/__stories__/Table.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

// The preview forces MapleTip's single shipped dark scheme.
const dark = composeStories(stories);

const table = page.getByRole('table', { name: 'Records' });

const visualCases: readonly VisualCase[] = [
  {
    name: 'table-populated-dark',
    story: dark.Table,
    storyId: 'components-table--table',
    width: 1366,
    height: 768,
    element: table,
  },
];

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await expectApprovedScreenshot(visualCase);
  });
});
