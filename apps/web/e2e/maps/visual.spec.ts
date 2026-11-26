import type { Page } from '@playwright/test';

import { mapPublicId } from '../../src/mocks/release';
import { browseReady } from '../browse-ready';
import { expect, test } from '../fixtures';

async function captureReady(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Explore map' })).toBeEnabled();
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

test('desktop Map Browse area page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/maplestory/maps/in/lantern-hills/lamplight');
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-map-browse-area.png');
});

test('desktop Map Browse filtered by a level range', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(
    `/maplestory/maps?level=${encodeURIComponent('{"min":3,"max":5}')}`,
  );
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-map-browse-filtered.png');
});

test('mobile Map Browse cards', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto('/maplestory/maps');
  await browseReady(page);
  await expect(page).toHaveScreenshot('mobile-map-browse.png');
});

test('mobile Map Browse filtered by HP drain', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 950 });
  await page.goto(
    `/maplestory/gms-v83/maps?features=${encodeURIComponent('["hp-drain"]')}`,
  );
  await browseReady(page);
  await expect(page.getByTestId('map-card-footer')).toContainText(
    '25 HP drain',
  );
  await expect(page).toHaveScreenshot('mobile-map-browse-hp-drain.png');
});
