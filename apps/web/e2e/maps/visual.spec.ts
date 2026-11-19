import type { Page } from '@playwright/test';

import { mapPublicId } from '../../src/mocks/release';
import { expect, test } from '../fixtures';

async function captureReady(page: Page): Promise<void> {
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
  await page.evaluate(() => localStorage.clear());
}

const mapPath = `/maplestory/maps/lantern-square-${mapPublicId({ sourceId: 'cw-launch:lantern-square' })}`;

test('desktop Map Detail page', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 2200 });
  await page.goto(mapPath);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lantern Square' }),
  ).toBeVisible();
  await captureReady(page);
  await expect(page).toHaveScreenshot('desktop-map-detail.png');
});

test('mobile Map Detail page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 3200 });
  await page.goto(mapPath);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lantern Square' }),
  ).toBeVisible();
  await captureReady(page);
  await expect(page).toHaveScreenshot('mobile-map-detail.png');
});
