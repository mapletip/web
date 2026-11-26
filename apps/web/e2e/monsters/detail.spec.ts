import type { Locator, Request } from '@playwright/test';

import {
  mapPublicId,
  monsterPublicId,
  monsterSlug,
} from '../../src/mocks/release';
import { world } from '../../src/mocks/world';

import { expect, test } from './fixtures';

const DIAGNOSTIC_LEAK_PATTERN =
  /mismatch|Integrity|HTTP 5\d\d|RequestError|v[12]\/(releases|build-indexes|products|catalogs|browse|monsters)|[a-f0-9]{64}/u;

interface DetailCase {
  readonly buildId: 'cw-launch' | 'gms-v83';
  readonly prefix: string;
  readonly sourceId: string;
  readonly name: string;
  readonly buildLabel: string;
}

const DETAIL_CASES: readonly DetailCase[] = [
  {
    buildId: 'cw-launch',
    prefix: '/maplestory',
    sourceId: 'plain-pebble',
    name: 'Plain Pebble',
    buildLabel: 'Classic World',
  },
  {
    buildId: 'gms-v83',
    prefix: '/maplestory/gms-v83',
    sourceId: 'native-alpha',
    name: 'Native Alpha',
    buildLabel: 'GMS v83',
  },
];

function canonicalPath(item: DetailCase): string {
  const publicId = monsterPublicId(item.sourceId);
  const slug = monsterSlug(item.name, publicId);
  return `${item.prefix}/monsters/${slug}-${publicId}`;
}

async function minimapBackgrounds(
  locationCard: Locator,
): Promise<{ readonly well: string; readonly card: string }> {
  return locationCard.evaluate((element) => {
    const card = element.querySelector('[data-record-card="true"]');
    const minimap = card?.querySelector('[data-map-minimap="true"]');
    if (card == null || minimap == null) {
      throw new Error('Location card has no minimap.');
    }
    // Location minimaps paint their surface on the StaticMap stage.
    const surface = minimap.querySelector('[role="group"]') ?? minimap;
    return {
      well: getComputedStyle(surface).backgroundColor,
      card: getComputedStyle(card).backgroundColor,
    };
  });
}

function expectMonsterPageArtifacts(expected: RegExp[]): void {
  expected.push(
    /^\/v1\/releases\/[a-f0-9]{64}\.json$/u,
    /^\/v1\/build-indexes\/[a-f0-9]{64}\.json$/u,
    /^\/v2\/products\/[a-f0-9]{64}\.json$/u,
    /^\/v2\/monsters\/page-packs\/[a-f0-9]{64}\.json$/u,
    // Linked location cards preload their map on intent (router defaultPreload).
    /^\/v2\/maps\/page-packs\/[a-f0-9]{64}\.json$/u,
  );
}

function fixtureSpawnPointCount({
  buildId,
  monsterId,
  mapKey,
}: {
  readonly buildId: DetailCase['buildId'];
  readonly monsterId: string;
  readonly mapKey: string;
}): number {
  const build = world.builds.find((candidate) => candidate.buildId === buildId);
  const monster = build?.monsters.find(
    (candidate) => candidate.id === monsterId,
  );
  const location = monster?.locations?.find(
    (candidate) => candidate.mapKey === mapKey,
  );
  if (location?.points === undefined) {
    throw new Error(`No mock spawn points for ${monsterId} on ${mapKey}.`);
  }

  return location.points.length;
}

test('detail pages server-render metadata, hydrate without whole-build artifacts, and redirect stale slugs', async ({
  page,
  monsterPage,
  request,
  artifactRequests,
}) => {
  for (const item of DETAIL_CASES) {
    const publicId = monsterPublicId(item.sourceId);
    const canonical = canonicalPath(item);
    const stale = `${item.prefix}/monsters/wrong-slug-${publicId}`;

    const response = await request.get(canonical);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(item.name);
    expect(html).toContain(
      `<title>${item.name} – MapleStory ${item.buildLabel} Monster – MapleTip</title>`,
    );
    expect(html).toContain('rel="canonical"');
    expect(html).toContain(canonical);
    expect(html).toContain('BreadcrumbList');

    await monsterPage.goto(canonical);
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeVisible();
    await expect(monsterPage.heading(item.name)).toBeVisible();
    expect(artifactRequests).toEqual([]);

    const redirectResponse = await request.get(stale, { maxRedirects: 0 });
    expect(redirectResponse.status()).toBe(301);
    const location = redirectResponse.headers()['location'];
    expect(location).toBeDefined();
    expect(new URL(location!, 'http://127.0.0.1:4173').pathname).toBe(
      canonical,
    );

    await monsterPage.goto(stale);
    await expect(page).toHaveURL(canonical);
    await expect(monsterPage.heading(item.name)).toBeVisible();
  }
});

for (const item of DETAIL_CASES) {
  test(`Monster Browse links open the same-build ${item.buildLabel} Monster Detail page`, async ({
    page,
    monsterPage,
    artifactRequests,
    expectedArtifactRequests,
  }) => {
    const canonical = canonicalPath(item);
    await monsterPage.goto(`${item.prefix}/monsters`);
    expect(artifactRequests).toEqual([]);
    const nameLink = page
      .getByRole('link', { name: item.name, exact: true })
      .filter({ visible: true });
    await expect(nameLink).toHaveCount(1);
    await expect(nameLink).toHaveAttribute('href', canonical);
    expectedArtifactRequests.push(
      /^\/v1\/releases\/[a-f0-9]{64}\.json$/u,
      /^\/v1\/build-indexes\/[a-f0-9]{64}\.json$/u,
      /^\/v2\/products\/[a-f0-9]{64}\.json$/u,
      /^\/v2\/monsters\/page-packs\/[a-f0-9]{64}\.json$/u,
    );
    const documentNavigations: string[] = [];
    const recordDocumentNavigation = (request: Request) => {
      if (
        request.isNavigationRequest() &&
        request.frame() === page.mainFrame()
      ) {
        documentNavigations.push(request.url());
      }
    };
    page.on('request', recordDocumentNavigation);
    await nameLink.click();
    await expect(page).toHaveURL(`http://127.0.0.1:4173${canonical}`);
    await expect(monsterPage.heading(item.name)).toBeVisible();
    await page.waitForLoadState('networkidle');
    page.off('request', recordDocumentNavigation);
    expect(documentNavigations).toEqual([]);
  });
}

test('detail not-found addresses return 404 with noindex and a browse link', async ({
  page,
  monsterPage,
  request,
}) => {
  const cases = [
    {
      path: '/maplestory/monsters/shellback',
      browseLabel: 'Browse Classic World Monsters',
      browsePath: '/maplestory/monsters',
    },
    {
      path: '/maplestory/monsters/shellback-00000000',
      browseLabel: 'Browse Classic World Monsters',
      browsePath: '/maplestory/monsters',
    },
    {
      path: '/maplestory/gms-v83/monsters/shellback-00000000',
      browseLabel: 'Browse GMS v83 Monsters',
      browsePath: '/maplestory/gms-v83/monsters',
    },
  ];

  for (const entry of cases) {
    const response = await request.get(entry.path);
    expect(response.status()).toBe(404);
    const html = await response.text();
    expect(html).toContain('noindex,follow');

    await monsterPage.goto(entry.path);
    await expect(monsterPage.heading('Monster not found')).toBeVisible();
    const browseLink = page.getByRole('link', { name: entry.browseLabel });
    await expect(browseLink).toBeVisible();
    await expect(browseLink).toHaveAttribute('href', entry.browsePath);
  }
});

test('failed detail origin returns 500 with noindex and zero SDK diagnostics', async ({
  page,
  monsterPage,
  expectedBrowserErrors,
}) => {
  expectedBrowserErrors.console.push(/Failed to load resource.*500/u);
  expectedBrowserErrors.console.push(
    /^Error: Monster details could not be loaded\./u,
  );

  for (const item of DETAIL_CASES) {
    const url = `http://127.0.0.1:4174${canonicalPath(item)}`;
    const response = await page.request.get(url);
    expect(response.status()).toBe(500);
    const html = await response.text();
    expect(html).toContain('Something went wrong');
    expect(html).toContain('noindex,follow');
    expect(html).not.toMatch(DIAGNOSTIC_LEAK_PATTERN);

    await page.goto(url);
    await monsterPage.ready();
    await expect(
      page.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  }
});

test('Monster Detail shows grouped Drops and sources at each viewport', async ({
  page,
  monsterPage,
}, testInfo) => {
  const item: DetailCase = {
    buildId: 'cw-launch',
    prefix: '/maplestory',
    sourceId: 'crowned-warden',
    name: 'Crowned Warden',
    buildLabel: 'Classic World',
  };
  const canonical = canonicalPath(item);
  const spriteRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.includes('/media/images/')) {
      spriteRequests.push(request.url());
    }
  });
  await monsterPage.goto(canonical);

  await expect(page.getByText('Boss', { exact: true })).toBeVisible();
  const heroImages = page
    .locator('section[aria-labelledby="monster-name"] img')
    .filter({ visible: true });
  await expect(heroImages).toHaveCount(1);
  const heroSpriteUrl = await heroImages.getAttribute('src');
  expect(spriteRequests.filter((url) => url === heroSpriteUrl)).toHaveLength(1);
  const factList = page.locator('dl').first();
  await expect(factList.locator('> div')).toHaveCount(12);

  const sections = page.getByRole('navigation', { name: 'Record sections' });
  const dropsLink = sections.getByRole('link', { name: 'Drops (24)' });
  await expect(dropsLink).toHaveAttribute('href', '#drops');
  await dropsLink.click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Drops (24)' }),
  ).toBeVisible();

  const dropsControl = page
    .getByRole('heading', { level: 2, name: 'Drops (24)' })
    .getByRole('button', { name: 'Drops (24)' });
  await expect(dropsControl).toHaveAttribute('aria-expanded', 'true');
  await dropsControl.click();
  await expect(dropsControl).toHaveAttribute('aria-expanded', 'false');
  await expect(
    page.getByRole('heading', { level: 3, name: 'Equipment (4)' }),
  ).toBeHidden();
  await dropsControl.click();
  await expect(dropsControl).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('heading', { level: 3, name: 'Equipment (4)' }),
  ).toBeVisible();

  for (const group of [
    'Equipment (4)',
    'Usable (4)',
    'Etc (4)',
    'Setup (4)',
    'Cash (3)',
    'Pets (4)',
    'Unknown type (1)',
  ]) {
    await expect(
      page.getByRole('heading', { level: 3, name: group }),
    ).toBeVisible();
  }

  const itemName = page.getByText('Warden Token', { exact: true });
  await expect(itemName).toBeVisible();
  await expect(page.getByRole('link', { name: 'Warden Token' })).toHaveCount(0);
  const sourceButton = page.getByRole('button', {
    name: 'Sources for Warden Token',
  });
  await sourceButton.click();
  await expect(page.getByText("Another version's game files")).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', { name: 'Sources for Warden Token' }),
  ).toHaveCount(0);
  await page.mouse.move(5, 5);
  await page.evaluate(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();
  });
  await expect(
    page.getByRole('dialog', { name: 'Sources for Warden Token' }),
  ).toHaveCount(0);

  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page).toHaveScreenshot(
    `${testInfo.project.name}-monster-detail-drops.png`,
    { fullPage: true },
  );
});

test('Monster Detail shows quest requirements and summoning items at each viewport', async ({
  page,
  monsterPage,
  expectedArtifactRequests,
}, testInfo) => {
  const item: DetailCase = {
    buildId: 'cw-launch',
    prefix: '/maplestory',
    sourceId: 'crowned-warden',
    name: 'Crowned Warden',
    buildLabel: 'Classic World',
  };
  expectMonsterPageArtifacts(expectedArtifactRequests);
  await monsterPage.goto(canonicalPath(item));

  const navigation = page.getByRole('navigation', { name: 'Record sections' });
  await expect(
    navigation.getByRole('link', { name: 'Quests (1)' }),
  ).toHaveAttribute('href', '#quests');
  await expect(
    navigation.getByRole('link', { name: 'Summoned by (1)' }),
  ).toHaveAttribute('href', '#summoned-by');
  const sectionLabels = await navigation.getByRole('link').allTextContents();
  expect(sectionLabels).toEqual([
    'Locations (12)',
    'Drops (24)',
    'Quests (1)',
    'Summoned by (1)',
  ]);

  await expect(
    page.getByRole('heading', { level: 3, name: 'Synthetic Warden Hunt' }),
  ).toBeVisible();
  await expect(page.getByText('Lv. 12+', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Start: Lantern Maker · Warrior', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Defeat ×18', { exact: true })).toBeVisible();
  await expect(page.getByText('Repeatable', { exact: true })).toBeVisible();
  await expect(page.getByText('Shared with 2 other monsters')).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Summoned by (1)' }),
  ).toBeVisible();
  await expect(page.getByText('Quiet Bell', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Quiet Bell' })).toHaveCount(0);

  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  await monsterPage.captureReady();
  await expect(page).toHaveScreenshot(
    `${testInfo.project.name}-monster-detail-quests-summoned-by.png`,
    { fullPage: true },
  );
});

test('Monster Detail opens every location in a drawer from its responsive cap', async ({
  page,
  monsterPage,
  expectedArtifactRequests,
}, testInfo) => {
  const item: DetailCase = {
    buildId: 'cw-launch',
    prefix: '/maplestory',
    sourceId: 'crowned-warden',
    name: 'Crowned Warden',
    buildLabel: 'Classic World',
  };
  expectMonsterPageArtifacts(expectedArtifactRequests);
  await monsterPage.goto(canonicalPath(item));

  const locationsHeading = page.getByRole('heading', {
    level: 2,
    name: 'Locations (12)',
  });
  await expect(locationsHeading).toBeVisible();
  await monsterPage.captureReady();
  const inlineCards = page
    .getByRole('main')
    .getByTestId('monster-location-card');
  const previewMinimapColors = await minimapBackgrounds(inlineCards.first());
  expect(previewMinimapColors.well).not.toBe(previewMinimapColors.card);
  await expect(page).toHaveScreenshot(
    `${testInfo.project.name}-monster-detail-locations.png`,
    { fullPage: true },
  );
  const locationNavigation = page
    .getByRole('navigation', { name: 'Record sections' })
    .getByRole('link', { name: 'Locations (12)' });
  await expect(locationNavigation).toHaveAttribute('href', '#locations');

  const initialCap = testInfo.project.name === 'mobile' ? 5 : 10;
  await expect(inlineCards.filter({ visible: true })).toHaveCount(initialCap);

  const search = page.getByRole('textbox', { name: 'Find a map' });
  await search.fill('Practice Map 12');
  await expect(inlineCards.filter({ visible: true })).toHaveCount(1);
  await expect(
    page.getByRole('heading', { name: 'Practice Map 12' }),
  ).toBeVisible();
  await search.fill('');

  await page.getByRole('button', { name: 'View all 12 maps' }).click();
  await expect(page.getByRole('dialog', { name: /^All maps/u })).toBeVisible();
  const drawer = page.getByRole('dialog');
  const drawerCards = drawer.getByTestId('monster-location-card');
  await expect(drawerCards.filter({ visible: true })).toHaveCount(12);
  await expect(drawerCards.getByRole('link')).toHaveCount(12);
  const firstLocationMapPath = `/maplestory/maps/practice-map-01-${mapPublicId({ sourceId: 'cw-launch:fixture:map:01' })}`;
  await expect(
    drawerCards.filter({ hasText: 'Practice Map 01' }).getByRole('link'),
  ).toHaveAttribute(
    'href',
    `${firstLocationMapPath}?focus=monster-id-${monsterPublicId('crowned-warden')}`,
  );
  await expect(inlineCards.filter({ visible: true })).toHaveCount(initialCap);

  const searchIds = await page
    .locator('input[id$="-map-search"]')
    .evaluateAll((inputs) => inputs.map((input) => input.id));
  expect(searchIds).toHaveLength(2);
  expect(new Set(searchIds).size).toBe(2);
  const controlInputIds = await page
    .locator('[data-location-controls] input')
    .evaluateAll((inputs) => inputs.map((input) => input.id));
  expect(controlInputIds).toHaveLength(6);
  expect(new Set(controlInputIds).size).toBe(6);

  const drawerSort = drawer.getByRole('radiogroup', {
    name: 'Order locations',
  });
  await drawerSort.getByText('Map name', { exact: true }).click();
  await expect(
    drawer.getByRole('heading', { name: 'Practice Map 01' }),
  ).toBeVisible();
  await expect(
    drawer.getByTestId('map-card-footer').filter({ hasText: /^1 spawn$/u }),
  ).toBeVisible();
  await expect(
    drawer.getByRole('img', { name: 'Practice Map 01 minimap' }),
  ).toBeVisible();

  const drawerSearch = drawer.getByRole('textbox', { name: 'Find a map' });
  await drawerSearch.fill('Practice Map 12');
  await expect(page.getByRole('dialog', { name: /^All maps/u })).toBeVisible();
  await expect(drawerCards.filter({ visible: true })).toHaveCount(1);
  await expect(
    drawer.getByRole('heading', { name: 'Practice Map 12' }),
  ).toBeVisible();
  await expect(inlineCards.filter({ visible: true })).toHaveCount(1);
  await drawerSearch.fill('no matching map');
  await expect(drawer.getByRole('status')).toHaveText(
    'No maps match your search.',
  );
  await expect(drawerCards).toHaveCount(0);
  await drawerSearch.fill('');
  await expect(drawerCards).toHaveCount(12);

  const minimapBounds = await drawer
    .locator('[data-map-minimap="true"]')
    .first()
    .evaluate((element) => {
      const image = element.querySelector('img');
      if (image === null) throw new Error('Minimap image is missing.');
      const well = element.getBoundingClientRect();
      const art = image.getBoundingClientRect();
      return {
        left: art.left >= well.left,
        top: art.top >= well.top,
        right: art.right <= well.right,
        bottom: art.bottom <= well.bottom,
      };
    });
  expect(minimapBounds).toEqual({
    left: true,
    top: true,
    right: true,
    bottom: true,
  });

  const minimapColors = await minimapBackgrounds(drawerCards.first());
  expect(minimapColors.well).not.toBe(minimapColors.card);

  await expect(
    page.getByRole('heading', { name: 'Practice Map 01' }).first(),
  ).toBeVisible();

  await monsterPage.captureReady();
  await expect(page).toHaveScreenshot(
    `${testInfo.project.name}-monster-detail-locations-drawer.png`,
  );
  await drawer
    .getByRole('heading', { name: 'Practice Map 12' })
    .scrollIntoViewIfNeeded();
  await expect(
    drawer.getByRole('heading', { name: 'Practice Map 12' }),
  ).toBeInViewport();
  const expandTrigger = page.getByRole('button', { name: 'View all 12 maps' });
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(expandTrigger).toBeFocused();
  await expect(
    inlineCards.first().getByRole('heading', { name: 'Practice Map 01' }),
  ).toBeVisible();
});

test('Monster Detail location minimaps show dots inline and sprites in enlarged maps', async ({
  page,
  monsterPage,
  expectedArtifactRequests,
}, testInfo) => {
  const item: DetailCase = {
    buildId: 'cw-launch',
    prefix: '/maplestory',
    sourceId: 'crowned-warden',
    name: 'Crowned Warden',
    buildLabel: 'Classic World',
  };
  expectMonsterPageArtifacts(expectedArtifactRequests);
  await monsterPage.goto(canonicalPath(item));
  await page.waitForLoadState('networkidle');

  const firstMap = page
    .getByTestId('monster-location-card')
    .filter({ hasText: 'Practice Map 01' });
  const expectedKnownPoints = fixtureSpawnPointCount({
    buildId: 'cw-launch',
    monsterId: 'crowned-warden',
    mapKey: 'fixture:map:01',
  });
  const firstMinimap = firstMap.locator('[data-map-minimap="true"]');
  await expect(firstMinimap.locator('[data-marker-position]')).toHaveCount(
    expectedKnownPoints,
  );
  await expect(firstMinimap.locator('img')).toHaveAttribute('loading', 'lazy');

  const partialMap = page
    .getByTestId('monster-location-card')
    .filter({ hasText: 'Practice Map 02' });
  const expectedPartialPoints = fixtureSpawnPointCount({
    buildId: 'cw-launch',
    monsterId: 'crowned-warden',
    mapKey: 'fixture:map:02',
  });
  await expect(
    partialMap.locator('[data-map-minimap="true"] [data-marker-position]'),
  ).toHaveCount(expectedPartialPoints);
  await expect(partialMap.getByTestId('map-card-footer')).toHaveText(
    '11 spawns',
  );

  const trigger = firstMap.getByRole('button', {
    name: 'Enlarge Practice Map 01 minimap',
  });
  if (testInfo.project.name === 'mobile') {
    await expect(trigger).toHaveCount(0);
  } else {
    await trigger.click();
    const preview = page.getByRole('dialog', { name: 'Practice Map 01' });
    await expect(preview).toBeVisible();
    await expect(preview.locator('[data-marker-position]')).toHaveCount(
      expectedKnownPoints,
    );
    await expect(
      preview.locator('[data-marker-visual="monster-sprite"]'),
    ).toHaveCount(expectedKnownPoints);
    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden();
  }

  await page.getByRole('button', { name: 'View all 12 maps' }).click();
  const drawer = page.getByRole('dialog', { name: /^All maps/u });
  await expect(drawer).toBeVisible();
  const lazyMinimapImages = drawer.locator(
    '[data-map-minimap="true"] img[loading="lazy"]',
  );
  await expect(lazyMinimapImages).toHaveCount(2);
});

test('Monster Detail location cards open Map Detail at the top with the monster focused', async ({
  page,
  monsterPage,
  expectedArtifactRequests,
}, testInfo) => {
  const item: DetailCase = {
    buildId: 'cw-launch',
    prefix: '/maplestory',
    sourceId: 'crowned-warden',
    name: 'Crowned Warden',
    buildLabel: 'Classic World',
  };
  expectMonsterPageArtifacts(expectedArtifactRequests);
  await monsterPage.goto(canonicalPath(item));
  await page.waitForLoadState('networkidle');

  const mapPath = `/maplestory/maps/practice-map-01-${mapPublicId({ sourceId: 'cw-launch:fixture:map:01' })}`;
  const focusedMapPath = `${mapPath}?focus=monster-id-${monsterPublicId(item.sourceId)}`;
  const locationCard = page
    .getByTestId('monster-location-card')
    .filter({ hasText: 'Practice Map 01' });
  const link = locationCard.getByRole('link');
  await expect(link).toHaveAttribute('href', focusedMapPath);
  const target =
    testInfo.project.name === 'mobile'
      ? locationCard.locator('[data-map-minimap="true"]')
      : link;
  const { x, y, sourceScroll } = await target.evaluate(async (element) => {
    element.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const bounds = element.getBoundingClientRect();
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      sourceScroll: window.scrollY,
    };
  });
  expect(sourceScroll).toBeGreaterThan(100);
  if (testInfo.project.name === 'mobile') {
    await page.touchscreen.tap(x, y);
  } else {
    await link.click();
  }

  await expect(
    page.getByRole('heading', { level: 1, name: 'Practice Map 01' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('group', { name: 'Practice Map 01 map' })
      .locator('[data-selected="true"]'),
  ).toHaveCount(
    fixtureSpawnPointCount({
      buildId: item.buildId,
      monsterId: item.sourceId,
      mapKey: 'fixture:map:01',
    }),
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page).toHaveURL(focusedMapPath);

  await page.goBack();
  await expect(page).toHaveURL(canonicalPath(item));
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(sourceScroll);
});

test('Locations Drawer follows Back and Forward and leaves the page on the next Back', async ({
  page,
  monsterPage,
  expectedArtifactRequests,
}) => {
  const browsePath = '/maplestory/monsters';
  const item: DetailCase = {
    buildId: 'cw-launch',
    prefix: '/maplestory',
    sourceId: 'crowned-warden',
    name: 'Crowned Warden',
    buildLabel: 'Classic World',
  };
  const detailPath = `${canonicalPath(item)}?history=preserved#locations`;
  expectMonsterPageArtifacts(expectedArtifactRequests);
  await monsterPage.goto(browsePath);
  await page.goto(detailPath);
  await monsterPage.ready();
  await page.waitForLoadState('networkidle');
  await expect(monsterPage.heading('Crowned Warden')).toBeVisible();

  const expectedUrl = page.url();
  expect(new URL(expectedUrl).searchParams.get('history')).toBe('preserved');
  expect(new URL(expectedUrl).hash).toBe('#locations');
  const trigger = page.getByRole('button', { name: 'View all 12 maps' });
  await expect(trigger).toBeVisible();
  await trigger.click({ trial: true });
  const pageScrollY = await page.evaluate(() => window.scrollY);
  await trigger.click();

  const drawer = page.getByRole('dialog', { name: /^All maps/u });
  await expect(drawer).toBeVisible();
  await expect(page).toHaveURL(expectedUrl);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(pageScrollY);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  await page.reload();
  await monsterPage.ready();
  await expect(page).toHaveURL(expectedUrl);
  await expect(drawer).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  await page.goBack();
  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(expectedUrl);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(pageScrollY);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await page.goForward();
  await expect(drawer).toBeVisible();
  await expect(page).toHaveURL(expectedUrl);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(pageScrollY);

  await drawer.getByRole('button', { name: 'Close map list' }).click();
  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(expectedUrl);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(pageScrollY);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${browsePath}$`, 'u'));
  await expect(
    page.getByRole('heading', { level: 1, name: 'Crowned Warden' }),
  ).toBeHidden();

  await page.goForward();
  await expect(page).toHaveURL(expectedUrl);
  await expect(drawer).toBeHidden();
  await page.goForward();
  await expect(drawer).toBeVisible();
  await expect(page).toHaveURL(expectedUrl);
});

test('long drop names wrap without page-level horizontal overflow', async ({
  page,
  monsterPage,
}) => {
  const item: DetailCase = {
    buildId: 'cw-launch',
    prefix: '/maplestory',
    sourceId: 'crowned-revenant',
    name: 'Crowned Revenant',
    buildLabel: 'Classic World',
  };
  await monsterPage.goto(canonicalPath(item));

  await expect(
    page.getByText(
      'An Extraordinarily Long Synthetic Drop Name For Narrow Layouts',
      { exact: true },
    ),
  ).toBeVisible();
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});
