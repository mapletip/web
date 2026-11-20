import { composeStories } from '@storybook/react-vite';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';

import * as stories from '@/components/InteractiveMap/__stories__/InteractiveMap.stories';
import {
  expectApprovedScreenshot,
  openVisualCase,
} from '@/test-support/visual';
import type { VisualCase } from '@/test-support/visual';

const dark = composeStories(stories);

interface InteractiveMapVisualCase extends VisualCase {
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

const visualCases: readonly InteractiveMapVisualCase[] = [
  {
    name: 'interactive-map-wide-image-dark',
    story: dark.WideImage,
    storyId: 'components-interactivemap--wide-image',
    testId: 'interactive-map-wide-image',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-wide-image'),
    imageAlt: 'Synthetic wide image',
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'interactive-map-tall-image-dark',
    story: dark.TallImage,
    storyId: 'components-interactivemap--tall-image',
    testId: 'interactive-map-tall-image',
    width: 320,
    height: 520,
    element: page.getByTestId('interactive-map-tall-image'),
    imageAlt: 'Synthetic tall image',
    visible: [
      page.getByRole('img', { name: 'Synthetic tall image' }),
      page.getByRole('button', { name: 'Center point' }),
    ],
  },
  {
    name: 'interactive-map-tiny-image-dark',
    story: dark.TinyImage,
    storyId: 'components-interactivemap--tiny-image',
    testId: 'interactive-map-tiny-image',
    width: 360,
    height: 280,
    element: page.getByTestId('interactive-map-tiny-image'),
    imageAlt: 'Synthetic tiny image',
    visible: [
      page.getByRole('img', { name: 'Synthetic tiny image' }),
      page.getByRole('button', { name: 'Center point' }),
    ],
  },
  {
    name: 'interactive-map-unavailable-dark',
    story: dark.Unavailable,
    storyId: 'components-interactivemap--unavailable',
    testId: 'interactive-map-unavailable',
    width: 720,
    height: 560,
    element: page.getByTestId('interactive-map-unavailable'),
    visible: [page.getByText('Image unavailable.', { exact: true })],
  },
  {
    name: 'interactive-map-none-selected-dark',
    story: dark.NoneSelected,
    storyId: 'components-interactivemap--none-selected',
    testId: 'interactive-map-none-selected',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-none-selected'),
    imageAlt: 'Synthetic wide image',
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'interactive-map-one-selected-dark',
    story: dark.OneSelected,
    storyId: 'components-interactivemap--one-selected',
    testId: 'interactive-map-one-selected',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-one-selected'),
    imageAlt: 'Synthetic wide image',
    selectedIds: ['east'],
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'interactive-map-many-selected-dark',
    story: dark.ManySelected,
    storyId: 'components-interactivemap--many-selected',
    testId: 'interactive-map-many-selected',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-many-selected'),
    imageAlt: 'Synthetic wide image',
    selectedIds: ['west', 'north', 'south'],
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'interactive-map-coincident-markers-dark',
    story: dark.CoincidentMarkers,
    storyId: 'components-interactivemap--coincident-markers',
    testId: 'interactive-map-coincident-markers',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-coincident-markers'),
    imageAlt: 'Synthetic wide image',
    visible: [
      wideImage,
      page.getByRole('button', {
        name: 'First point, Second point (2)',
      }),
    ],
  },
  {
    name: 'interactive-map-dense-markers-dark',
    story: dark.DenseMarkers,
    storyId: 'components-interactivemap--dense-markers',
    testId: 'interactive-map-dense-markers',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-dense-markers'),
    imageAlt: 'Synthetic wide image',
    visible: [
      wideImage,
      page.getByRole('button', { name: 'First nearby point' }),
      page.getByRole('button', { name: 'Second nearby point' }),
    ],
  },
  {
    name: 'interactive-map-static-dark',
    story: dark.Static,
    storyId: 'components-interactivemap--static',
    testId: 'interactive-map-static',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-static'),
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
    name: 'interactive-map-gestures-disabled-dark',
    story: dark.GesturesDisabled,
    storyId: 'components-interactivemap--gestures-disabled',
    testId: 'interactive-map-gestures-disabled',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-gestures-disabled'),
    imageAlt: 'Synthetic wide image',
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'interactive-map-details-at-center-dark',
    story: dark.DetailsAtCenter,
    storyId: 'components-interactivemap--details-at-center',
    testId: 'interactive-map-details-center',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-details-center'),
    imageAlt: 'Synthetic wide image',
    beforeScreenshot: async () => {
      await userEvent.click(page.getByRole('button', { name: 'Center point' }));
    },
    visible: [
      wideImage,
      page.getByRole('button', { name: 'Center point' }),
      page.getByText('Details shown beside the center point.'),
    ],
  },
  {
    name: 'interactive-map-details-near-edge-dark',
    story: dark.DetailsNearEachEdge,
    storyId: 'components-interactivemap--details-near-each-edge',
    testId: 'interactive-map-details-near-edge',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-details-near-edge'),
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
    name: 'interactive-map-connected-pairs-dark',
    story: dark.ConnectedPairs,
    storyId: 'components-interactivemap--connected-pairs',
    testId: 'interactive-map-connected-pairs',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-connected-pairs'),
    imageAlt: 'Synthetic wide image',
    connectorCount: 2,
    visible: [wideImage, ...wideMarkers],
  },
  {
    name: 'interactive-map-zoomed-lines-selection-dark',
    story: dark.ZoomedWithLinesAndSelection,
    storyId: 'components-interactivemap--zoomed-with-lines-and-selection',
    testId: 'interactive-map-zoomed-lines-selection',
    width: 720,
    height: 400,
    element: page.getByTestId('interactive-map-zoomed-lines-selection'),
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
    name: 'interactive-map-saved-restored-view-dark',
    story: dark.SavedAndRestoredView,
    storyId: 'components-interactivemap--saved-and-restored-view',
    testId: 'interactive-map-saved-restored',
    width: 720,
    height: 440,
    element: page.getByTestId('interactive-map-saved-restored'),
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
