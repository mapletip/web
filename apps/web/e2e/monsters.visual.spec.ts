import type { MonsterPage } from './support/monster-page';
import { test, expect } from './support/test';

async function openBossesAndUndead(monsterPage: MonsterPage): Promise<void> {
  await monsterPage.filters.checkbox('Boss', /^Yes/u).click();
  await monsterPage.filters.checkbox('Undead', /^Yes/u).click();
}

test('desktop page with expanded drops and certainty details', async ({
  page,
  monsterPage,
}) => {
  await page.setViewportSize({ width: 1366, height: 2200 });
  await page.addInitScript(() => localStorage.clear());
  await monsterPage.goto();
  await monsterPage.captureReady();
  await monsterPage.drops.tableButton('Crowned Warden', 24).click();
  const panel = monsterPage.drops.panel('Crowned Warden', 24);
  const certainty = monsterPage.drops.certaintyButton(
    panel,
    'unconfirmed',
    'Practice Cap',
  );
  await certainty.focus();
  await certainty.hover();
  const detailDialog = monsterPage.drops.certaintyDialog(
    'Show unconfirmed drop details for Practice Cap',
  );
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog.getByText('Maybe')).toBeVisible();
  await expect(
    detailDialog.getByText('Source: GMS v83 Monster Book.'),
  ).toBeVisible();
  await monsterPage.captureReady();
  await expect(page).toHaveScreenshot('desktop-drops-expanded.png');
});

test('desktop page with boolean and range filters active in the rail', async ({
  page,
  monsterPage,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.addInitScript(() => localStorage.clear());
  await monsterPage.goto();
  await monsterPage.captureReady();
  await openBossesAndUndead(monsterPage);
  const summary = monsterPage.results.summary;
  const ratio = monsterPage.filters.facet('EXP / 100 HP');
  const seeMore = ratio.getByRole('button', { name: 'See more' });
  if (await seeMore.isVisible()) await seeMore.click();
  const buckets = ratio.getByRole('checkbox');
  for (let index = 0; index < (await buckets.count()); index += 1) {
    const bucket = buckets.nth(index);
    await bucket.click();
    if ((await summary.innerText()) === '1 Monster') break;
    await bucket.click();
  }
  await expect(summary).toHaveText('1 Monster');
  await expect(monsterPage.results.row(/Crowned Revenant/u)).toBeVisible();
  await monsterPage.captureReady();
  await expect(page).toHaveScreenshot('desktop-filtered-rail.png');
});

test('mobile cards show the opening fixture rows', async ({
  page,
  monsterPage,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.clear());
  await monsterPage.goto();
  await page.evaluate(() => window.scrollTo(0, 240));
  await monsterPage.captureReady();
  await expect(monsterPage.results.cards).toBeVisible();
  await expect(monsterPage.results.cardHeading('Plain Pebble')).toBeVisible();
  await expect(
    monsterPage.results.cardHeading('Twin Sprout').first(),
  ).toBeVisible();
  await expect(
    monsterPage.results.cardHeading('Twin Sprout').nth(1),
  ).toBeInViewport();
  await expect(page).toHaveScreenshot('mobile-cards.png');
});

test('mobile cards preserve unknown facts and long names', async ({
  page,
  monsterPage,
}) => {
  await page.setViewportSize({ width: 390, height: 3000 });
  await page.addInitScript(() => localStorage.clear());
  await monsterPage.goto();
  await monsterPage.captureReady();
  await expect(monsterPage.results.cardHeading('Patchy Records')).toBeVisible();
  await expect(
    monsterPage.results.cardHeading('Unnamed monster'),
  ).toBeVisible();
  await expect(
    monsterPage.results.cardHeading(
      'Extraordinarily Long Named Fixture Creature Of The Far Northern Reaches',
    ),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-cards-states.png');
});

test('mobile drops drawer opens over the active boss filter', async ({
  page,
  monsterPage,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.clear());
  await monsterPage.goto();
  await monsterPage.captureReady();
  const filters = await monsterPage.filters.openAll();
  await monsterPage.filters.checkbox('Boss', /^Yes/u, filters).click();
  await monsterPage.filters.applyButton(filters).click();
  await monsterPage.drops.cardButton('Crowned Warden', 24).click();
  const drawer = monsterPage.drops.drawer('Crowned Warden');
  await expect(monsterPage.drops.category(drawer, 'Drops (24)')).toBeVisible();
  await expect(monsterPage.drops.certaintyLegend(drawer)).toBeVisible();
  await monsterPage.captureReady();
  await expect(page).toHaveScreenshot('mobile-drops-drawer.png');
});

test('generic unavailable page has no server diagnostics', async ({
  page,
  monsterPage,
  expectedBrowserErrors,
}) => {
  expectedBrowserErrors.console.push(/Failed to load resource.*500/u);
  expectedBrowserErrors.console.push(
    /^Error: Monster data could not be loaded\./u,
  );
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.addInitScript(() => localStorage.clear());
  await monsterPage.goto('http://127.0.0.1:4174/maplestory/monsters');
  await monsterPage.captureReady();
  await expect(
    page.getByRole('heading', { name: 'Something went wrong' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('error-page.png');
});
