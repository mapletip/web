import { fixtureRelease } from '../../src/mocks/release';
import { browseReady } from '../browse-ready';
import { expect, test } from '../fixtures';

const LANDING = '/maplestory/items';
const GROUP = '/maplestory/items/etc';
const CATEGORY = '/maplestory/items/use/scrolls';
const ORES = '/maplestory/items/etc/ores-and-gems';
const ALL = '/maplestory/items/all';

test('desktop Items group', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(GROUP);
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-items-group.png');
});

test('mobile Items group', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(GROUP);
  await browseReady(page);
  await expect(page).toHaveScreenshot('mobile-items-group.png');
});

test('desktop Items landing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(LANDING);
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-items-landing.png');
});

test('mobile Items landing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(LANDING);
  await browseReady(page);
  await expect(page).toHaveScreenshot('mobile-items-landing.png');
});

test('desktop Items landing suggestions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(LANDING);
  await browseReady(page);
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    return (
      main !== null &&
      Object.keys(main).some((key) => key.startsWith('__reactProps'))
    );
  });
  await page
    .getByRole('combobox', { name: 'Search Classic World items' })
    .fill('Pebble');
  await expect(
    page.getByRole('option', { name: 'See all results' }),
  ).toBeVisible();
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-items-landing-suggestions.png');
});

test('desktop Items all', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(ALL);
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-items-all.png');
});

test('mobile Items all', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(ALL);
  await browseReady(page);
  await expect(page).toHaveScreenshot('mobile-items-all.png');
});

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
  await page.goto(ORES);
  await browseReady(page);
  await page.getByRole('button', { name: 'Woven Thread', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Woven Thread' });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('Thread Trial');
  await expect(drawer).toContainText('Paper Kite');
  await expect(drawer).toContainText('Crowned Warden');
  await expect(page).toHaveScreenshot('desktop-items-drawer.png');
});

test('mobile Items drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 950 });
  await page.goto(ORES);
  await browseReady(page);
  await page.getByRole('button', { name: 'Woven Thread', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Woven Thread' });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('Thread Trial');
  await expect(drawer).toContainText('Paper Kite');
  await expect(drawer).toContainText('Crowned Warden');
  await expect(page).toHaveScreenshot('mobile-items-drawer.png');
});

test('desktop Items drawer failed', async ({ page }) => {
  const neededQuestPath = `/${fixtureRelease.builds.get('cw-launch')!.itemRelatedEntityBrowse['needed-for-quest']!.path}`;
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(ORES);
  await browseReady(page);
  await page.evaluate((path) => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (new URL(url).pathname === path) {
        const response = await originalFetch(input, init);
        const bytes = new Uint8Array(await response.arrayBuffer());
        bytes[0] = (bytes[0] ?? 0) ^ 1;
        return new Response(bytes, {
          status: response.status,
          headers: { 'content-type': 'application/json' },
        });
      }
      return originalFetch(input, init);
    };
  }, neededQuestPath);
  await page.getByRole('button', { name: 'Woven Thread', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Woven Thread' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('alert')).toHaveText(
    'Quests, recipes and monsters could not be loaded.',
  );
  await expect(drawer.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-drawer-failed.png');
});
