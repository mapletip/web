import type { Page } from '@playwright/test';

import { mapPublicId, monsterPublicId } from '../../src/mocks/release';
import { expect, test } from '../fixtures';

import { gotoHydrated, pick, summary } from './browse';

const MAPS = '/maplestory/maps';

function cards(page: Page) {
  return page.getByRole('list', { name: 'Classic World maps cards' });
}

function cardTitles(page: Page) {
  return cards(page).getByRole('heading', { level: 3 });
}

function rail(page: Page) {
  return page.getByRole('navigation', { name: 'Locations' });
}

test('Map Browse is server rendered and cards open Map Detail', async ({
  page,
  request,
}) => {
  const response = await request.get(MAPS);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain(
    '<title>MapleStory Classic World Maps – MapleTip</title>',
  );
  expect(html).toContain('Lamplight Meadow');

  expect((await request.get('/maplestory/cw-launch/maps')).status()).toBe(404);
  expect((await request.get(`${MAPS}/in/not-a-place`)).status()).toBe(404);

  await gotoHydrated(page, MAPS);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'MapleStory Classic World Maps',
    }),
  ).toBeVisible();
  await expect(cardTitles(page).first()).toHaveText('Brass Walk');
  await expect(cardTitles(page).last()).toHaveText('Unnamed map');

  const meadow = cards(page).getByRole('listitem').filter({
    hasText: 'Lamplight Meadow',
  });
  await expect(meadow).toContainText('Lantern Hills · Lamplight');
  // Sorted by name with no filter, a card carries no figures.
  await expect(meadow.getByTestId('map-card-footer')).toHaveCount(0);
  await expect(
    cards(page)
      .getByRole('listitem')
      .filter({ hasText: 'Lantern Rehearsal <Stage 1>' }),
  ).toContainText('Lantern Relay');

  await meadow.getByRole('link', { name: 'Lamplight Meadow' }).click();
  await expect(page).toHaveURL(
    `${MAPS}/lamplight-meadow-${mapPublicId({ sourceId: 'cw-launch:lamplight-meadow' })}`,
  );
});

test('each sort orders the maps', async ({ page }) => {
  await gotoHydrated(page, `${MAPS}?pageSize=100`);
  const sort = page.getByRole('combobox', { name: 'Sort' });

  const choose = async (label: string) => {
    await sort.click();
    await page.getByRole('option', { name: label }).click();
  };

  await choose('Name (Z–A)');
  await expect(cardTitles(page).first()).toHaveText('Synthetic Monster Yard');
  await expect(cardTitles(page).last()).toHaveText('Unnamed map');

  const firstCard = cards(page).getByRole('listitem').first();
  const lastCard = cards(page).getByRole('listitem').last();
  const footer = (card: typeof firstCard) =>
    card.getByTestId('map-card-footer');
  await choose('Monster level: high to low');
  await expect(footer(firstCard)).toHaveText(/^Lv\. (\d+–)?17 monsters$/u);
  await expect(footer(lastCard)).toHaveCount(0);

  await choose('Monster level: low to high');
  await expect(footer(firstCard)).toHaveText(/^Lv\. 1(–\d+)? monsters$/u);
  await expect(footer(lastCard)).toHaveCount(0);

  await choose('Most spawn points');
  await expect(cardTitles(page).first()).toHaveText('Synthetic Monster Yard');
  await expect(footer(firstCard)).toHaveText(/^\d+ spawns$/u);

  await choose('Name (A–Z)');
  await expect(page).toHaveURL(`${MAPS}?pageSize=100`);
});

test('a copied link reproduces the view and defaults leave a clean address', async ({
  page,
  context,
}) => {
  await gotoHydrated(page, MAPS);
  await expect(page).toHaveURL(MAPS);

  await page.getByRole('textbox', { name: /^Search/u }).fill('lamp');
  await expect(summary(page)).toHaveText('3 Maps');
  await page
    .getByRole('group', { name: 'Has NPCs' })
    .getByRole('checkbox', { name: /^Yes \(/u })
    .check();
  await expect(summary(page)).toHaveText('1 Map');

  const copy = await context.newPage();
  await gotoHydrated(copy, page.url());
  await expect(summary(copy)).toHaveText('1 Map');
  await expect(cardTitles(copy)).toHaveText(['Lamplight Meadow']);

  await gotoHydrated(
    copy,
    `${MAPS}?pageSize=7&monster=%5B%22not-in-build%22%5D`,
  );
  await expect(summary(copy)).toHaveText('25 Maps');
});

test('the location rail drills down and keeps search and filters', async ({
  page,
}) => {
  await gotoHydrated(page, `${MAPS}?q=lamp`);
  const collections = rail(page).getByRole('button', {
    name: /Other collections/u,
  });
  await expect(
    rail(page).getByRole('link', { name: /Event maps/u }),
  ).toHaveCount(0);
  await collections.click();
  await expect(page).toHaveURL(`${MAPS}?q=lamp`);
  await expect(
    rail(page).getByRole('link', { name: /Event maps/u }),
  ).toContainText('0');
  await rail(page).getByRole('link', { name: 'All maps' }).click();

  await rail(page)
    .getByRole('link', { name: /^Lantern Hills/u })
    .click();
  await expect(page).toHaveURL(`${MAPS}/in/lantern-hills?q=lamp`);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Lantern Hills Maps',
    }),
  ).toBeVisible();
  await expect(summary(page)).toHaveText('3 Maps');

  await rail(page)
    .getByRole('link', { name: /^Lamplight/u })
    .click();
  await expect(page).toHaveURL(`${MAPS}/in/lantern-hills/lamplight?q=lamp`);
  await expect(summary(page)).toHaveText('3 Maps');
  await expect(
    rail(page).getByRole('link', { name: 'All maps' }),
  ).toBeVisible();
  await expect(
    rail(page).getByRole('link', { name: 'Lantern Hills' }),
  ).toBeVisible();

  await page.getByRole('textbox', { name: /^Search/u }).fill('');
  await expect(page).toHaveURL(`${MAPS}/in/lantern-hills/lamplight`);
});

test('monster picker, level range and activity filter the maps', async ({
  page,
}) => {
  await gotoHydrated(page, MAPS);
  await pick(page, {
    picker: page.getByRole('combobox', { name: 'Monster' }),
    text: 'wide',
    option: /Wide Banner/u,
  });
  await expect
    .poll(() => new URL(page.url()).searchParams.get('monster'))
    .toBe(JSON.stringify([monsterPublicId('wide-banner')]));
  await expect(cardTitles(page)).toHaveText(['Lantern Rehearsal <Stage 1>']);
  await expect(cards(page).getByTestId('map-card-footer')).toHaveText(
    /^3×\s*Wide Banner$/u,
  );

  await gotoHydrated(
    page,
    `${MAPS}?level=${encodeURIComponent('{"min":3,"max":5}')}`,
  );
  await expect(cardTitles(page)).toHaveText([
    'Lamplight Meadow',
    'Synthetic Monster Yard',
  ]);

  await gotoHydrated(page, MAPS);
  await page
    .getByRole('group', { name: 'Activity' })
    .getByRole('checkbox', { name: /^Party quest/u })
    .check();
  await expect(cardTitles(page)).toHaveText(['Lantern Rehearsal <Stage 1>']);
});

test('area and card marks preserve card height', async ({ page }) => {
  await gotoHydrated(page, '/maplestory/gms-v83/maps/in/lantern-hills');
  const area = rail(page).getByRole('link', { name: /^Lamplight/u });
  await expect(area.locator('img')).toBeVisible();
  await area.click();
  await expect(
    rail(page).getByRole('link', { name: 'Lantern Hills' }),
  ).toBeVisible();
  const headingMark = page
    .getByRole('heading', { level: 1 })
    .locator('..')
    .locator('img');
  await expect(headingMark).toBeVisible();

  const mark = page.getByRole('heading', { name: 'Lamplight Meadow' });
  const noMark = page.getByRole('heading', {
    name: 'Lantern Rehearsal <Stage 1>',
  });
  await expect(mark.locator('img')).toBeVisible();
  await expect(noMark.locator('img')).toHaveCount(0);
  const heights = await Promise.all(
    [mark, noMark].map((title) =>
      title.evaluate(
        (node) =>
          node.closest('[data-record-card-layout]')?.getBoundingClientRect()
            .height,
      ),
    ),
  );
  expect(heights[0]).toBeGreaterThan(0);
  expect(heights[0]).toBe(heights[1]);
});

test('entry level and level cap add figures to filtered cards', async ({
  page,
}) => {
  const alternate = '/maplestory/gms-v83/maps';
  await gotoHydrated(page, alternate);
  const alternateCards = page.getByRole('list', { name: /maps cards/u });
  const entries = page.getByRole('group', { name: 'Entry level', exact: true });
  await entries.getByRole('checkbox', { name: /^30/u }).check();
  await expect(alternateCards.getByRole('heading', { level: 3 })).toHaveText([
    'Lantern Rehearsal <Stage 1>',
  ]);
  await expect(alternateCards.getByTestId('map-card-footer')).toHaveText(
    'Entry Lv. 30',
  );

  await gotoHydrated(page, alternate);
  const caps = page.getByRole('group', { name: 'Level cap', exact: true });
  await caps.getByRole('checkbox', { name: /^25/u }).check();
  await expect(alternateCards.getByRole('heading', { level: 3 })).toHaveText([
    'Lamplight Meadow',
  ]);
  await expect(alternateCards.getByTestId('map-card-footer')).toHaveText(
    'Lv. cap 25',
  );
});

test('map features show a figure only for the selected fact', async ({
  page,
}) => {
  await gotoHydrated(page, MAPS);
  const features = page.getByRole('group', {
    name: 'Map features',
    exact: true,
  });
  await features.getByRole('checkbox', { name: /^Town/u }).check();
  await expect(cardTitles(page)).toHaveText(['Lantern Square']);
  await expect(cards(page).getByTestId('map-card-footer')).toHaveCount(0);
  await features.getByRole('checkbox', { name: /^Time limit/u }).check();
  await expect(cards(page).getByTestId('map-card-footer')).toHaveText(
    '10 min limit',
  );
});

test('no matches offers to clear the search and filters', async ({ page }) => {
  await gotoHydrated(page, `${MAPS}?q=no-such-map`);
  await expect(
    page.getByText('No Classic World maps match').first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(summary(page)).toHaveText('25 Maps');
});

test('Map Detail breadcrumbs open the area page', async ({ page }) => {
  await gotoHydrated(
    page,
    `${MAPS}/lamplight-meadow-${mapPublicId({ sourceId: 'cw-launch:lamplight-meadow' })}`,
  );
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'Lamplight' })
    .click();
  await expect(page).toHaveURL(`${MAPS}/in/lantern-hills/lamplight`);
  await expect(summary(page)).toHaveText('3 Maps');
});

test('a failed load shows a retryable error without diagnostics', async ({
  page,
}) => {
  await gotoHydrated(page, `http://127.0.0.1:4174${MAPS}`);
  await expect(
    page.getByRole('heading', { name: 'Something went wrong' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/sha|v2\/|digest/iu);
});
