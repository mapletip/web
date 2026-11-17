import { composeStories } from '@storybook/react-vite';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';

import * as stories from '@/components/MarkerStage/__stories__/MarkerStage.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const dark = composeStories(stories);

interface MarkerStageVisualCase extends VisualCase {
  readonly testId: string;
  readonly imageAlt?: string;
  readonly connectorCount?: number;
  readonly selectedIds?: readonly string[];
}

const wideMarkers = [
  page.getByRole('button', { name: 'West point' }),
  page.getByRole('button', { name: 'East point' }),
  page.getByRole('button', { name: 'North point' }),
  page.getByRole('button', { name: 'South point' }),
];

const wideImage = page.getByRole('img', { name: 'Synthetic wide image' });

const visualCases: readonly MarkerStageVisualCase[] = [
  {
    name: 'marker-stage-wide-image-dark',
    story: dark.WideImage,
    storyId: 'components-markerstage--wide-image',
    testId: 'marker-stage-wide-image',
    width: 720,
    height: 400,
    element: page.getByTestId('marker-stage-wide-image'),
    imageAlt: 'Synthetic wide image',
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'marker-stage-tall-image-dark',
    story: dark.TallImage,
    storyId: 'components-markerstage--tall-image',
    testId: 'marker-stage-tall-image',
    width: 320,
    height: 520,
    element: page.getByTestId('marker-stage-tall-image'),
    imageAlt: 'Synthetic tall image',
    visible: [
      page.getByRole('img', { name: 'Synthetic tall image' }),
      page.getByRole('button', { name: 'Centre point' }),
    ],
  },
  {
    name: 'marker-stage-tiny-image-dark',
    story: dark.TinyImage,
    storyId: 'components-markerstage--tiny-image',
    testId: 'marker-stage-tiny-image',
    width: 360,
    height: 280,
    element: page.getByTestId('marker-stage-tiny-image'),
    imageAlt: 'Synthetic tiny image',
    visible: [
      page.getByRole('img', { name: 'Synthetic tiny image' }),
      page.getByRole('button', { name: 'Centre point' }),
    ],
  },
  {
    name: 'marker-stage-unavailable-dark',
    story: dark.Unavailable,
    storyId: 'components-markerstage--unavailable',
    testId: 'marker-stage-unavailable',
    width: 720,
    height: 560,
    element: page.getByTestId('marker-stage-unavailable'),
    visible: [page.getByText('Image unavailable.', { exact: true })],
  },
  {
    name: 'marker-stage-none-selected-dark',
    story: dark.NoneSelected,
    storyId: 'components-markerstage--none-selected',
    testId: 'marker-stage-none-selected',
    width: 720,
    height: 400,
    element: page.getByTestId('marker-stage-none-selected'),
    imageAlt: 'Synthetic wide image',
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'marker-stage-one-selected-dark',
    story: dark.OneSelected,
    storyId: 'components-markerstage--one-selected',
    testId: 'marker-stage-one-selected',
    width: 720,
    height: 400,
    element: page.getByTestId('marker-stage-one-selected'),
    imageAlt: 'Synthetic wide image',
    selectedIds: ['east'],
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'marker-stage-many-selected-dark',
    story: dark.ManySelected,
    storyId: 'components-markerstage--many-selected',
    testId: 'marker-stage-many-selected',
    width: 720,
    height: 400,
    element: page.getByTestId('marker-stage-many-selected'),
    imageAlt: 'Synthetic wide image',
    selectedIds: ['west', 'north', 'south'],
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'marker-stage-coincident-markers-dark',
    story: dark.CoincidentMarkers,
    storyId: 'components-markerstage--coincident-markers',
    testId: 'marker-stage-coincident-markers',
    width: 720,
    height: 400,
    element: page.getByTestId('marker-stage-coincident-markers'),
    imageAlt: 'Synthetic wide image',
    visible: [
      wideImage,
      page.getByRole('button', {
        name: 'First point, Second point (2)',
      }),
    ],
  },
  {
    name: 'marker-stage-static-dark',
    story: dark.Static,
    storyId: 'components-markerstage--static',
    testId: 'marker-stage-static',
    width: 720,
    height: 400,
    element: page.getByTestId('marker-stage-static'),
    imageAlt: 'Synthetic wide image',
    selectedIds: ['east'],
    visible: [
      wideImage,
      page.getByText('A', { exact: true }),
      page.getByText('B', { exact: true }),
      page.getByText('C', { exact: true }),
      page.getByText('D', { exact: true }),
    ],
  },
  {
    name: 'marker-stage-details-at-center-dark',
    story: dark.DetailsAtCenter,
    storyId: 'components-markerstage--details-at-center',
    testId: 'marker-stage-details-centre',
    width: 720,
    height: 400,
    element: page.getByTestId('marker-stage-details-centre'),
    imageAlt: 'Synthetic wide image',
    beforeScreenshot: async () => {
      await userEvent.click(page.getByRole('button', { name: 'Centre point' }));
    },
    visible: [
      wideImage,
      page.getByRole('button', { name: 'Centre point' }),
      page.getByText('Details shown beside the center point.'),
    ],
  },
  {
    name: 'marker-stage-details-near-edge-dark',
    story: dark.DetailsNearEachEdge,
    storyId: 'components-markerstage--details-near-each-edge',
    testId: 'marker-stage-details-near-edge',
    width: 720,
    height: 400,
    element: page.getByTestId('marker-stage-details-near-edge'),
    imageAlt: 'Synthetic wide image',
    beforeScreenshot: async () => {
      await userEvent.click(
        page.getByRole('button', { name: 'Top edge point' }),
      );
    },
    visible: [
      wideImage,
      page.getByRole('button', { name: 'Top edge point' }),
      page.getByRole('button', { name: 'Right edge point' }),
      page.getByRole('button', { name: 'Bottom edge point' }),
      page.getByRole('button', { name: 'Left edge point' }),
      page.getByText('Details stay within the stage near every edge.'),
    ],
  },
  {
    name: 'marker-stage-connected-pairs-dark',
    story: dark.ConnectedPairs,
    storyId: 'components-markerstage--connected-pairs',
    testId: 'marker-stage-connected-pairs',
    width: 720,
    height: 400,
    element: page.getByTestId('marker-stage-connected-pairs'),
    imageAlt: 'Synthetic wide image',
    connectorCount: 2,
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'marker-stage-zoomed-lines-selection-dark',
    story: dark.ZoomedWithLinesAndSelection,
    storyId: 'components-markerstage--zoomed-with-lines-and-selection',
    testId: 'marker-stage-zoomed-lines-selection',
    width: 720,
    height: 400,
    element: page.getByTestId('marker-stage-zoomed-lines-selection'),
    imageAlt: 'Synthetic wide image',
    connectorCount: 2,
    selectedIds: ['east', 'south'],
    beforeScreenshot: async () => {
      const zoomIn = page.getByRole('button', { name: 'Zoom in' });
      await userEvent.click(zoomIn);
      // Keep the control's hover tooltip out of the baseline.
      await userEvent.unhover(zoomIn);
      await expect.element(page.getByRole('tooltip')).not.toBeInTheDocument();
    },
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'marker-stage-saved-restored-view-dark',
    story: dark.SavedAndRestoredView,
    storyId: 'components-markerstage--saved-and-restored-view',
    testId: 'marker-stage-saved-restored',
    width: 720,
    height: 440,
    element: page.getByTestId('marker-stage-saved-restored'),
    imageAlt: 'Synthetic wide image',
    beforeScreenshot: async () => {
      const image = document.images[0];
      if (image === undefined)
        throw new Error('Saved view image did not render');

      const zoomIn = page.getByRole('button', { name: 'Zoom in' });
      const saveView = page.getByRole('button', { name: 'Save view' });
      const restoreView = page.getByRole('button', { name: 'Restore view' });

      await userEvent.click(zoomIn);
      await expect.element(saveView).toBeEnabled();
      const savedWidth = image.getBoundingClientRect().width;

      await userEvent.click(saveView);
      await userEvent.click(zoomIn);
      const changedWidth = image.getBoundingClientRect().width;
      expect(changedWidth).toBeGreaterThan(savedWidth);

      await userEvent.click(restoreView);
      expect(image.getBoundingClientRect().width).toBeCloseTo(savedWidth, 0);
    },
    visible: [
      wideImage,
      ...wideMarkers,
      page.getByText('View saved', { exact: true }),
      page.getByRole('button', { name: 'Restore view' }),
    ],
  },
];

beforeEach(async () => {
  await commands.emulateMedia({ reducedMotion: 'reduce' });
});

// The browser page is shared across visual files: restore the default media
// and park the pointer so later baselines never render with a hover state.
afterEach(async () => {
  await commands.emulateMedia({ reducedMotion: null });
  await commands.movePointer(0, 0);
});

describe.each(visualCases)('$name', (visualCase) => {
  test('matches the approved baseline', async () => {
    await openVisualCase(visualCase);
    await visualCase.beforeScreenshot?.();

    for (const locator of visualCase.visible ?? []) {
      await expect.element(locator).toBeVisible();
    }

    const image = [...document.images].find(
      (candidate) => candidate.alt === visualCase.imageAlt,
    );
    expect(visualCase.imageAlt === undefined || image?.complete === true).toBe(
      true,
    );
    expect(
      visualCase.imageAlt === undefined || (image?.naturalWidth ?? 0) > 0,
    ).toBe(true);

    const wrapper = document.querySelector<HTMLElement>(
      `[data-testid="${visualCase.testId}"]`,
    );
    expect(wrapper).not.toBeNull();

    expect(
      visualCase.connectorCount === undefined ||
        wrapper?.querySelectorAll('svg line').length ===
          visualCase.connectorCount,
    ).toBe(true);

    for (const markerId of visualCase.selectedIds ?? []) {
      expect(
        wrapper?.querySelector(
          `[data-marker-id="${markerId}"][data-selected="true"]`,
        ),
      ).not.toBeNull();
    }

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      visualCase.width,
    );

    const screenshotCase = { ...visualCase };
    delete screenshotCase.beforeScreenshot;
    await expectApprovedScreenshot(screenshotCase);
  });
});
