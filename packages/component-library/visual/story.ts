import type { Page } from 'playwright/test';
import { expect } from 'playwright/test';

export interface VisualCase {
  /** Stable identifier, also the baseline file name (`<name>-linux.png`). */
  readonly name: string;
  /** Storybook story id, as published in the built `index.json`. */
  readonly story: string;
  readonly width: number;
  readonly height: number;
  readonly colorScheme: 'light' | 'dark';
  /** Selectors that must be visible before capture (layout/state proof). */
  readonly visible?: readonly string[];
  /** Selectors that must be hidden before capture (breakpoint proof). */
  readonly hidden?: readonly string[];
  /** Capture one element instead of the whole viewport. */
  readonly element?: string;
}

let storyIndex: Promise<ReadonlySet<string>> | undefined;

function loadStoryIndex(page: Page): Promise<ReadonlySet<string>> {
  storyIndex ??= page.request.get('/index.json').then(async (response) => {
    expect(
      response.ok(),
      'Storybook must serve /index.json from the built static site',
    ).toBe(true);
    const body = (await response.json()) as {
      readonly entries?: Readonly<Record<string, unknown>>;
    };
    return new Set(Object.keys(body.entries ?? {}));
  });
  return storyIndex;
}

/**
 * Render one story in isolation with deterministic inputs, failing loudly when
 * the story no longer exists or Storybook could not render it.
 */
export async function openStory(
  page: Page,
  visualCase: VisualCase,
): Promise<void> {
  const ids = await loadStoryIndex(page);
  if (!ids.has(visualCase.story)) {
    throw new Error(
      `Story "${visualCase.story}" is missing from Storybook's index. It was ` +
        'renamed or removed; restore it or update the visual case in ' +
        'visual/storybook.visual.spec.ts (and its approved baseline).',
    );
  }

  await page.setViewportSize({
    width: visualCase.width,
    height: visualCase.height,
  });
  await page.goto(
    `/iframe.html?id=${visualCase.story}&viewMode=story&globals=colorScheme:${visualCase.colorScheme}`,
  );

  /*
   * Storybook always renders an empty `#error-message` element and fills it with
   * the failure reason (for example an unknown story id). Comparing that error
   * page with a component baseline would fail obscurely, so assert it stayed empty.
   */
  await expect(
    page.locator('#error-message'),
    `Story "${visualCase.story}" did not render (missing or renamed?)`,
  ).toHaveText('');
  await expect(
    page.locator('#storybook-root > *'),
    `Story "${visualCase.story}" rendered nothing`,
  ).not.toHaveCount(0);

  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images, (image) =>
        image.decode().catch(() => undefined),
      ),
    );
  });
}
