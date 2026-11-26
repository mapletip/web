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
