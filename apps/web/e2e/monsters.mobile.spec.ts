import { test, expect } from './support/test';

test('mobile cards, quick filters and the drops drawer work together', async ({
  page,
  monsterPage,
  artifactRequests,
}) => {
  await monsterPage.goto();
  expect(artifactRequests).toEqual([]);

  await expect(monsterPage.results.cards).toBeVisible();
  await expect(monsterPage.results.table).toHaveCount(0);

  const patchy = monsterPage.results.card('Patchy Records');
  await expect(patchy).toContainText('Unavailable');
  await expect(patchy.getByText('-', { exact: true })).toHaveCount(3);
  await expect(patchy.getByLabel('HP Recovery: -')).toBeVisible();
  const unknownRecovery = monsterPage.results.card('Filler 01');
  await expect(
    unknownRecovery.getByLabel('HP Recovery: Unknown'),
  ).toBeVisible();

  const filters = monsterPage.filters;
  const allFilters = filters.quickButton('Filters, 0 active. Open all filters');
  await expect(allFilters).toBeVisible();
  for (const name of [
    'Level. Open Level filters',
    'HP. Open HP filters',
    'EXP. Open EXP filters',
    'EXP / 100 HP. Open EXP / 100 HP filters',
  ]) {
    await expect(filters.quickButton(name)).toBeAttached();
  }

  const filterDialog = await filters.openAll();
  await filters.checkbox('Boss', /^Yes \(2\)$/u, filterDialog).click();
  await filters.applyButton(filterDialog).click();
  await expect(monsterPage.results.summary).toHaveText('2 Monsters');
  expect(artifactRequests).toEqual([]);
  await expect(
    filters.quickButton(/Boss, 1 active filter\. Open Boss filters/u),
  ).toBeAttached();

  const wardenDrops = monsterPage.drops.cardButton('Crowned Warden', 24);
  await wardenDrops.click();
  const drawer = monsterPage.drops.drawer('Crowned Warden');
  await expect(monsterPage.drops.category(drawer, 'Drops (24)')).toBeVisible();
  await expect(monsterPage.drops.certaintyLegend(drawer)).toBeVisible();
  await expect(monsterPage.drops.category(drawer, 'Equipment')).toBeVisible();
  await expect(monsterPage.drops.category(drawer, 'Other')).toBeVisible();

  await monsterPage.drops.closeButton(drawer, 'Crowned Warden').click();
  await expect(drawer).toHaveCount(0);
  await expect(wardenDrops).toBeFocused();

  await wardenDrops.click();
  await expect(monsterPage.drops.drawer('Crowned Warden')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(monsterPage.drops.drawer('Crowned Warden')).toHaveCount(0);
});
