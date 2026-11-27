import type { Page } from '@playwright/test';

import { expect } from './fixtures';

/** Wait for the page to hydrate and its visible images to load before interacting or capturing. */
export async function browseReady(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Server HTML is visible before React attaches handlers; interacting earlier is a race.
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    return (
      main !== null &&
      Object.keys(main).some((key) => key.startsWith('__reactProps'))
    );
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForFunction(() =>
    [...document.images]
      .filter((image) => {
        const bounds = image.getBoundingClientRect();
        return (
          bounds.width > 0 &&
          bounds.height > 0 &&
          bounds.top < window.innerHeight &&
          bounds.bottom > 0 &&
          bounds.left < window.innerWidth &&
          bounds.right > 0
        );
      })
      .every((image) => image.complete),
  );
}
