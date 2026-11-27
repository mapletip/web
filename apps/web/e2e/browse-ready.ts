import type { Page } from '@playwright/test';

import { expect } from './fixtures';

/** Wait for the shared browse frame and its visible images before a capture. */
export async function browseReady(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
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
