import { composeStories } from '@storybook/react-vite';
import { describe, test } from 'vitest';

import * as colorStories from '@/brand/Color.stories';
import * as spacingStories from '@/brand/SpacingAndShape.stories';
import * as statusStories from '@/brand/StatusSignals.stories';
import * as typographyStories from '@/brand/Typography.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const { SemanticRoles: Color } = composeStories(colorStories);
const { TypeScale: Typography } = composeStories(typographyStories);
const { FoundationScale: SpacingAndShape } = composeStories(spacingStories);
const { SemanticStatuses: StatusSignals } = composeStories(statusStories);

const visualCases: readonly VisualCase[] = [
  {
    name: 'brand-color-default',
    story: Color,
    storyId: 'brand-foundations-color--semantic-roles',
    width: 1366,
    height: 1600,
  },
  {
    name: 'brand-typography-default',
    story: Typography,
    storyId: 'brand-foundations-typography--type-scale',
    width: 1366,
    height: 768,
  },
  {
    name: 'brand-spacing-and-shape-default',
    story: SpacingAndShape,
    storyId: 'brand-foundations-spacing-and-shape--foundation-scale',
    width: 1366,
    height: 1280,
  },
  {
    name: 'brand-status-signals-default',
    story: StatusSignals,
    storyId: 'brand-foundations-status-signals--semantic-statuses',
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
