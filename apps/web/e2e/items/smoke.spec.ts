import { fixtureRelease } from '../../src/mocks/release';
import { expect, test } from '../fixtures';

import { ItemsPage } from './page/items-page';

const SCROLLS = '/maplestory/items/use/scrolls';
const OTHER_USE = '/maplestory/items/use/other-use';

test('identical items share a card and switch versions in the drawer', async ({
  page,
}) => {
  const items = new ItemsPage(page);
  await items.goto(
    '/maplestory/items/use/potions-and-food?q=Silverleaf%20Draught',
  );
  await expect(page.getByText('1 Item', { exact: true }).first()).toBeVisible();
  const card = page
    .locator('[data-record-card]')
    .filter({ has: items.item('Silverleaf Draught') });
  await expect(card).toContainText('2 versions');
  await items.itemAction('Silverleaf Draught').click();
  const drawer = page.getByRole('dialog', { name: 'Silverleaf Draught' });
  const versions = drawer.getByRole('region', { name: 'Versions' });
  await expect(versions).toContainText('Quest reward');
  const second = versions.getByRole('button', {
    name: /Version 2.*No known quest reward/u,
  });
  await second.click();
  // The open version is the highlighted one.
  await expect(second).toHaveAttribute('data-variant', 'light');
});

test('a scroll tier opens that scroll in the existing drawer', async ({
  page,
}) => {
  const items = new ItemsPage(page);
  await items.goto(SCROLLS);
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
  const tiers = drawer.getByRole('region', { name: 'Scroll tiers' });
  await expect(tiers.locator('[aria-current="true"]')).toContainText('Greater');
  await tiers.getByRole('button', { name: /Lesser.*80% success/u }).click();
  await expect(
    page.getByRole('dialog', { name: 'Lesser Practice Sword Scroll' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('dialog', { name: 'Lesser Practice Sword Scroll' })
      .getByRole('region', { name: 'Scroll tiers' })
      .locator('[aria-current="true"]'),
  ).toContainText('Lesser');
});

test('Scroll pills and filters count family cards', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The desktop sidebar covers the scroll filter journey.');
  const items = new ItemsPage(page);
  await items.goto(SCROLLS);
  await expect(items.summary).toHaveText('5 Items');

  await page.getByText('Weapons (1)', { exact: true }).click();
  await expect(items.summary).toHaveText('1 Item');
  await page.getByText('All (5)', { exact: true }).click();

  const equipment = page.getByRole('group', { name: 'Equipment' });
  const sword = equipment.getByRole('checkbox', {
    name: 'One Handed Sword (1)',
  });
  await sword.click();
  await expect(items.summary).toHaveText('1 Item');
  await sword.click();

  const stat = page.getByRole('group', { name: 'Stat' });
  await stat.getByRole('checkbox', { name: 'Magic defense (1)' }).click();
  await expect(items.summary).toHaveText('1 Item');
});

test('a scroll family matches the full name of any tier', async ({ page }) => {
  const items = new ItemsPage(page);
  await items.goto(`${SCROLLS}?q=Lesser%20Practice%20Sword%20Scroll`);
  await expect(items.summary).toHaveText('1 Item');
  await expect(items.item('One Handed Sword')).toBeVisible();
});

test('Other Use type pills keep untyped items under All', async ({ page }) => {
  const items = new ItemsPage(page);
  await items.goto(OTHER_USE);
  const allPill = page.getByText(/^All \((\d+)\)$/u).first();
  const allCount = Number(
    (await allPill.textContent())?.match(/\((\d+)\)/u)?.[1],
  );

  await page.getByText(/^Return scrolls \(\d+\)$/u).click();
  await expect(items.summary).toHaveText('1 Item');
  await expect(items.item('Plain Use Item')).toBeHidden();

  await page.getByText(`All (${allCount})`, { exact: true }).click();
  await expect(items.summary).toHaveText(`${allCount} Items`);
  await expect(items.item('Plain Use Item')).toBeVisible();
});
const POTIONS = '/maplestory/items/use/potions-and-food';
const PROJECTILES = '/maplestory/items/use/throwing-stars';
const QUEST_ITEMS = '/maplestory/items/etc/quest-items';
const MONSTER_DROPS = '/maplestory/items/etc/monster-drops';

test('Monster Drops landing lookup opens Not required sorted by sell price', async ({
  page,
  isMobile,
}) => {
  const items = new ItemsPage(page);
  await items.goto('/maplestory/items');
  const lookup = page.getByRole('link', {
    name: /^Drops no quest or recipe uses\s+\d+$/u,
  });
  const count = Number((await lookup.textContent())?.match(/(\d+)$/u)?.[1]);
  await lookup.click();
  await expect(page).toHaveURL(/\/items\/etc\/monster-drops.*dropUses/u);
  await expect(
    page.getByText(`${count} Items`, { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText(/^Not required \(/u)).toBeVisible();
  await expect(page).toHaveURL(/sort=sellPrice-desc/u);
  if (!isMobile) {
    await expect(page.getByRole('combobox', { name: 'Sort' })).toHaveValue(
      'Highest sell price',
    );
  }
});

test('Monster Drops mobile filters narrow by Monster', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The mobile drawer is the subject of this journey.');
  const items = new ItemsPage(page);
  await items.goto(MONSTER_DROPS);
  await page.getByRole('button', { name: /Filters/u }).click();
  const monster = page.getByRole('combobox', { name: 'Monster' });
  await monster.click();
  const option = page.getByRole('option').first();
  const name = await option.textContent();
  await option.click();
  await page
    .getByRole('button', { name: /Show \d+ Classic World items/u })
    .click();
  await expect(
    page.getByRole('button', { name: `Remove Monster: ${name}` }),
  ).toBeVisible();
  await expect(items.summary).toBeVisible();
});

test('Quest Items shows named requirements and filters by quest, then removes it', async ({
  page,
  isMobile,
}) => {
  const items = new ItemsPage(page);
  await items.goto(QUEST_ITEMS);
  await expect(
    page.getByText('For the quest Thread Trial', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText('For 2 quests', { exact: true }).first(),
  ).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: /Filters/u }).click();
  const quest = page.getByRole('combobox', { name: 'Quest' });
  await quest.fill('Thread Trial');
  await page.getByRole('option', { name: 'Thread Trial' }).click();
  if (isMobile)
    await page
      .getByRole('button', { name: /Show 2 Classic World items/u })
      .click();
  await expect(items.item('Many Quest Token')).toBeVisible();
  await expect(items.item('Quiet Gallery Note')).toBeHidden();
  await page
    .getByRole('button', { name: 'Remove Quest: Thread Trial' })
    .click();
  await expect(items.item('Quiet Gallery Note')).toBeVisible();
});

test('projectile categories show their class and keep attack sorting', async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'Desktop sidebar covers the projectile sort and second-build journey.',
  );
  const items = new ItemsPage(page);
  await items.goto(PROJECTILES);
  await expect(items.item('Practice Stars')).toBeVisible();
  await expect(page.getByText('Used by Thieves with a claw.')).toBeVisible();
  await expect(page.getByText('+27 attack', { exact: true })).toBeVisible();
  await expect(page.getByText('800 per stack', { exact: true })).toBeVisible();
  await expect(items.item('Silent Arrow')).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Sort' }).click();
  await page.getByRole('option', { name: 'Attack (high to low)' }).click();
  await expect(
    page.locator('[data-record-card-layout="compactMediaAside"] h3'),
  ).toContainText(['Practice Stars', 'Training Stars']);
  await expect(page).toHaveURL(/sort=attack-desc/u);

  await items.goto('/maplestory/items/use/arrows');
  await expect(items.item('Silent Arrow')).toBeVisible();
  await expect(
    page.getByText(
      'Used by Bowmen. Bows and crossbows each take their own arrows.',
    ),
  ).toBeVisible();
  await expect(items.item('Practice Stars')).toHaveCount(0);

  await items.goto('/maplestory/gms-v83/items/use/bullets');
  await expect(items.item('GMS Practice Bullet')).toBeVisible();
  await expect(page.getByText('Used by Pirates with a gun.')).toBeVisible();

  await items.goto('/maplestory/gms-v83/items/use/monster-cards');
  await expect(items.item('GMS Native Alpha Card')).toBeVisible();
  await expect(
    page.getByText('+5 weapon attack', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Lasts 30 minutes', { exact: true }).first(),
  ).toBeVisible();
});

test('Potions pill, Buffs filter, and HP sort narrow and order cards', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Desktop sidebar covers the filter and sort journey.');
  const items = new ItemsPage(page);
  await items.goto(POTIONS);
  await expect(items.item('Practice Tonic A')).toBeVisible();
  await expect(
    page.getByText('+300 HP', { exact: true }).first(),
  ).toBeVisible();
  await page.getByText(/^Restores HP \(/u).click();
  await expect(items.item('Practice Tonic B')).toBeHidden();
  await expect(items.item('Sample Draught')).toBeVisible();
  await page.getByText(/^Restores MP \(/u).click();
  await expect(items.item('Sample Draught')).toBeVisible();
  await page.getByText(/^Restores HP \(/u).click();
  const buffs = page.getByRole('group', { name: 'Buff stat' });
  await buffs.getByRole('checkbox', { name: /^Weapon attack \(/u }).click();
  await expect(items.item('Zesty Tonic')).toBeVisible();
  await expect(items.item('Brisk Tonic')).toBeVisible();
  await page.getByRole('combobox', { name: 'Sort' }).click();
  await page.getByRole('option', { name: 'HP (low to high)' }).click();
  await expect(
    page.locator('[data-record-card-layout="compactMediaAside"] h3'),
  ).toContainText(['Zesty Tonic', 'Brisk Tonic']);
  await expect(page).toHaveURL(/sort=hp-asc/u);
});

test('Chairs and Cash Shop show published facts and coverage-based pills', async ({
  page,
  isMobile,
}) => {
  // Wait for hydration before using the sort menu.
  const items = new ItemsPage(page);
  await items.goto('/maplestory/items/setup/chairs');
  await expect(page.getByText('Amber Seat')).toBeVisible();
  await expect(page.getByText('+50 HP', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/^Recovers HP \(/u)).toBeVisible();
  await expect(page.getByText(/^Recovers MP \(/u)).toBeVisible();
  if (!isMobile) {
    await page.getByRole('combobox', { name: 'Sort' }).click();
    await page.getByRole('option', { name: 'Recovery' }).click();
    await expect(
      page.locator('[data-record-card-layout="compactMediaAside"] h3'),
    ).toContainText([
      'Green Seat',
      'Amber Seat',
      'Azure Seat',
      'Blue Seat',
      'Paper Kite',
    ]);
  }

  await items.goto('/maplestory/items/cash/cash-shop');
  await expect(page.getByText('120 NX')).toBeVisible();
  await expect(page.getByText(/^Listed \(/u)).toBeVisible();
  await expect(page.getByText(/^Not listed \(/u)).toBeVisible();

  await items.goto('/maplestory/gms-v83/items/cash/cash-shop');
  await expect(page.getByText('GMS Cash Badge')).toBeVisible();
  await expect(page.getByText(/^Listed \(/u)).toHaveCount(0);
});

test('Items category is server rendered with metadata and stable addresses', async ({
  page,
  request,
}) => {
  const response = await request.get(SCROLLS);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('MapleStory Classic World Scrolls');
  expect(html).toContain('One Handed Sword');
  expect(html).toContain('rel="canonical"');
  expect(html).toContain(SCROLLS);
  expect(html).toContain('Item categories');

  const alternate = await request.get('/maplestory/gms-v83/items/use/scrolls');
  expect(alternate.status()).toBe(200);
  expect(await alternate.text()).toContain('MapleStory GMS v83 Scrolls');

  for (const path of [
    '/maplestory/items',
    '/maplestory/items/use',
    '/maplestory/items/etc',
    '/maplestory/items/setup',
    '/maplestory/items/cash',
    '/maplestory/items/all',
  ])
    expect((await request.get(path)).status(), path).toBe(200);

  for (const path of [
    '/maplestory/cw-launch/items/use/scrolls',
    '/maplestory/no-build/items/use/scrolls',
    '/maplestory/items/unknown',
    '/maplestory/items/etc/scrolls',
    '/maplestory/items/use/recovery',
    '/maplestory/items/practice-tonic-123',
  ])
    expect((await request.get(path)).status(), path).toBe(404);

  const searched = await request.get(`${SCROLLS}?q=practice`);
  expect(await searched.text()).toContain('noindex,follow');
  const items = new ItemsPage(page);
  await items.goto(SCROLLS);
  await expect(items.heading()).toHaveText('MapleStory Classic World Scrolls');
  await expect(items.item('Unsorted Practice Scroll')).toBeVisible();
});

test('Items category rail goes through the group and keeps search in browser history', async ({
  page,
  isMobile,
}) => {
  const items = new ItemsPage(page);
  await items.goto(`${SCROLLS}?q=practice`);
  if (isMobile) {
    const trigger = page.getByRole('button', {
      name: /Item categories: Scrolls/u,
    });
    await trigger.click();
    const drawer = page.getByRole('dialog', { name: 'Item categories' });
    await expect(drawer).toBeVisible();
    await page.goBack();
    await expect(drawer).toBeHidden();
    await expect(page).toHaveURL(`${SCROLLS}?q=practice`);
    await expect(trigger).toBeFocused();
    return;
  }
  await expect(
    items.rail.getByRole('link', { name: /^Throwing Stars/u }),
  ).toHaveCount(0);
  await items.rail.getByRole('link', { name: 'Use', exact: true }).click();
  await expect(page).toHaveURL('/maplestory/items/use?q=practice');
  await items.rail.getByRole('link', { name: /^Throwing Stars/u }).click();
  await expect(page).toHaveURL(
    '/maplestory/items/use/throwing-stars?q=practice',
  );
  await page.goBack();
  await expect(page).toHaveURL('/maplestory/items/use?q=practice');
  await page.goBack();
  await expect(page).toHaveURL(`${SCROLLS}?q=practice`);
  await page.goForward();
  await expect(page).toHaveURL('/maplestory/items/use?q=practice');
  await page.goForward();
  await expect(page).toHaveURL(
    '/maplestory/items/use/throwing-stars?q=practice',
  );
  await page.reload();
  await expect(items.heading()).toHaveText(
    'MapleStory Classic World Throwing Stars',
  );
});

test('Items sort and page stay in the address', async ({ page, isMobile }) => {
  test.skip(
    isMobile,
    'Desktop sort and pagination journey covers the address.',
  );
  const items = new ItemsPage(page);
  await items.goto('/maplestory/items/etc/monster-drops?pageSize=25');
  await page.getByRole('combobox', { name: 'Sort' }).click();
  await page.getByRole('option', { name: 'Name (Z–A)' }).click();
  await expect(page).toHaveURL(/sort=name-desc/u);
  await page.getByRole('link', { name: 'Page 2' }).click();
  await expect(page).toHaveURL(/page=2/u);
  await page.reload();
  await expect(page).toHaveURL(/page=2/u);
  await expect(items.heading()).toHaveText(
    'MapleStory Classic World Monster Drops',
  );
});

test('Items category does not scroll horizontally at 320px', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Mobile viewport covers the 320px overflow check.');
  await page.setViewportSize({ width: 320, height: 700 });
  const items = new ItemsPage(page);
  await items.goto(SCROLLS);
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});

test('Items card opens and closes the item drawer with focus return and stable address', async ({
  page,
}) => {
  const path = '/maplestory/items/use/potions-and-food?q=Sample';
  const items = new ItemsPage(page);
  await items.goto(path);

  const cardButton = items.itemAction('Sample Draught');
  await expect(cardButton).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(cardButton).toHaveAttribute('aria-expanded', 'false');

  await cardButton.click();
  const drawer = page.getByRole('dialog', { name: 'Sample Draught' });
  await expect(drawer).toBeVisible();
  await expect(cardButton).toHaveAttribute('aria-expanded', 'true');
  await expect(drawer).toContainText('Potions & Food');
  await expect(drawer).toContainText('Restores 150 HP');
  await expect(drawer).toContainText('Restores 80 MP');
  await expect(drawer).toContainText('Sells for 1,200 mesos');
  await expect(page).toHaveURL(path);

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(cardButton).toHaveAttribute('aria-expanded', 'false');
  await expect(cardButton).toBeFocused();
  await expect(page).toHaveURL(path);

  await cardButton.click();
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Close details' }).click();
  await expect(drawer).toBeHidden();
  await expect(cardButton).toHaveAttribute('aria-expanded', 'false');
  await expect(cardButton).toBeFocused();
  await expect(page).toHaveURL(path);

  await cardButton.click();
  await expect(drawer).toBeVisible();
  await page.goBack();
  await expect(drawer).toBeHidden();
  await expect(cardButton).toHaveAttribute('aria-expanded', 'false');
  await expect(cardButton).toBeFocused();
  await expect(page).toHaveURL(path);
});

test('Items drawer shortens monster lists beyond the limit and expands on request', async ({
  page,
}) => {
  const items = new ItemsPage(page);
  await items.goto('/maplestory/items/etc/monster-drops?q=Pebble%20Shard%2001');

  await items.itemAction('Pebble Shard 01').click();
  const drawer = page.getByRole('dialog', { name: 'Pebble Shard 01' });
  const monsters = drawer.getByRole('region', { name: 'Dropped by monsters' });
  await expect(monsters.getByRole('listitem')).toHaveCount(6);
  const showAll = monsters.getByRole('button', { name: 'Show all 7' });
  await expect(showAll).toBeVisible();
  await showAll.click();
  await expect(monsters.getByRole('listitem')).toHaveCount(7);
  await expect(showAll).toBeHidden();
});

test('Items drawer keeps item facts when connections fail, hides diagnostics, and recovers on retry', async ({
  page,
}) => {
  const recipePath = `/${fixtureRelease.builds.get('cw-launch')!.itemRelatedEntityBrowse['used-in-recipe']!.path}`;
  const items = new ItemsPage(page);
  await items.goto('/maplestory/items/etc/ores-and-gems');

  await page.evaluate((path) => {
    const originalFetch = window.fetch.bind(window);
    let failOnce = true;
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (failOnce && new URL(url).pathname === path) {
        failOnce = false;
        return new Response('Unavailable', { status: 503 });
      }
      return originalFetch(input, init);
    };
  }, recipePath);

  await items.itemAction('Woven Thread').click();
  const drawer = page.getByRole('dialog', { name: 'Woven Thread' });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('Ores & Gems');
  await expect(drawer).toContainText('Sells for 35 mesos');
  await expect(drawer.getByRole('alert')).toHaveText(
    'Quests, recipes and monsters could not be loaded.',
  );
  await expect(drawer).not.toContainText('503');
  await expect(drawer).not.toContainText('v2/items');

  await drawer.getByRole('button', { name: 'Try again' }).click();
  await expect(drawer).toContainText('Thread Trial');
  await expect(drawer).toContainText('4 needed');
  await expect(drawer).toContainText('Level 8');
  await expect(drawer).toContainText('Paper Kite');
  await expect(drawer).toContainText('2 needed');
  await expect(drawer).toContainText('Crowned Warden');
  await expect(drawer).toContainText('Level 17');
  await expect(drawer).toContainText('Source: GMS v83 Monster Book.');
});

test('/items/all searches by name and exact id, updates pills, filters, and stays noindex', async ({
  page,
  request,
  isMobile,
}) => {
  for (const path of [
    '/maplestory/items/all',
    '/maplestory/items/all?q=Sample',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(await response.text(), path).toContain('noindex,follow');
  }

  const items = new ItemsPage(page);
  await items.goto('/maplestory/items/all');
  await expect(items.heading()).toHaveText('MapleStory Classic World Items');

  const search = page.getByRole('textbox', {
    name: 'Search Classic World items',
  });
  const pills = page.getByRole('region', { name: 'Category choices' });

  await search.fill('Sample');
  await expect(items.item('Sample Draught')).toBeVisible();
  await expect(items.item('Only Given Pebble')).toBeHidden();
  await expect(pills.getByText(/^Potions & Food \(\d+\)$/u)).toBeVisible();
  await expect(pills.getByText(/^Chairs \(/u)).toHaveCount(0);

  await pills.getByText(/^Potions & Food \(\d+\)$/u).click();
  await expect(items.item('Sample Draught')).toBeVisible();
  await expect(items.summary).toHaveText('1 Item');
  await pills.getByText(/^All \(\d+\)$/u).click();
  await expect(items.item('Sample Charm').first()).toBeVisible();

  await search.fill('only-given');
  await expect(items.item('Only Given Pebble')).toBeVisible();
  await expect(items.summary).toHaveText('1 Item');
  const card = page
    .locator('[data-record-card="true"]')
    .filter({ hasText: 'Only Given Pebble' });
  await expect(card).not.toContainText('only-given');

  await search.fill('only-giv');
  await expect(items.item('Only Given Pebble')).toBeHidden();
  await expect(items.summary).toHaveText('0 Items');

  await search.fill('');
  await expect(page).toHaveURL('/maplestory/items/all');
  if (isMobile) {
    await page.getByRole('button', { name: /Quest reward/u }).click();
    const filterDrawer = page.getByRole('dialog');
    await filterDrawer.getByRole('checkbox', { name: /^Yes \(/u }).click();
    await filterDrawer.getByRole('button', { name: /^Show /u }).click();
  } else {
    const questReward = page.getByRole('group', { name: 'Quest reward' });
    await questReward.getByRole('checkbox', { name: /^Yes \(/u }).click();
  }
  await expect(items.item('Only Given Pebble')).toBeVisible();
  await expect(items.item('Only Taken Sprout')).toBeHidden();
});

test('/items/all rail group counts follow search and filters and match after choosing a group', async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'Desktop rail covers persistent filter-aware group counts.',
  );
  const items = new ItemsPage(page);
  await items.goto('/maplestory/items/all');

  const search = page.getByRole('textbox', {
    name: 'Search Classic World items',
  });
  await search.fill('Pebble');

  const useLink = items.rail.getByRole('link', { name: /^Use\s+\d+$/u });
  const etcLink = items.rail.getByRole('link', { name: /^ETC\s+\d+$/u });
  const setupLink = items.rail.getByRole('link', { name: /^Set-up\s+0$/u });
  await expect(useLink).toBeVisible();
  await expect(etcLink).toBeVisible();
  await expect(setupLink).toBeVisible();

  const useText = (await useLink.textContent()) ?? '';
  const useCount = Number(useText.match(/(\d+)$/u)?.[1]);
  expect(useCount).toBeGreaterThan(0);

  const requiredByQuests = page.getByRole('group', {
    name: 'Required by quests',
  });
  await requiredByQuests.getByRole('checkbox', { name: /^Yes \(/u }).click();
  await expect(
    items.rail.getByRole('link', { name: /^Use\s+0$/u }),
  ).toBeVisible();
  await requiredByQuests.getByRole('checkbox', { name: /^Yes \(/u }).click();

  await useLink.click();
  await expect(page).toHaveURL('/maplestory/items/use?q=Pebble');
  await expect(items.heading()).toHaveText(
    'MapleStory Classic World Use Items',
  );
});

test('Items group page lists multiple categories and filters with Category pills', async ({
  page,
  isMobile,
}) => {
  const items = new ItemsPage(page);
  await items.goto('/maplestory/items/etc');
  await expect(items.heading()).toHaveText(
    'MapleStory Classic World ETC Items',
  );

  const pills = page.getByRole('region', { name: 'Category choices' });
  await expect(pills.getByText(/^Ores & Gems \(\d+\)$/u)).toBeVisible();
  await expect(pills.getByText(/^Monster Drops \(\d+\)$/u)).toBeVisible();
  await expect(pills.getByText(/^Potions & Food \(/u)).toHaveCount(0);
  await expect(items.item('Lamplight Ore')).toBeVisible();
  await expect(items.item('Only Given Pebble')).toBeVisible();

  await pills.getByText(/^Ores & Gems \(\d+\)$/u).click();
  await expect(items.item('Lamplight Ore')).toBeVisible();
  await expect(items.item('Only Given Pebble')).toBeHidden();
  await pills.getByText(/^All \(\d+\)$/u).click();
  await expect(items.item('Only Given Pebble')).toBeVisible();

  const cardButton = page
    .locator('[data-record-card="true"]')
    .filter({ hasText: 'Only Given Pebble' })
    .locator('button')
    .first();
  await cardButton.click();
  const drawer = page.getByRole('dialog', { name: 'Only Given Pebble' });
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(cardButton).toBeFocused();

  if (isMobile) {
    const trigger = page.getByRole('button', { name: /Item categories: ETC/u });
    await trigger.click();
    const navDrawer = page.getByRole('dialog', { name: 'Item categories' });
    await expect(navDrawer).toBeVisible();
    await page.goBack();
    await expect(navDrawer).toBeHidden();
    await expect(trigger).toBeFocused();
  }

  const search = page.getByRole('textbox', {
    name: 'Search Classic World items',
  });
  await search.fill('Only Given Pebble');
  await expect(items.summary).toHaveText('1 Item');
  await search.clear();
  // Phones keep the category rail in a drawer, covered above.
  if (isMobile) return;
  await items.rail
    .getByRole('link', { name: /^Monster Drops\s+\d+$/u })
    .click();
  await expect(page).toHaveURL('/maplestory/items/etc/monster-drops');
});

test('Items landing search suggestions and Crafting ingredients lookup', async ({
  page,
}) => {
  const items = new ItemsPage(page);
  await items.goto('/maplestory/items');

  const dataRequests: string[] = [];
  const onRequest = (req: { resourceType(): string; url(): string }) => {
    if (req.resourceType() !== 'image') dataRequests.push(req.url());
  };
  page.on('request', onRequest);

  const search = page.getByRole('combobox', {
    name: 'Search Classic World items',
  });
  await search.fill('Pebble');

  const options = page.getByRole('option');
  await expect(options).toHaveCount(7);
  await expect(
    page.getByRole('option', { name: 'See all results' }),
  ).toBeVisible();
  expect(dataRequests).toEqual([]);

  // No suggestions when nothing matches, and Enter submits to /items/all.
  await search.fill('no-such-item-xyz');
  await expect(options).toHaveCount(0);
  expect(dataRequests).toEqual([]);
  page.off('request', onRequest);

  await search.press('Enter');
  await expect(page).toHaveURL('/maplestory/items/all?q=no-such-item-xyz');
  await expect(items.summary).toHaveText('0 Items');

  // Pointer choice opens the item's category page searched by its name.
  await items.goto('/maplestory/items');
  await search.fill('Only Given');
  await page.getByRole('option', { name: /Only Given Pebble/u }).click();
  await expect(page).toHaveURL(
    /\/maplestory\/items\/etc\/other-etc\?q=Only(\+|%20)Given(\+|%20)Pebble$/u,
  );
  await expect(items.item('Only Given Pebble')).toBeVisible();

  // Keyboard choice opens the item's category page searched by its name.
  await items.goto('/maplestory/items');
  await search.fill('Sample Draught');
  await expect(
    page.getByRole('option', { name: /Sample Draught/u }),
  ).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page).toHaveURL(
    /\/maplestory\/items\/use\/potions-and-food\?q=Sample(\+|%20)Draught$/u,
  );
  await expect(items.item('Sample Draught')).toBeVisible();

  await items.goto('/maplestory/items');
  await search.fill('Practice Stars');
  await expect(
    page.getByRole('option', { name: /Practice Stars.*Throwing Stars/u }),
  ).toBeVisible();
  await page
    .getByRole('option', { name: /Practice Stars.*Throwing Stars/u })
    .click();
  await expect(page).toHaveURL(
    /\/maplestory\/items\/use\/throwing-stars\?q=Practice(\+|%20)Stars$/u,
  );

  // "See all results" opens /items/all with the query.
  await items.goto('/maplestory/items');
  await search.fill('Sample');
  await page.getByRole('option', { name: 'See all results' }).click();
  await expect(page).toHaveURL('/maplestory/items/all?q=Sample');
  await expect(items.item('Sample Draught')).toBeVisible();

  // Crafting ingredients lookup opens /items/all?usedInRecipes=true with matching count.
  await items.goto('/maplestory/items');
  const craftingLink = page.getByRole('link', {
    name: /^Crafting ingredients\s+\d+$/u,
  });
  await expect(craftingLink).toBeVisible();
  const craftingText = (await craftingLink.textContent()) ?? '';
  const craftingCount = Number(craftingText.match(/(\d+)$/u)?.[1]);
  expect(craftingCount).toBeGreaterThan(0);

  await craftingLink.click();
  await expect(page).toHaveURL('/maplestory/items/all?usedInRecipes=true');
  await expect(items.summary).toHaveText(
    `${craftingCount} ${craftingCount === 1 ? 'Item' : 'Items'}`,
  );
  await expect(items.item('Woven Thread')).toBeVisible();
});

test('Items landing quest and monster lookups filter cross-category results', async ({
  page,
}) => {
  const items = new ItemsPage(page);
  await items.goto('/maplestory/items');

  const quest = page.getByRole('combobox', {
    name: 'Items a quest requires',
  });
  await quest.fill('Thread Trial');
  await page.getByRole('option', { name: 'Thread Trial' }).click();
  await expect(page).toHaveURL(/\/maplestory\/items\/all\?quest=/u);
  await expect(items.summary).toHaveText(/^[1-9]\d* Items?$/u);
  await expect(items.item('Many Quest Token')).toBeVisible();
  await expect(items.item('Practice Cap')).toBeHidden();

  await items.goto('/maplestory/items');
  const monster = page.getByRole('combobox', {
    name: 'Items a monster drops',
  });
  await monster.fill('Crowned Warden');
  await page.getByRole('option', { name: 'Crowned Warden' }).click();
  await expect(page).toHaveURL(/\/maplestory\/items\/all\?monster=/u);
  await expect(items.summary).toHaveText(/^[1-9]\d* Items?$/u);
  await expect(
    page.getByRole('button', { name: 'Remove Monster: Crowned Warden' }),
  ).toBeVisible();
  await expect(
    page.locator('[data-record-card-layout="compactMediaAside"]').first(),
  ).toBeVisible();
});
