import {
  fixtureRelease,
  monsterPublicId,
  monsterSlug,
} from '../../src/mocks/release';

import { test, expect } from './fixtures';
import type { MonsterPage } from './page/monster-page';

async function openBossesAndUndead(monsterPage: MonsterPage): Promise<void> {
  await monsterPage.filters.checkbox('Boss', /^Yes/u).click();
  await monsterPage.filters.checkbox('Undead', /^Yes/u).click();
}

test('desktop Monster Detail opens an enlarged minimap on click', async ({
  page,
  monsterPage,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  const publicId = monsterPublicId('crowned-warden');
  const slug = monsterSlug('Crowned Warden', publicId);
  await monsterPage.goto(`/maplestory/monsters/${slug}-${publicId}`);

  await page
    .getByRole('textbox', { name: 'Find a map' })
    .first()
    .fill('Practice Map 01');
  const trigger = page.getByRole('button', {
    name: 'Enlarge Practice Map 01 minimap',
  });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const preview = page.getByRole('dialog', {
    name: 'Practice Map 01',
  });
  await expect(preview).toBeVisible();
  await expect(
    preview.getByRole('img', { name: 'Practice Map 01 minimap enlarged' }),
  ).toBeVisible();
  await monsterPage.captureReady();
  await expect(preview).toHaveScreenshot(
    'desktop-monster-detail-minimap-enlarged.png',
  );
});

test('desktop page with expanded drops and drop sources', async ({
  page,
  monsterPage,
}) => {
  await page.setViewportSize({ width: 1366, height: 2200 });
  await page.addInitScript(() => localStorage.clear());
  await monsterPage.goto();
  await monsterPage.captureReady();
  await monsterPage.drops.tableButton('Crowned Warden', 24).click();
  const panel = monsterPage.drops.panel('Crowned Warden', 24);
  const sourceButton = monsterPage.drops.certaintyButton(panel, 'Practice Cap');
  await sourceButton.focus();
  await sourceButton.hover();
  const detailDialog = monsterPage.drops.certaintyDialog('Practice Cap');
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog.getByText('Maybe')).toBeVisible();
  await expect(
    detailDialog.getByText('Source: GMS v83 Monster Book.'),
  ).toBeVisible();
  await monsterPage.captureReady();
  await expect(page).toHaveScreenshot('desktop-drops-expanded.png');
});

test('desktop Monster Detail shows the confirmed drop explanation for Native Bloom', async ({
  page,
  monsterPage,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.addInitScript(() => localStorage.clear());
  const publicId = monsterPublicId('native-alpha');
  const slug = monsterSlug('Native Alpha', publicId);
  await monsterPage.goto(`/maplestory/gms-v83/monsters/${slug}-${publicId}`);

  await page
    .getByRole('navigation', { name: 'Record sections' })
    .getByRole('link', { name: 'Drops (2)' })
    .click();
  const sourceButton = page.getByRole('button', {
    name: 'Show confirmed drop details for Native Bloom',
  });
  await expect(sourceButton).toBeVisible();
  await sourceButton.focus();
  await sourceButton.hover();

  const dialog = page.locator(
    '[role="dialog"][aria-label="Confirmed drop details for Native Bloom"]',
  );
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('VOD', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Screenshot', { exact: true })).toBeVisible();
  const timedLink = dialog.getByRole('link', { name: 'Open at 1:35' });
  await expect(timedLink).toHaveAttribute('target', '_blank');
  await monsterPage.captureReady();
  await expect(dialog).toHaveScreenshot(
    'desktop-native-bloom-drop-explanation.png',
  );
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
  await monsterPage.captureReady();
  await expect(page).toHaveScreenshot('mobile-drops-drawer.png');
});

for (const { layout, width, height, sort } of [
  { layout: 'desktop', width: 1366, height: 900, sort: 'Spawns' },
  { layout: 'mobile', width: 320, height: 760, sort: 'Map name' },
]) {
  test(`${layout} Monster Browse Locations drawer`, async ({
    page,
    monsterPage,
    expectedArtifactRequests,
  }) => {
    const { locationBrowse } = fixtureRelease.builds.get('cw-launch')!;
    expectedArtifactRequests.push(
      /^\/v1\/(releases|build-indexes)\//u,
      /^\/v2\/products\//u,
      new RegExp(`^/${locationBrowse.path.replace('.', '[.]')}$`, 'u'),
    );
    await page.setViewportSize({ width, height });
    await page.addInitScript(() => localStorage.clear());
    await monsterPage.goto();
    await monsterPage.results.search.fill('Crowned Warden');
    await page
      .getByRole('button', {
        name: 'Show locations for Crowned Warden, 12 maps',
      })
      .click();

    const drawer = page.getByRole('dialog', {
      name: 'Crowned Warden Locations',
    });
    const order = drawer.getByRole('radiogroup', { name: 'Order locations' });
    if (sort === 'Map name') {
      await order.getByText(sort, { exact: true }).click();
    }
    await expect(order.getByRole('radio', { name: sort })).toBeChecked();
    await expect(
      drawer.getByRole('textbox', { name: 'Find a map' }),
    ).toBeVisible();
    await expect(
      drawer.getByRole('img', { name: 'Practice Map 01 minimap' }),
    ).toBeInViewport();
    await page.mouse.move(0, 0);
    await monsterPage.captureReady();
    await expect(page).toHaveScreenshot(`${layout}-locations-drawer.png`);
  });
}

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
