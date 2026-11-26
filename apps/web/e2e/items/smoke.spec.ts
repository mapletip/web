import { fixtureRelease } from '../../src/mocks/release';
import { expect, test } from '../fixtures';

import { ItemsPage } from './page/items-page';

const SCROLLS = '/maplestory/items/use/scrolls';

test('Items category is server rendered with metadata and stable addresses', async ({
  page,
  request,
}) => {
  const response = await request.get(SCROLLS);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('MapleStory Classic World Scrolls');
  expect(html).toContain('Practice Sword Scroll');
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
    items.rail.getByRole('link', { name: /^Stars & Arrows/u }),
  ).toHaveCount(0);
  await items.rail.getByRole('link', { name: 'Use', exact: true }).click();
  await expect(page).toHaveURL('/maplestory/items/use?q=practice');
  await items.rail.getByRole('link', { name: /^Stars & Arrows/u }).click();
  await expect(page).toHaveURL(
    '/maplestory/items/use/stars-and-arrows?q=practice',
  );
  await page.goBack();
  await expect(page).toHaveURL('/maplestory/items/use?q=practice');
  await page.goBack();
  await expect(page).toHaveURL(`${SCROLLS}?q=practice`);
  await page.goForward();
  await expect(page).toHaveURL('/maplestory/items/use?q=practice');
  await page.goForward();
  await expect(page).toHaveURL(
    '/maplestory/items/use/stars-and-arrows?q=practice',
  );
  await page.reload();
  await expect(items.heading()).toHaveText(
    'MapleStory Classic World Stars & Arrows',
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
  const neededQuestPath = `/${fixtureRelease.builds.get('cw-launch')!.itemRelatedEntityBrowse['needed-for-quest']!.path}`;
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
  }, neededQuestPath);

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
  await expect(items.summary).toHaveText(
    `${useCount} ${useCount === 1 ? 'Item' : 'Items'}`,
  );
});
