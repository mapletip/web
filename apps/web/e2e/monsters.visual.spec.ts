import { test, expect, ready } from './support/test';

async function captureReady(page: Parameters<typeof ready>[0]): Promise<void> {
  await ready(page);
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

async function openBossesAndUndead(
  page: Parameters<typeof ready>[0],
): Promise<void> {
  const boss = page.getByRole('group', { name: 'Boss' });
  await boss.getByRole('checkbox', { name: /^Yes/u }).click();
  const undead = page.getByRole('group', { name: 'Undead' });
  await undead.getByRole('checkbox', { name: /^Yes/u }).click();
}

test('desktop page with expanded drops and certainty details', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 2200 });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/maplestory/monsters');
  await captureReady(page);
  await page
    .getByRole('button', { name: 'Crowned Warden, 24 drops. Show drops.' })
    .click();
  const panel = page.getByRole('region', { name: 'Crowned Warden Drops (24)' });
  const certainty = panel.getByRole('button', {
    name: 'Show unconfirmed drop details for Practice Cap',
  });
  await certainty.focus();
  await certainty.hover();
  const detailDialog = page.getByRole('dialog', {
    name: 'Show unconfirmed drop details for Practice Cap',
  });
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog.getByText('Maybe')).toBeVisible();
  await expect(
    detailDialog.getByText('Source: GMS v83 Monster Book.'),
  ).toBeVisible();
  await captureReady(page);
  await expect(page).toHaveScreenshot('desktop-drops-expanded.png');
});

test('desktop page with boolean and range filters active in the rail', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/maplestory/monsters');
  await captureReady(page);
  await openBossesAndUndead(page);
  const summary = page.getByText(/^\d+ Monsters?$/u).first();
  const ratio = page.getByRole('group', { name: 'EXP / 100 HP' });
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
  await expect(
    page.getByRole('row', { name: /Crowned Revenant/u }),
  ).toBeVisible();
  await captureReady(page);
  await expect(page).toHaveScreenshot('desktop-filtered-rail.png');
});

test('mobile cards show the opening fixture rows', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/maplestory/monsters');
  await ready(page);
  await page.evaluate(() => window.scrollTo(0, 240));
  await captureReady(page);
  await expect(
    page.getByRole('list', { name: 'Classic World monsters cards' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Plain Pebble' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Twin Sprout' }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Twin Sprout' }).nth(1),
  ).toBeInViewport();
  await expect(page).toHaveScreenshot('mobile-cards.png');
});

test('mobile cards preserve unknown facts and long names', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 3000 });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/maplestory/monsters');
  await captureReady(page);
  await expect(
    page.getByRole('heading', { name: 'Patchy Records' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Unnamed monster' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Extraordinarily Long Named Fixture Creature Of The Far Northern Reaches',
    }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-cards-states.png');
});

test('mobile drops drawer opens over the active boss filter', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/maplestory/monsters');
  await captureReady(page);
  const quickFilters = page.getByRole('region', { name: 'Quick filters' });
  await quickFilters.getByRole('button', { name: /Open all filters/u }).click();
  const filters = page.getByRole('dialog', { name: 'Filters' });
  await filters
    .getByRole('group', { name: 'Boss' })
    .getByRole('checkbox', { name: /^Yes/u })
    .click();
  await filters.getByRole('button', { name: 'Apply' }).click();
  await page
    .getByRole('button', { name: 'Crowned Warden, 24 drops. Show drops.' })
    .click();
  const drawer = page.getByRole('dialog', { name: /Crowned Warden/u });
  await expect(
    drawer.getByRole('heading', { name: 'Drops (24)' }),
  ).toBeVisible();
  await expect(
    drawer.getByRole('group', { name: 'Drop certainty legend' }),
  ).toBeVisible();
  await captureReady(page);
  await expect(page).toHaveScreenshot('mobile-drops-drawer.png');
});

test('generic unavailable page has no server diagnostics', async ({
  page,
  expectedBrowserErrors,
}) => {
  expectedBrowserErrors.console.push(/Failed to load resource.*500/u);
  expectedBrowserErrors.console.push(
    /^Error: Monster data could not be loaded\./u,
  );
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('http://127.0.0.1:4174/maplestory/monsters');
  await captureReady(page);
  await expect(
    page.getByRole('heading', { name: 'Something went wrong' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('error-page.png');
});
