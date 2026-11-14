import { test, expect } from './fixtures';

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
  await expect(wardenDrops).toHaveAttribute('aria-expanded', 'false');
  await wardenDrops.click();
  await expect(wardenDrops).toHaveAttribute('aria-expanded', 'true');
  const drawer = monsterPage.drops.drawer('Crowned Warden');
  await expect(monsterPage.drops.category(drawer, 'Drops (24)')).toBeVisible();
  await expect(monsterPage.drops.certaintyLegend(drawer)).toBeVisible();
  await expect(monsterPage.drops.category(drawer, 'Equipment')).toBeVisible();
  await expect(monsterPage.drops.category(drawer, 'Other')).toBeVisible();

  await monsterPage.drops.closeButton(drawer, 'Crowned Warden').click();
  await expect(drawer).toHaveCount(0);
  await expect(wardenDrops).toHaveAttribute('aria-expanded', 'false');
  await expect(wardenDrops).toBeFocused();

  await wardenDrops.click();
  const reopened = monsterPage.drops.drawer('Crowned Warden');
  await expect(reopened).toBeVisible();

  const certainty = monsterPage.drops.certaintyButton(
    reopened,
    'unconfirmed',
    'Practice Cap',
  );
  await certainty.click();
  const detailDialog = monsterPage.drops.certaintyDialog(
    'Show unconfirmed drop details for Practice Cap',
  );
  await expect(detailDialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(detailDialog).toHaveCount(0);
  await expect(reopened).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(reopened).toHaveCount(0);
  await expect(wardenDrops).toBeFocused();
});

test('mobile drops use one browser history entry and do not refetch data', async ({
  page,
  monsterPage,
  artifactRequests,
}) => {
  await monsterPage.goto();
  const drops = monsterPage.drops.cardButton('Crowned Warden', 24);
  await drops.click();
  const drawer = monsterPage.drops.drawer('Crowned Warden');
  await expect(drawer).toBeVisible();

  await page.goBack();
  await expect(drawer).toHaveCount(0);
  await expect(page).toHaveURL(/\/maplestory\/monsters$/u);
  await expect(drops).toHaveAttribute('aria-expanded', 'false');

  await page.goForward();
  await expect(drawer).toBeVisible();
  await expect(drops).toHaveAttribute('aria-expanded', 'true');

  await monsterPage.drops.closeButton(drawer, 'Crowned Warden').click();
  await expect(drawer).toHaveCount(0);
  await page.goBack();
  await expect(page).not.toHaveURL(/\/maplestory\/monsters$/u);
  expect(artifactRequests).toEqual([]);
});

test('mobile filter drafts discard on Back and Apply survives history cleanup', async ({
  page,
  monsterPage,
  artifactRequests,
}) => {
  await monsterPage.goto();
  await monsterPage.filters.quickButton('Level. Open Level filters').click();
  const levelDialog = page.getByRole('dialog', { name: 'Level' });
  await expect(
    levelDialog.getByRole('heading', { name: 'Level' }),
  ).toBeVisible();
  await levelDialog
    .getByRole('button', { name: 'Back to all filters' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Filters' });
  await expect(dialog).toBeVisible();

  const bossYes = dialog
    .getByRole('group', { name: 'Boss' })
    .getByRole('checkbox', { name: /^Yes \(/u });
  await bossYes.check();
  await expect(monsterPage.results.summary).toHaveText('30 Monsters');

  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect(monsterPage.results.summary).toHaveText('30 Monsters');
  await expect(page).toHaveURL(/\/maplestory\/monsters$/u);

  await page.goForward();
  const reopened = page.getByRole('dialog', { name: 'Filters' });
  await expect(reopened).toBeVisible();
  await expect(
    reopened
      .getByRole('group', { name: 'Boss' })
      .getByRole('checkbox', { name: /^Yes \(/u }),
  ).not.toBeChecked();
  await expect(monsterPage.results.summary).toHaveText('30 Monsters');

  await reopened
    .getByRole('group', { name: 'Boss' })
    .getByRole('checkbox', { name: /^Yes \(/u })
    .check();
  await monsterPage.filters.applyButton(reopened).click();
  await expect(reopened).toHaveCount(0);
  await expect(monsterPage.results.summary).toHaveText('2 Monsters');

  await page.goBack();
  await expect(page).not.toHaveURL(/\/maplestory\/monsters$/u);
  expect(artifactRequests).toEqual([]);
});

test('versioned monster details follow the same Back and Forward policy', async ({
  monsterPage,
  artifactRequests,
}) => {
  await monsterPage.goto('/maplestory/gms-v83/monsters');
  const drops = monsterPage.drops.cardButton('Native Alpha', 2);
  await drops.click();
  const drawer = monsterPage.drops.drawer('Native Alpha');
  await expect(drawer).toBeVisible();

  await monsterPage.page.goBack();
  await expect(drawer).toHaveCount(0);
  await expect(monsterPage.page).toHaveURL(/\/maplestory\/gms-v83\/monsters$/u);

  await monsterPage.page.goForward();
  await expect(drawer).toBeVisible();
  expect(artifactRequests).toEqual([]);
});

test('invalidating details closes the drawer and consumes the history entry', async ({
  page,
  monsterPage,
  artifactRequests,
}) => {
  await page.goto('/');
  await monsterPage.ready();

  const burger = page.getByRole('button', { name: 'Open navigation' });
  if (await burger.isVisible()) {
    await burger.click();
    await page
      .getByRole('navigation', { name: 'Global navigation' })
      .getByRole('link', { name: 'Monsters' })
      .click();
  } else {
    await page.getByRole('link', { name: 'Monsters' }).click();
  }
  await monsterPage.ready();
  await expect(page).toHaveURL(/\/maplestory\/monsters$/u);

  const drops = monsterPage.drops.cardButton('Crowned Warden', 24);
  await drops.click();
  const drawer = monsterPage.drops.drawer('Crowned Warden');
  await expect(drawer).toBeVisible();

  await monsterPage.results.search.evaluate((input: HTMLInputElement) => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- native input setter extraction
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;
    setter?.call(input, 'zzzzzz');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await expect(drawer).toHaveCount(0);
  await expect(page).toHaveURL(/\/maplestory\/monsters$/u);

  await page.goForward();
  await page.waitForTimeout(200);
  await expect(drawer).toHaveCount(0);
  await expect(page).toHaveURL(/\/maplestory\/monsters$/u);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window.history.state as { readonly browseOverlay?: unknown } | null)
            ?.browseOverlay,
      ),
    )
    .toBeUndefined();

  await page.goBack();
  await expect(page).toHaveURL(/\/maplestory\/monsters$/u);
  await expect(drawer).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/u);
  expect(artifactRequests).toEqual([]);
});

test('overlay-only transitions preserve scroll position', async ({
  page,
  monsterPage,
  artifactRequests,
}) => {
  await monsterPage.goto();

  const card = monsterPage.results.card('Crowned Warden');
  await card.scrollIntoViewIfNeeded();

  const recordedScrollY = await page.evaluate(() => window.scrollY);
  expect(recordedScrollY).toBeGreaterThan(100);

  const drops = monsterPage.drops.cardButton('Crowned Warden', 24);
  await drops.click();
  const drawer = monsterPage.drops.drawer('Crowned Warden');
  await expect(drawer).toBeVisible();

  const openScrollY = await page.evaluate(() => window.scrollY);
  expect(Math.abs(openScrollY - recordedScrollY)).toBeLessThanOrEqual(15);

  await page.goBack();
  await expect(drawer).toHaveCount(0);
  const backScrollY = await page.evaluate(() => window.scrollY);
  expect(Math.abs(backScrollY - recordedScrollY)).toBeLessThanOrEqual(15);

  await page.goForward();
  await expect(drawer).toBeVisible();
  const forwardScrollY = await page.evaluate(() => window.scrollY);
  expect(Math.abs(forwardScrollY - recordedScrollY)).toBeLessThanOrEqual(15);

  await monsterPage.drops.closeButton(drawer, 'Crowned Warden').click();
  await expect(drawer).toHaveCount(0);
  const dismissScrollY = await page.evaluate(() => window.scrollY);
  expect(Math.abs(dismissScrollY - recordedScrollY)).toBeLessThanOrEqual(15);

  expect(artifactRequests).toEqual([]);
});
