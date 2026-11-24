import { expect, test } from '../fixtures';

import { gotoHydrated, pick, summary } from './browse';

const MAPS = '/maplestory/maps';

test('the mobile quick row applies a location and a monster through drawers', async ({
  page,
}) => {
  await gotoHydrated(page, MAPS);
  const quick = page.getByRole('region', { name: 'Quick filters' });
  await expect(
    quick.getByRole('button', { name: /^Locations: All maps/u }),
  ).toBeVisible();
  await expect(quick.getByRole('button', { name: /^Filters/u })).toBeVisible();
  await expect(
    quick.getByRole('button', { name: 'Monster. Open Monster filters' }),
  ).toBeVisible();
  await expect(
    quick.getByRole('button', { name: 'NPC. Open NPC filters' }),
  ).toBeVisible();

  await quick.getByRole('button', { name: /^Locations: All maps/u }).click();
  const locations = page.getByRole('dialog', { name: 'Locations' });
  await locations.getByRole('button', { name: /^Lantern Hills/u }).click();
  await locations.getByRole('button', { name: /^Lamplight/u }).click();
  await expect(page).toHaveURL(`${MAPS}/in/lantern-hills/lamplight`);
  await expect(summary(page)).toHaveText('3 Maps');

  await quick
    .getByRole('button', { name: 'Monster. Open Monster filters' })
    .click();
  const filters = page.getByRole('dialog', { name: 'Monster' });
  await pick(page, {
    picker: filters.getByRole('combobox', { name: 'Monster' }),
    text: 'wide',
    option: /Wide Banner/u,
  });
  await expect(summary(page)).toHaveText('3 Maps');
  await filters.getByRole('button', { name: /^Show 1/u }).click();
  await expect(summary(page)).toHaveText('1 Map');
});

test('Map Browse does not scroll horizontally at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await gotoHydrated(page, MAPS);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});
