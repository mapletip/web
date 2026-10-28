import type { ComponentType } from 'react';
import { expect } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

/** A composed Storybook story, exposing the id Storybook publishes for it. */
export type VisualStory = ComponentType & { readonly id: string };

type Locator = ReturnType<typeof page.getByRole>;

/** One screenshot comparison, declared by the component that owns it. */
export interface VisualCase {
  /** Stable identifier, also the baseline file name. */
  readonly name: string;
  readonly story: VisualStory;
  /** Storybook id the story must publish, so a rename cannot pass silently. */
  readonly storyId: string;
  readonly width: number;
  readonly height: number;
  readonly visible?: readonly Locator[];
  readonly hidden?: readonly Locator[];
  /** Capture one element instead of the whole viewport. */
  readonly element?: Locator;
}

/**
 * Deterministic capture. Vitest exposes these per assertion rather than globally;
 * scrollbar chrome is hidden in .storybook/visual.setup.ts.
 */
const SCREENSHOT_OPTIONS = {
  screenshotOptions: { animations: 'disabled', caret: 'hide', scale: 'css' },
} as const;

/**
 * Mount the case's story at its viewport and wait until it is visually settled.
 *
 * Readiness is ordered deliberately: the composed story id is checked before
 * rendering, fonts are awaited only after the tree has requested them, and
 * decorative images must finish decoding before the capture.
 */
export async function openVisualCase(visualCase: VisualCase): Promise<void> {
  await page.viewport(visualCase.width, visualCase.height);

  expect(
    visualCase.story.id,
    `"${visualCase.name}" no longer resolves to ${visualCase.storyId}`,
  ).toBe(visualCase.storyId);

  const Story = visualCase.story;
  await render(<Story />);
  await document.fonts.ready;
  await Promise.all(
    [...document.images].map((image) => image.decode().catch(() => undefined)),
  );
}

/** Compare the case's element, or the whole viewport, with its baseline. */
export async function expectApprovedScreenshot(
  visualCase: VisualCase,
): Promise<void> {
  const target = visualCase.element ?? page;
  await expect(target).toMatchScreenshot(visualCase.name, SCREENSHOT_OPTIONS);
}
