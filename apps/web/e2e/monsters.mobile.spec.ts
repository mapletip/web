import { test, expect } from './support/test';

test('mobile cards, quick filters and the drops drawer work together', async ({
  page,
  monsterPage,
  artifactRequests,
}) => {
  await monsterPage.goto();
  expect(artifactRequests).toEqual([]);

  await expect(monsterPage.cards.root).toBeVisible();
  await expect(monsterPage.table.root).toHaveCount(0);

  const patchy = monsterPage.cards.card('Patchy Records');
  await expect(patchy.root).toContainText('Unavailable');
  await expect(patchy.text('-', true)).toHaveCount(3);
  await expect(patchy.fact('HP Recovery: -')).toBeVisible();
  const unknownRecovery = monsterPage.cards.card('Filler 01');
  await expect(unknownRecovery.fact('HP Recovery: Unknown')).toBeVisible();

  const quickFilters = monsterPage.quickFilters;
  const allFilters = quickFilters.button('Filters, 0 active. Open all filters');
  await expect(allFilters).toBeVisible();
  for (const name of [
    'Level. Open Level filters',
    'HP. Open HP filters',
    'EXP. Open EXP filters',
    'EXP / 100 HP. Open EXP / 100 HP filters',
  ]) {
    await expect(quickFilters.button(name)).toBeAttached();
  }

  const filterDialog = await quickFilters.openAll();
  await filterDialog.filters
    .facet('Boss')
    .checkbox(/^Yes \(2\)$/u)
    .click();
  await filterDialog.applyButton.click();
  await expect(monsterPage.summary).toHaveText('2 Monsters');
  expect(artifactRequests).toEqual([]);
  await expect(
    quickFilters.button(/Boss, 1 active filter\. Open Boss filters/u),
  ).toBeAttached();

  const wardenDrops = monsterPage.drops.cardButton('Crowned Warden', 24);
  await wardenDrops.click();
  const drawer = monsterPage.drops.drawer('Crowned Warden');
  await expect(drawer.category('Drops (24)')).toBeVisible();
  await expect(drawer.certaintyLegend).toBeVisible();
  await expect(drawer.category('Equipment')).toBeVisible();
  await expect(drawer.category('Other')).toBeVisible();

  await drawer.closeButton('Crowned Warden').click();
  await expect(drawer.root).toHaveCount(0);
  await expect(wardenDrops).toBeFocused();

  await wardenDrops.click();
  await expect(monsterPage.drops.drawer('Crowned Warden').root).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(monsterPage.drops.drawer('Crowned Warden').root).toHaveCount(0);
});
