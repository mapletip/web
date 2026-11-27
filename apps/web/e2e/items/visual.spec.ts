import { browseReady } from '../browse-ready';
import { expect, test } from '../fixtures';

const CATEGORY = '/maplestory/items/use/scrolls';
const POTIONS = '/maplestory/items/use/potions-and-food';

test('desktop Items category', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(CATEGORY);
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-items-category.png');
});

test('mobile Items category', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(CATEGORY);
  await browseReady(page);
  await expect(page).toHaveScreenshot('mobile-items-category.png');
});

test('mobile Items category drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 950 });
  await page.goto(CATEGORY);
  await browseReady(page);
  await page.getByRole('button', { name: /Item categories: Scrolls/u }).click();
  await expect(
    page.getByRole('dialog', { name: 'Item categories' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-items-category-drawer.png');
});

test('desktop Items empty state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${CATEGORY}?q=no-such-item`);
  await browseReady(page);
  await expect(
    page.getByRole('button', { name: 'Clear filters' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-empty.png');
});

test('desktop Items unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('http://127.0.0.1:4174/maplestory/items/use/scrolls');
  await expect(
    page.getByRole('heading', { name: 'Something went wrong' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-unavailable.png');
});

test('desktop Items drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(POTIONS);
  await browseReady(page);
  await page
    .getByRole('button', { name: 'Sample Draught', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Sample Draught' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-drawer.png');
});

test('mobile Items drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 950 });
  await page.goto(POTIONS);
  await browseReady(page);
  await page
    .getByRole('button', { name: 'Sample Draught', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Sample Draught' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-items-drawer.png');
});
