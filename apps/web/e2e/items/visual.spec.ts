import { fixtureRelease } from '../../src/mocks/release';
import { browseReady } from '../browse-ready';
import { expect, test } from '../fixtures';

const LANDING = '/maplestory/items';
const GROUP = '/maplestory/items/etc';
const CATEGORY = '/maplestory/items/use/scrolls';

test('desktop Items scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(CATEGORY);
  await browseReady(page);
  await expect(
    page.getByText('5 Items', { exact: true }).first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-scrolls.png');
});

test('mobile Items scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1100 });
  await page.goto(CATEGORY);
  await browseReady(page);
  await expect(
    page.getByText('5 Items', { exact: true }).first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-items-scrolls.png');
});

test('desktop Items scrolls with two stats', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${CATEGORY}?q=shield`);
  await browseReady(page);
  await expect(page.getByText('1 Item', { exact: true }).first()).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-scrolls-two-stats.png');
});

test('desktop Items scrolls without tiers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/maplestory/gms-v83/items/use/scrolls');
  await browseReady(page);
  await expect(
    page.getByText('2 Items', { exact: true }).first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-scrolls-untiered.png');
});

test('desktop Items scroll tier drawer comparison', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(CATEGORY);
  await browseReady(page);
  const card = page
    .locator('[data-record-card-layout="identity"]')
    .filter({ has: page.getByRole('heading', { name: 'One Handed Sword' }) });
  await card
    .getByRole('button', { name: /Greater.*80% success.*can destroy item/u })
    .click();
  const drawer = page.getByRole('dialog', {
    name: 'Greater Practice Sword Scroll',
  });
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole('region', { name: 'Scroll tiers' }),
  ).toContainText('Lesser');
  await expect(drawer.locator('[aria-current="true"]')).toContainText(
    'Greater',
  );
  await expect(page).toHaveScreenshot('desktop-items-scroll-drawer.png');
});
const ORES = '/maplestory/items/etc/ores-and-gems';
const ALL = '/maplestory/items/all';
const CHAIRS = '/maplestory/items/setup/chairs';
const CASH_SHOP = '/maplestory/items/cash/cash-shop';
const POTIONS = '/maplestory/items/use/potions-and-food';
const PROJECTILES = '/maplestory/items/use/stars-and-arrows';
const MONSTER_CARDS = '/maplestory/gms-v83/items/use/monster-cards';
const QUEST_ITEMS = '/maplestory/items/etc/quest-items';
const MONSTER_DROPS = '/maplestory/items/etc/monster-drops';
const OTHER_USE = '/maplestory/items/use/other-use';
const PET_FOOD = '/maplestory/items/cash/pet-food';

test('desktop Items monster drops', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(MONSTER_DROPS);
  await browseReady(page);
  await expect(
    page.locator('[data-record-card-layout="quietIdentity"]').first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-drops.png');
});

test('mobile Items monster drops', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(MONSTER_DROPS);
  await browseReady(page);
  await expect(
    page.locator('[data-record-card-layout="quietIdentity"]').first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-items-drops.png');
});

test('desktop Items ores', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(ORES);
  await browseReady(page);
  await expect(
    page.locator('[data-record-card-layout="quietIdentity"]').first(),
  ).toBeVisible();
  await expect(page.getByText('Lamplight Ore')).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-ores.png');
});

test('mobile Items ores', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(ORES);
  await browseReady(page);
  await expect(
    page.locator('[data-record-card-layout="quietIdentity"]').first(),
  ).toBeVisible();
  await expect(page.getByText('Lamplight Ore')).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-items-ores.png');
});

test('desktop Items monster drops not required', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(MONSTER_DROPS);
  await browseReady(page);
  const pill = page.getByText(/^Not required \((\d+)\)$/u).first();
  const count = Number((await pill.textContent())?.match(/\((\d+)\)/u)?.[1]);
  await pill.click();
  await expect(
    page.getByText(`${count} Items`, { exact: true }).first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-drops-not-required.png');
});

test('mobile Items monster drops filters', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(MONSTER_DROPS);
  await browseReady(page);
  await page.getByRole('button', { name: /Filters/u }).click();
  await expect(page.getByRole('combobox', { name: 'Monster' })).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-items-drops-filters.png');
});

test('desktop Items quest items', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(QUEST_ITEMS);
  await browseReady(page);
  await page.getByText(/^Required by a quest \(/u).click();
  await expect(
    page.getByText('2 Items', { exact: true }).first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-quest-items.png');
});

test('mobile Items quest items', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(QUEST_ITEMS);
  await browseReady(page);
  await page.getByText(/^Required by a quest \(/u).click();
  await expect(
    page.getByText('2 Items', { exact: true }).first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-items-quest-items.png');
});

test('desktop Items projectiles', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(PROJECTILES);
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-items-projectiles.png');
});

test('mobile Items projectiles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(PROJECTILES);
  await browseReady(page);
  await expect(page).toHaveScreenshot('mobile-items-projectiles.png');
});

test('desktop Items monster cards', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(MONSTER_CARDS);
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-items-monster-cards.png');
});

test('desktop Items potions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(POTIONS);
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-items-potions.png');
});

test('mobile Items potions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(POTIONS);
  await browseReady(page);
  await expect(page).toHaveScreenshot('mobile-items-potions.png');
});

test('desktop Items potions filtered', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(POTIONS);
  await browseReady(page);
  await page.getByText(/^Buffs \(/u).click();
  await expect(
    page.getByText('3 Items', { exact: true }).first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-potions-filtered.png');
});

test('desktop Items text', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(OTHER_USE);
  await browseReady(page);
  await expect(
    page.locator('[data-record-card-layout="compactMediaAside"]').first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-text.png');
});

test('mobile Items text types', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1100 });
  await page.goto(OTHER_USE);
  await browseReady(page);
  const allPill = page.getByText(/^All \((\d+)\)$/u).first();
  const allCount = Number(
    (await allPill.textContent())?.match(/\((\d+)\)/u)?.[1],
  );
  await expect(allPill).toContainText(`(${allCount})`);
  await page.getByText(/^Return scrolls \(\d+\)$/u).click();
  await expect(page.getByText('1 Item', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Plain Use Item')).toBeHidden();
  await page.getByText(`All (${allCount})`, { exact: true }).click();
  await expect(
    page.getByText(`${allCount} Items`, { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('Plain Use Item')).toBeVisible();
  const returnScrolls = page.getByText(/^Return scrolls \(\d+\)$/u);
  await returnScrolls.click();
  await expect(page.getByText('1 Item', { exact: true }).first()).toBeVisible();
  // Show the chosen pill and no hover state in the capture.
  await returnScrolls.evaluate((element) =>
    element.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'instant',
    }),
  );
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot('mobile-items-text.png');
});

test('desktop Items pet food', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(PET_FOOD);
  await browseReady(page);
  await expect(page.getByText('Restores 30 fullness')).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-pet-food.png');
});

test('desktop Items chairs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(CHAIRS);
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-items-chairs.png');
});

test('mobile Items chairs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(CHAIRS);
  await browseReady(page);
  await expect(page).toHaveScreenshot('mobile-items-chairs.png');
});

test('desktop Items cash shop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(CASH_SHOP);
  await browseReady(page);
  await expect(page).toHaveScreenshot('desktop-items-cash-shop.png');
});

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
  await expect(
    page.getByRole('combobox', { name: 'Items a quest requires' }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Items a monster drops' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-landing.png');
});

test('mobile Items landing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.goto(LANDING);
  await browseReady(page);
  await expect(
    page.getByRole('combobox', { name: 'Items a quest requires' }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Items a monster drops' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-items-landing.png');
});

test('desktop Items landing suggestions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(LANDING);
  await browseReady(page);
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

test('desktop Items all filtered by a quest', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(LANDING);
  await browseReady(page);
  const quest = page.getByRole('combobox', {
    name: 'Items a quest requires',
  });
  await quest.fill('Thread Trial');
  await page.getByRole('option', { name: 'Thread Trial' }).click();
  await browseReady(page);
  const summary = page.getByText(/^\d+ Items?$/u).first();
  await expect(summary).toBeVisible();
  const count = Number((await summary.textContent())?.split(' ')[0]);
  await expect(
    page
      .getByText(`${count} ${count === 1 ? 'Item' : 'Items'}`, {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-all-quest.png');
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
  const recipePath = `/${fixtureRelease.builds.get('cw-launch')!.itemRelatedEntityBrowse['used-in-recipe']!.path}`;
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
  }, recipePath);
  await page.getByRole('button', { name: 'Woven Thread', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Woven Thread' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('alert')).toHaveText(
    'Quests, recipes and monsters could not be loaded.',
  );
  await expect(drawer.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page).toHaveScreenshot('desktop-items-drawer-failed.png');
});
