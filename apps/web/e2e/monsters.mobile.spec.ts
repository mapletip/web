import { test, expect, ready } from './support/test';

const CARDS = 'Classic World monsters cards';

test('mobile cards, quick filters and the drops drawer work together', async ({
  page,
  artifactRequests,
}) => {
  await page.goto('/maplestory/monsters');
  await ready(page);
  expect(artifactRequests).toEqual([]);

  const cards = page.getByRole('list', { name: CARDS });
  await expect(cards).toBeVisible();
  await expect(
    page.getByRole('table', { name: 'Classic World monsters comparison' }),
  ).toHaveCount(0);

  const patchy = page
    .getByRole('article')
    .filter({ hasText: 'Patchy Records' });
  await expect(patchy).toContainText('Unavailable');
  await expect(patchy.getByText('-', { exact: true })).toHaveCount(3);
  await expect(patchy.getByLabel('HP Recovery: -')).toBeVisible();
  const unknownRecovery = page
    .getByRole('article')
    .filter({ hasText: 'Filler 01' });
  await expect(
    unknownRecovery.getByLabel('HP Recovery: Unknown'),
  ).toBeVisible();

  const quickFilters = page.getByRole('region', { name: 'Quick filters' });
  const allFilters = quickFilters.getByRole('button', {
    name: 'Filters, 0 active. Open all filters',
  });
  await expect(allFilters).toBeVisible();
  for (const name of [
    'Level. Open Level filters',
    'HP. Open HP filters',
    'EXP. Open EXP filters',
    'EXP / 100 HP. Open EXP / 100 HP filters',
  ]) {
    await expect(quickFilters.getByRole('button', { name })).toBeAttached();
  }

  await allFilters.click();
  const filterDialog = page.getByRole('dialog', { name: 'Filters' });
  await filterDialog
    .getByRole('group', { name: 'Boss' })
    .getByRole('checkbox', { name: /^Yes \(2\)$/u })
    .click();
  await filterDialog.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByText('2 Monsters').first()).toBeVisible();
  expect(artifactRequests).toEqual([]);
  await expect(
    quickFilters.getByRole('button', {
      name: /Boss, 1 active filter\. Open Boss filters/u,
    }),
  ).toBeAttached();

  const wardenDrops = page.getByRole('button', {
    name: 'Crowned Warden, 24 drops. Show drops.',
  });
  await wardenDrops.click();
  const drawer = page.getByRole('dialog', { name: /Crowned Warden/u });
  await expect(
    drawer.getByRole('heading', { name: 'Drops (24)' }),
  ).toBeVisible();
  await expect(
    drawer.getByRole('group', { name: 'Drop certainty legend' }),
  ).toBeVisible();
  await expect(
    drawer.getByRole('heading', { name: 'Equipment' }),
  ).toBeVisible();
  await expect(drawer.getByRole('heading', { name: 'Other' })).toBeVisible();

  await drawer
    .getByRole('button', { name: 'Close Drops for Crowned Warden' })
    .click();
  await expect(drawer).toHaveCount(0);
  await expect(wardenDrops).toBeFocused();

  await wardenDrops.click();
  await expect(
    page.getByRole('dialog', { name: /Crowned Warden/u }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', { name: /Crowned Warden/u }),
  ).toHaveCount(0);
});
