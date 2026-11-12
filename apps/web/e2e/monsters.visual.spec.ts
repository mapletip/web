import type { MonsterPage } from './support/monster-page';
import { test, expect } from './support/test';

async function openBossesAndUndead(monsterPage: MonsterPage): Promise<void> {
  await monsterPage.filters.facet('Boss').checkbox(/^Yes/u).click();
  await monsterPage.filters.facet('Undead').checkbox(/^Yes/u).click();
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
  const certainty = panel.certaintyButton('unconfirmed', 'Practice Cap');
  await certainty.focus();
  await certainty.hover();
  const detailDialog = monsterPage.drops.certaintyDialog(
    'Show unconfirmed drop details for Practice Cap',
  );
  await expect(detailDialog.root).toBeVisible();
  await expect(detailDialog.text('Maybe')).toBeVisible();
  await expect(
    detailDialog.text('Source: GMS v83 Monster Book.'),
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
  const summary = monsterPage.summary;
  const ratio = monsterPage.filters.facet('EXP / 100 HP');
  const seeMore = ratio.seeMoreButton;
  if (await seeMore.isVisible()) await seeMore.click();
  const buckets = ratio.checkboxes;
  for (let index = 0; index < (await buckets.count()); index += 1) {
    const bucket = buckets.nth(index);
    await bucket.click();
    if ((await summary.innerText()) === '1 Monster') break;
    await bucket.click();
  }
  await expect(summary).toHaveText('1 Monster');
  await expect(monsterPage.table.row(/Crowned Revenant/u)).toBeVisible();
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
  await expect(monsterPage.cards.root).toBeVisible();
  await expect(monsterPage.cards.heading('Plain Pebble')).toBeVisible();
  await expect(monsterPage.cards.heading('Twin Sprout').first()).toBeVisible();
  await expect(
    monsterPage.cards.heading('Twin Sprout').nth(1),
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
  await expect(monsterPage.cards.heading('Patchy Records')).toBeVisible();
  await expect(monsterPage.cards.heading('Unnamed monster')).toBeVisible();
  await expect(
    monsterPage.cards.heading(
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
  const filters = await monsterPage.quickFilters.openAll();
  await filters.filters.facet('Boss').checkbox(/^Yes/u).click();
  await filters.applyButton.click();
  await monsterPage.drops.cardButton('Crowned Warden', 24).click();
  const drawer = monsterPage.drops.drawer('Crowned Warden');
  await expect(drawer.category('Drops (24)')).toBeVisible();
  await expect(drawer.certaintyLegend).toBeVisible();
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
