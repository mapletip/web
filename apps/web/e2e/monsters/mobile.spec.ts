import { fixtureRelease, mapPublicId } from '../../src/mocks/release';

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
  await expect(monsterPage.drops.category(drawer, 'Equipment')).toBeVisible();
  await expect(monsterPage.drops.category(drawer, 'Other')).toBeVisible();

  await monsterPage.drops.closeButton(drawer, 'Crowned Warden').click();
  await expect(drawer).toHaveCount(0);
  await expect(wardenDrops).toHaveAttribute('aria-expanded', 'false');
  await expect(wardenDrops).toBeFocused();

  await wardenDrops.click();
  const reopened = monsterPage.drops.drawer('Crowned Warden');
  await expect(reopened).toBeVisible();

  const sourceButton = monsterPage.drops.sourceButton(reopened, 'Practice Cap');
  await sourceButton.click();
  const detailDialog = monsterPage.drops.sourceDialog('Practice Cap');
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

test('mobile Locations restore via history and follow normal same-build links', async ({
  page,
  monsterPage,
  artifactRequests,
  expectedArtifactRequests,
}) => {
  const files = fixtureRelease.builds.get('gms-v83')!;
  expectedArtifactRequests.push(
    /^\/v1\/(releases|build-indexes)\//u,
    /^\/v2\/products\//u,
    new RegExp(`^/${files.locationBrowse.path.replace('.', '[.]')}$`, 'u'),
  );
  await page.setViewportSize({ width: 320, height: 760 });
  await monsterPage.goto('/maplestory/gms-v83/monsters');
  expect(artifactRequests).toEqual([]);
  await expect(
    monsterPage.results.card('Native Beta').getByText('Locations unavailable'),
  ).toBeVisible();

  const trigger = monsterPage.results
    .card('Native Alpha')
    .getByRole('button', { name: /locations for Native Alpha/u });
  const drawer = page.getByRole('dialog', { name: 'Native Alpha Locations' });
  const close = drawer.getByRole('button', {
    name: 'Close details for Native Alpha',
  });
  await trigger.click();
  await expect(close).toBeFocused();
  const bounds = (await drawer.boundingBox())!;
  const viewportHeight = page.viewportSize()!.height;
  expect(bounds.height).toBeCloseTo(viewportHeight * 0.8, 0);
  expect(bounds.y + bounds.height).toBeCloseTo(viewportHeight, 0);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const link = drawer.getByRole('link', { name: 'Practice Map 01' });
  const mapPath = `/maplestory/gms-v83/maps/practice-map-01-${mapPublicId({ sourceId: 'gms-v83:fixture:map:01' })}`;
  await expect(link).toHaveAttribute('href', mapPath);
  const firstOpenRequests = [...artifactRequests];

  await page.goBack();
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.goForward();
  await expect(link).toBeVisible();
  expect(artifactRequests).toEqual(firstOpenRequests);

  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();

  const partial = monsterPage.results
    .card('Native Gamma')
    .getByRole('button', { name: /locations for Native Gamma, partial list/u });
  await expect(partial).toHaveText('Partial');
  await partial.click();
  const partialDrawer = page.getByRole('dialog', {
    name: 'Native Gamma Locations',
  });
  await expect(
    partialDrawer.getByText(/Location data is incomplete/u),
  ).toBeVisible();
  await expect(partialDrawer.getByText('Map name unavailable')).toBeVisible();
  await expect(partialDrawer.getByText('2 spawns')).toBeVisible();
  const partialCards = partialDrawer.getByTestId(
    'monster-browse-location-card',
  );
  await expect(partialCards).toHaveCount(4);
  const search = partialDrawer.getByRole('textbox', { name: 'Find a map' });
  await search.fill('WESTERN');
  await expect(partialCards).toHaveCount(3);
  await expect(partialCards.first()).toContainText('Practice Map 05');
  const sort = partialDrawer.getByRole('radiogroup', {
    name: 'Order locations',
  });
  await sort.getByText('Map name', { exact: true }).click();
  await expect(partialCards.first()).toContainText('Practice Map 03');
  await expect(search).toHaveValue('WESTERN');
  await sort.getByText('Spawns', { exact: true }).click();
  await expect(partialCards.first()).toContainText('Practice Map 05');
  await search.clear();
  await expect(partialCards).toHaveCount(4);
  await page.keyboard.press('Escape');
  await expect(partialDrawer).toHaveCount(0);

  expect(artifactRequests).toEqual(firstOpenRequests);
  expect(
    firstOpenRequests.filter((path) => path.startsWith('/v2/browse/')),
  ).toEqual([`/${files.locationBrowse.path}`]);

  expectedArtifactRequests.push(/^\/v2\/maps\/page-packs\//u);
  await trigger.click();
  await link.click();
  await expect(page).toHaveURL(mapPath);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Practice Map 01' }),
  ).toBeVisible();
});

test('Monster Browse cards with a long name fit a 320px viewport', async ({
  page,
  monsterPage,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await monsterPage.goto();
  const name =
    'Extraordinarily Long Named Fixture Creature Of The Far Northern Reaches';
  await monsterPage.results.search.fill(name);
  const card = monsterPage.results.card(name);
  await expect(card.getByRole('heading', { name })).toBeVisible();
  await expect(card.getByRole('button', { name: /Show drops/u })).toBeVisible();
  await expect(card.getByTitle('0 recorded maps')).toContainText('0');
  expect(
    await card.evaluate((element) => element.scrollWidth),
  ).toBeLessThanOrEqual((await card.boundingBox())!.width + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
});
