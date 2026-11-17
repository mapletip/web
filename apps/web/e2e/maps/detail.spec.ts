import type { Page } from '@playwright/test';

import { mapPublicId, monsterPublicId } from '../../src/mocks/release';
import { expect, test } from '../fixtures';

interface SavedMapDetailView {
  readonly zoom: number;
  readonly centerX: number;
  readonly centerY: number;
}

interface MapDetailHistoryState {
  readonly mapDetailStageView?: SavedMapDetailView;
  readonly mapDetailFindText?: string;
  readonly mapDetailOverlay?: { readonly type?: string };
}

async function readMapDetailHistoryState(
  page: Page,
): Promise<MapDetailHistoryState> {
  return page.evaluate(() => {
    const state: unknown = window.history.state;
    return state !== null && typeof state === 'object' ? state : {};
  });
}

async function waitForMapDetailHydration(
  page: Page,
  selector = 'main',
): Promise<void> {
  await page.waitForFunction((query) => {
    const element = document.querySelector(query);
    return (
      element !== null &&
      Object.keys(element).some((key) => key.startsWith('__reactProps'))
    );
  }, selector);
}

test('Map Detail renders its canonical address, redirects stale slugs, and returns 404 for invalid records', async ({
  page,
  request,
}) => {
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  const canonical = `/maplestory/maps/practice-grove-${publicId}`;
  const stale = `/maplestory/maps/old-slug-${publicId}`;

  const foundResponse = await request.get(canonical);
  expect(foundResponse.status()).toBe(200);
  const html = await foundResponse.text();
  expect(html).toContain('Practice Grove');
  expect(html).toContain(
    'MapleStory Map, Monster Spawns &amp; NPCs | Classic World',
  );
  expect(html).toContain(`rel="canonical"`);
  expect(html).toContain(canonical);
  expect(html).toContain('BreadcrumbList');

  await page.goto(canonical);
  await page.waitForLoadState('networkidle');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Practice Grove' }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', {
      name: 'Maps',
    }),
  ).toHaveAttribute('href', '/maplestory/maps');

  await expect(
    page
      .getByRole('navigation', { name: 'Record sections' })
      .getByRole('link', { name: 'Monsters (4)' }),
  ).toHaveAttribute('href', '#monsters');
  const monsterPath = `/maplestory/monsters/crowned-warden-${monsterPublicId('crowned-warden')}`;
  const bossCard = page
    .getByTestId('map-monster-card')
    .filter({ hasText: 'Crowned Warden' });
  await expect(bossCard.getByText('Boss')).toBeVisible();
  await expect(bossCard.getByRole('link')).toHaveAttribute('href', monsterPath);
  await bossCard.getByRole('link').click();
  await expect(page).toHaveURL(`http://127.0.0.1:4173${monsterPath}`);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Crowned Warden' }),
  ).toBeVisible();

  await page.goto(canonical);
  await page.waitForLoadState('networkidle');

  const connectionPath = `/maplestory/maps/lantern-square-${mapPublicId({ sourceId: 'cw-launch:lantern-square' })}`;
  const connectionsNavigation = page
    .getByRole('navigation', { name: 'Record sections' })
    .getByRole('link', { name: 'Connections (1)' });
  await expect(connectionsNavigation).toHaveAttribute('href', '#connections');
  const connectionCard = page.getByTestId('map-connection-card');
  await expect(connectionCard.getByRole('link')).toHaveAttribute(
    'href',
    connectionPath,
  );
  await connectionCard.getByRole('link').click();
  await expect(page).toHaveURL(`http://127.0.0.1:4173${connectionPath}`);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lantern Square' }),
  ).toBeVisible();

  const redirectResponse = await request.get(stale, { maxRedirects: 0 });
  expect(redirectResponse.status()).toBe(301);
  const location = redirectResponse.headers()['location'];
  expect(location).toBeDefined();
  expect(new URL(location!, 'http://127.0.0.1:4173').pathname).toBe(canonical);

  await page.goto(stale);
  await expect(page).toHaveURL(`http://127.0.0.1:4173${canonical}`);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Practice Grove' }),
  ).toBeVisible();

  for (const path of [
    '/maplestory/maps/missing-00000000',
    '/maplestory/maps/not-a-map-address',
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    const notFoundHtml = await response.text();
    expect(notFoundHtml).toContain('noindex,follow');

    await page.goto(path);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Map not found' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Browse Classic World Maps' }),
    ).toHaveAttribute('href', '/maplestory/maps');
  }
});

test('Map Detail shows all record sections at the project viewport and has no narrow overflow', async ({
  page,
}) => {
  const publicId = mapPublicId({ sourceId: 'cw-launch:lantern-square' });
  await page.goto(`/maplestory/maps/lantern-square-${publicId}`);
  await page.waitForLoadState('networkidle');
  await waitForMapDetailHydration(page);

  const navigation = page.getByRole('navigation', {
    name: 'Record sections',
  });
  await expect(
    navigation.getByRole('link', { name: /^Connections \(/u }),
  ).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Monsters (0)' }),
  ).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'NPCs (8)' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /^Connections \(/u }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Monsters (0)' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'NPCs (8)' })).toBeVisible();

  await page.setViewportSize({ width: 320, height: 844 });
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});

test('Connections search filters the town fixture by connected map name', async ({
  page,
}) => {
  const publicId = mapPublicId({ sourceId: 'cw-launch:lantern-square' });
  await page.goto(`/maplestory/maps/lantern-square-${publicId}`);
  await waitForMapDetailHydration(page, 'input[placeholder="Map name"]');

  const search = page.getByRole('textbox', { name: 'Search connected maps' });
  await expect(search).toBeVisible();
  await expect(page.getByText('Showing 7 of 7 connected maps')).toHaveCount(0);
  await search.click();
  await search.pressSequentially('PRACTICE');
  await expect(search).toHaveValue('PRACTICE');
  await expect(page.getByText('Showing 1 of 7 connected maps')).toBeVisible();
  await expect(page.getByTestId('map-connection-card')).toHaveCount(1);
  await expect(
    page.getByTestId('map-connection-card').getByRole('heading', {
      name: 'Practice Grove',
    }),
  ).toBeVisible();
});

test('Map Detail sorts monsters by level, spawns and name', async ({
  page,
}) => {
  const publicId = mapPublicId({
    sourceId: 'cw-launch:synthetic-monster-yard',
  });
  await page.goto(`/maplestory/maps/synthetic-monster-yard-${publicId}`);
  await page.waitForLoadState('networkidle');
  await waitForMapDetailHydration(page);

  const cards = page.getByTestId('map-monster-card');
  const names = () => cards.locator('h3').allTextContents();
  const sort = page.getByRole('combobox', { name: 'Sort monsters' });
  await expect(sort).toHaveValue('Level: Low to high');
  expect(await names()).toEqual([
    'Plain Pebble',
    'Twin Sprout',
    'Patchy Records',
    'Zero Yield Drone',
    'Hollow Husk',
    'Big Number Brute',
    'Crowned Warden',
  ]);

  await sort.click();
  await page.getByRole('option', { name: 'Spawns: Most to fewest' }).click();
  expect(await names()).toEqual([
    'Zero Yield Drone',
    'Hollow Husk',
    'Twin Sprout',
    'Crowned Warden',
    'Patchy Records',
    'Big Number Brute',
    'Plain Pebble',
  ]);

  await sort.click();
  await page.getByRole('option', { name: 'Name: A to Z' }).click();
  expect(await names()).toEqual([
    'Big Number Brute',
    'Crowned Warden',
    'Hollow Husk',
    'Patchy Records',
    'Plain Pebble',
    'Twin Sprout',
    'Zero Yield Drone',
  ]);
});

test('Map Detail shows its stage and markers on desktop and mobile', async ({
  page,
}) => {
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);

  await expect(
    page.getByRole('group', { name: 'Practice Grove map' }),
  ).toBeVisible();
  await expect(page.locator('[data-marker-ids]').first()).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole('group', { name: 'Practice Grove map' }),
  ).toBeVisible();
  await expect(page.locator('[data-marker-ids]').first()).toBeVisible();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`Locate opens Explore with the selected monster at ${viewport.width}px and Back closes it`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
    await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
    await page.waitForLoadState('networkidle');

    const sproutCard = page
      .getByTestId('map-monster-card')
      .filter({ hasText: 'Twin Sprout' });
    await sproutCard
      .getByRole('button', { name: 'Locate 2 Twin Sprout spawns on map' })
      .click();

    const dialog = page.getByRole('dialog', { name: 'Practice Grove' });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
    const exploreStage = dialog.getByRole('group', {
      name: 'Practice Grove map',
    });
    await expect(exploreStage.locator('[data-selected="true"]')).toHaveCount(2);

    await page.goBack();

    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
    await expect(
      page
        .getByRole('group', { name: 'Practice Grove map' })
        .locator('[data-selected="true"]'),
    ).toHaveCount(2);
  });
}

test('Map Detail selection follows the address on desktop and stays static on mobile', async ({
  page,
  escapedDataRequests,
}, testInfo) => {
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  const mapPath = `/maplestory/maps/practice-grove-${publicId}`;
  await page.goto(mapPath);

  const stage = page.getByRole('group', { name: 'Practice Grove map' });
  const viewportWidth = testInfo.project.use.viewport?.width ?? 1366;

  if (viewportWidth >= 992) {
    const marker = stage.getByRole('button', {
      name: 'Twin Sprout, Monster, 2 of 2',
    });
    await expect(marker).toBeVisible();
    const dataRequestsAfterLoad = [...escapedDataRequests];
    await marker.click();
    await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
    await expect(stage.locator('[data-selected="true"]')).toHaveCount(2);
    expect(escapedDataRequests).toEqual(dataRequestsAfterLoad);

    await marker.click();
    await expect(page).not.toHaveURL(/focus=/u);
    expect(escapedDataRequests).toEqual(dataRequestsAfterLoad);

    await marker.click();
    await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
    expect(escapedDataRequests).toEqual(dataRequestsAfterLoad);

    await page.reload();
    await expect(stage.locator('[data-selected="true"]')).toHaveCount(2);
    return;
  }

  expect(viewportWidth).toBe(390);
  await expect(stage.locator('button[data-marker-ids]')).toHaveCount(0);
  await expect(stage.locator('[data-marker-ids]').first()).toBeVisible();
});

async function openExploreAndSelectTwinSprout(
  page: Page,
  initialFocus?: string,
) {
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  const focusSearch =
    initialFocus === undefined ? '' : `?focus=${initialFocus}`;
  await page.goto(`/maplestory/maps/practice-grove-${publicId}${focusSearch}`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Explore map' }).click();

  const dialog = page.getByRole('dialog', { name: 'Practice Grove' });
  await expect(dialog).toBeVisible();
  const stage = dialog.getByRole('group', { name: 'Practice Grove map' });
  await stage
    .getByRole('button', { name: 'Twin Sprout, Monster, 2 of 2' })
    .first()
    .click();
  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect(stage.locator('[data-selected="true"]')).toHaveCount(2);
  return dialog;
}

test('Explore closes by its control and keeps marker selection at both viewports', async ({
  page,
}) => {
  const dialog = await openExploreAndSelectTwinSprout(page);
  await dialog.getByRole('button', { name: 'Close map' }).click();

  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Practice Grove' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('group', { name: 'Practice Grove map' })
      .locator('[data-selected="true"]'),
  ).toHaveCount(2);
});

test('Escape closes Explore and keeps marker selection at both viewports', async ({
  page,
}) => {
  const dialog = await openExploreAndSelectTwinSprout(page);
  await page.keyboard.press('Escape');

  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Practice Grove' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('group', { name: 'Practice Grove map' })
      .locator('[data-selected="true"]'),
  ).toHaveCount(2);
});

test('browser Back closes Explore and restores the entry selection at both viewports', async ({
  page,
}) => {
  const dialog = await openExploreAndSelectTwinSprout(page, 'monsters');
  await page.goBack();

  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/focus=monsters/u);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Practice Grove' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('group', { name: 'Practice Grove map' })
      .locator('[data-selected="true"]'),
  ).toHaveCount(4);
});

test('TanStack replace state survives reload and Back without rerunning the map loader', async ({
  page,
}) => {
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');

  const appFetches: string[] = [];
  page.on('request', (request) => {
    if (
      request.resourceType() === 'fetch' ||
      request.resourceType() === 'xhr'
    ) {
      appFetches.push(request.url());
    }
  });

  await page.getByRole('button', { name: 'Explore map' }).click();
  const dialog = page.getByRole('dialog', { name: 'Practice Grove' });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window.history.state as { readonly mapDetailOverlay?: unknown })
            ?.mapDetailOverlay,
      ),
    )
    .toMatchObject({ type: 'explore' });
  await dialog
    .getByRole('group', { name: 'Practice Grove map' })
    .getByRole('button', { name: 'Twin Sprout, Monster, 2 of 2' })
    .first()
    .click();

  expect(appFetches).toEqual([]);
  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window.history.state as { readonly mapDetailOverlay?: unknown })
            ?.mapDetailOverlay,
      ),
    )
    .toMatchObject({ type: 'explore' });

  await page.reload();
  await expect(
    page.getByRole('dialog', { name: 'Practice Grove' }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole('dialog', { name: 'Practice Grove' }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/practice-grove-[a-z0-9]{8}$/u);
});

test('desktop Map Detail zoom controls enlarge the stage and Fit restores it', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Inline zoom is desktop only.',
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');

  const stage = page.getByRole('group', { name: 'Practice Grove map' });
  const image = stage.getByRole('img', { name: 'Practice Grove map' });
  const fitted = await image.boundingBox();
  expect(fitted).not.toBeNull();
  await stage.getByRole('button', { name: 'Zoom in' }).click();
  await expect
    .poll(async () => (await image.boundingBox())?.width ?? 0)
    .toBeGreaterThan(fitted!.width * 1.3);

  await stage.getByRole('button', { name: 'Fit map' }).click();
  await expect
    .poll(async () => (await image.boundingBox())?.width ?? 0)
    .toBeCloseTo(fitted!.width, 0);
});

test('Map Detail restores a zoomed and panned stage after reload', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Inline pan and zoom are desktop only.',
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);

  const stage = page.getByRole('group', { name: 'Practice Grove map' });
  const image = stage.getByRole('img', { name: 'Practice Grove map' });
  await stage.getByRole('button', { name: 'Zoom in' }).click();
  await expect
    .poll(
      async () => (await readMapDetailHistoryState(page)).mapDetailStageView,
    )
    .toBeDefined();
  const zoomedState = await readMapDetailHistoryState(page);

  const imageBox = await image.boundingBox();
  expect(imageBox).not.toBeNull();
  await page.mouse.move(
    imageBox!.x + imageBox!.width * 0.6,
    imageBox!.y + imageBox!.height * 0.4,
  );
  await page.mouse.down();
  await page.mouse.move(
    imageBox!.x + imageBox!.width * 0.6 + 70,
    imageBox!.y + imageBox!.height * 0.4 + 45,
    { steps: 6 },
  );
  await page.mouse.up();

  await expect
    .poll(
      async () => (await readMapDetailHistoryState(page)).mapDetailStageView,
    )
    .not.toEqual(zoomedState.mapDetailStageView);
  const savedState = await readMapDetailHistoryState(page);
  const savedStageBox = await stage.boundingBox();
  const savedImageBox = await image.boundingBox();
  expect(savedState.mapDetailStageView).toBeDefined();
  expect(savedStageBox).not.toBeNull();
  expect(savedImageBox).not.toBeNull();

  await page.reload();
  await expect
    .poll(
      async () => (await readMapDetailHistoryState(page)).mapDetailStageView,
    )
    .toEqual(savedState.mapDetailStageView);
  const restoredStage = page.getByRole('group', { name: 'Practice Grove map' });
  const restoredImage = restoredStage.getByRole('img', {
    name: 'Practice Grove map',
  });
  await expect
    .poll(async () => (await restoredImage.boundingBox())?.width ?? 0)
    .toBeCloseTo(savedImageBox!.width, 0);
  const restoredStageBox = await restoredStage.boundingBox();
  const restoredImageBox = await restoredImage.boundingBox();
  expect(restoredStageBox).not.toBeNull();
  expect(restoredImageBox).not.toBeNull();
  expect(restoredImageBox!.x - restoredStageBox!.x).toBeCloseTo(
    savedImageBox!.x - savedStageBox!.x,
    0,
  );
  expect(restoredImageBox!.y - restoredStageBox!.y).toBeCloseTo(
    savedImageBox!.y - savedStageBox!.y,
    0,
  );
});

test('Map Detail restores its stage view after following a connection and going Back', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Inline zoom is desktop only.',
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  const stage = page.getByRole('group', { name: 'Practice Grove map' });
  await stage.getByRole('button', { name: 'Zoom in' }).click();
  await expect
    .poll(
      async () => (await readMapDetailHistoryState(page)).mapDetailStageView,
    )
    .toBeDefined();
  const savedView = (await readMapDetailHistoryState(page)).mapDetailStageView;

  await page
    .getByTestId('map-connection-card')
    .getByRole('link', { name: /Lantern Square/u })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lantern Square' }),
  ).toBeVisible();
  await page.goBack();

  await expect(
    page.getByRole('heading', { level: 1, name: 'Practice Grove' }),
  ).toBeVisible();
  await expect
    .poll(
      async () => (await readMapDetailHistoryState(page)).mapDetailStageView,
    )
    .toEqual(savedView);
});

test('Map Detail find text survives a visit to a monster page and Back', async ({
  page,
}, testInfo) => {
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');
  if ((testInfo.project.use.viewport?.width ?? 1366) < 768) {
    await page.getByRole('button', { name: 'Search map' }).click();
    await expect(
      page.getByRole('button', { name: 'Close map search' }),
    ).toBeVisible();
  }

  const find = page.getByRole('combobox', { name: 'Find on this map' });
  await find.fill('sprout');
  await expect
    .poll(async () => (await readMapDetailHistoryState(page)).mapDetailFindText)
    .toBe('sprout');
  await page
    .getByTestId('map-monster-card')
    .filter({ hasText: 'Twin Sprout' })
    .getByRole('link')
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Twin Sprout' }),
  ).toBeVisible();
  await page.goBack();

  await expect(
    page.getByRole('heading', { level: 1, name: 'Practice Grove' }),
  ).toBeVisible();
  if ((testInfo.project.use.viewport?.width ?? 1366) < 768) {
    await page.getByRole('button', { name: 'Search map' }).click();
  }
  await expect(
    page.getByRole('combobox', { name: 'Find on this map' }),
  ).toHaveValue('sprout');
});

test('Explore restores its view after following a connection inside it and going Back', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'This scenario zooms inside Explore on desktop.',
  );
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Explore map' }).click();
  const dialog = page.getByRole('dialog', { name: 'Practice Grove' });
  await expect(dialog).toBeVisible();
  const stage = dialog.getByRole('group', { name: 'Practice Grove map' });
  await stage.getByRole('button', { name: 'Zoom in' }).click();
  await expect
    .poll(
      async () => (await readMapDetailHistoryState(page)).mapDetailStageView,
    )
    .toBeDefined();
  const savedView = (await readMapDetailHistoryState(page)).mapDetailStageView;
  if (savedView === undefined)
    throw new Error('Expected Explore to save its view.');
  await stage
    .getByRole('button', { name: 'Lantern Square, Connection, 1 of 1' })
    .click();
  await dialog.getByRole('link', { name: 'Lantern Square' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lantern Square' }),
  ).toBeVisible();
  await page.goBack();

  await expect(dialog).toBeVisible();
  await expect
    .poll(
      async () => (await readMapDetailHistoryState(page)).mapDetailStageView,
    )
    .toEqual(savedView);
});

test('opening Explore keeps the inline stage view', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Inline zoom is desktop only.',
  );
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  const inlineStage = page.getByRole('group', { name: 'Practice Grove map' });
  await inlineStage.getByRole('button', { name: 'Zoom in' }).click();
  await expect
    .poll(
      async () => (await readMapDetailHistoryState(page)).mapDetailStageView,
    )
    .toBeDefined();
  const inlineView = (await readMapDetailHistoryState(page)).mapDetailStageView;

  await page.getByRole('button', { name: 'Explore map' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Practice Grove' }),
  ).toBeVisible();
  await expect
    .poll(
      async () => (await readMapDetailHistoryState(page)).mapDetailStageView,
    )
    .toEqual(inlineView);
});

test('a copied focused address opens fitted with only its selection restored', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Inline zoom is desktop only.',
  );
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  const stage = page.getByRole('group', { name: 'Practice Grove map' });
  await stage.getByRole('button', { name: 'Zoom in' }).click();
  await stage
    .getByRole('button', { name: 'Twin Sprout, Monster, 2 of 2' })
    .first()
    .click();
  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);

  const copiedPage = await page.context().newPage();
  await copiedPage.goto(page.url());
  const copiedStage = copiedPage.getByRole('group', {
    name: 'Practice Grove map',
  });
  await expect(copiedStage.locator('[data-selected="true"]')).toHaveCount(2);
  await expect(
    copiedPage.getByRole('dialog', { name: 'Practice Grove' }),
  ).toHaveCount(0);
  await expect(
    copiedPage.getByRole('combobox', { name: 'Find on this map' }),
  ).toHaveValue('');
  const copiedState = await readMapDetailHistoryState(copiedPage);
  expect(copiedState.mapDetailStageView).toBeUndefined();
  const copiedImage = copiedStage.getByRole('img', {
    name: 'Practice Grove map',
  });
  await expect(copiedImage).toBeVisible();
  await expect
    .poll(() =>
      copiedImage.evaluate((element) => {
        const image = element as HTMLImageElement;
        return image.complete && image.naturalWidth > 0;
      }),
    )
    .toBe(true);
  const copiedStageBox = await copiedStage.boundingBox();
  const copiedImageBox = await copiedImage.boundingBox();
  expect(copiedStageBox).not.toBeNull();
  expect(copiedImageBox).not.toBeNull();
  expect(copiedImageBox!.width).toBeCloseTo(copiedStageBox!.width, 0);
  await copiedPage.close();
});

test('Explore stage accepts wheel zoom on desktop', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Wheel input is tested on desktop.',
  );
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Explore map' }).click();

  const dialog = page.getByRole('dialog', { name: 'Practice Grove' });
  const image = dialog
    .getByRole('group', { name: 'Practice Grove map' })
    .getByRole('img', { name: 'Practice Grove map' });
  const fitted = await image.boundingBox();
  expect(fitted).not.toBeNull();
  const stageBox = await dialog
    .getByRole('group', { name: 'Practice Grove map' })
    .boundingBox();
  expect(stageBox).not.toBeNull();
  const controlsBox = await dialog
    .getByRole('group', { name: 'Map controls' })
    .boundingBox();
  expect(controlsBox).not.toBeNull();
  expect(
    Math.abs(
      stageBox!.y +
        stageBox!.height -
        controlsBox!.y -
        controlsBox!.height -
        12,
    ),
  ).toBeLessThanOrEqual(3);
  expect(controlsBox!.height).toBeLessThan(150);
  await page.mouse.move(
    stageBox!.x + stageBox!.width * 0.95,
    stageBox!.y + stageBox!.height / 2,
  );
  await page.mouse.wheel(0, -500);
  await expect
    .poll(async () => (await image.boundingBox())?.width ?? 0)
    .toBeGreaterThan(fitted!.width * 1.1);
});

test('mobile Map Detail stays static inline and Explore fills the viewport', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile Explore layout.');
  await page.setViewportSize({ width: 390, height: 844 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');

  const inlineStage = page.getByRole('group', { name: 'Practice Grove map' });
  await expect(inlineStage.locator('button[data-marker-ids]')).toHaveCount(0);
  await expect(
    inlineStage.getByRole('group', { name: 'Map controls' }),
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Explore map' }).click();
  const dialog = page.getByRole('dialog', { name: 'Practice Grove' });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box?.width).toBe(390);
  expect(box?.height).toBe(844);
  const exploreStage = dialog.getByRole('group', {
    name: 'Practice Grove map',
  });
  await expect(
    exploreStage.getByRole('group', { name: 'Map controls' }),
  ).toBeVisible();
});

test('On this map selects every town NPC and restores the selection after reload', async ({
  page,
}) => {
  const publicId = mapPublicId({ sourceId: 'cw-launch:lantern-square' });
  await page.goto(`/maplestory/maps/lantern-square-${publicId}`);
  await page.waitForLoadState('networkidle');

  const npcRow = page
    .getByRole('region', { name: 'On this map' })
    .getByRole('button', { name: /Highlight NPCs on map/u });
  await npcRow.click();
  await expect(page).toHaveURL(/focus=npcs/u);
  await expect(npcRow).toHaveAttribute('aria-pressed', 'true');

  const expectNpcMarkersRinged = async () => {
    const selected = await page
      .getByRole('group', { name: 'Lantern Square map' })
      .locator('[data-marker-ids*="npc:"]')
      .evaluateAll((markers) =>
        markers.map(
          (marker) => marker.getAttribute('data-selected') === 'true',
        ),
      );
    expect(selected.length).toBeGreaterThan(0);
    expect(selected.every(Boolean)).toBe(true);
  };

  await expectNpcMarkersRinged();
  await page.reload();
  await expect(page).toHaveURL(/focus=npcs/u);
  await expect(
    page
      .getByRole('region', { name: 'On this map' })
      .getByRole('button', { name: /Highlight NPCs on map/u }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expectNpcMarkersRinged();
});

test('Map Detail legend chips select entities and ring their markers at desktop and mobile widths', async ({
  page,
}, testInfo) => {
  const width = testInfo.project.name === 'mobile' ? 390 : 1440;
  await page.setViewportSize({ width, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');

  const stage = page.getByRole('group', { name: 'Practice Grove map' });
  const legend = page.getByRole('region', { name: 'Scrollable map legend' });
  const chip = legend.getByRole('checkbox', { name: 'Twin Sprout, Monster' });
  await expect(chip).not.toBeChecked();
  await legend.getByText('Twin Sprout', { exact: true }).click();

  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect(chip).toBeChecked();
  await expect(stage.locator('[data-selected="true"]')).toHaveCount(2);
});

test('Map Detail Find selects Twin Sprout and writes its focus to the address', async ({
  page,
}, testInfo) => {
  const width = testInfo.project.name === 'mobile' ? 390 : 1440;
  await page.setViewportSize({ width, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');

  if (width < 768) {
    await page.getByRole('button', { name: 'Search map' }).click();
    await expect(
      page.getByRole('button', { name: 'Close map search' }),
    ).toBeVisible();
  }

  const find = page.getByRole('combobox', { name: 'Find on this map' });
  await find.fill('sprout');
  await page.getByRole('option', { name: 'Twin Sprout — Monster' }).click();

  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect(
    page
      .getByRole('group', { name: 'Practice Grove map' })
      .locator('[data-selected="true"]'),
  ).toHaveCount(2);
});

test('Map Detail legend Ctrl-click selects two monsters in legend order and survives reload', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Desktop pointer interaction.',
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');

  const stage = page.getByRole('group', { name: 'Practice Grove map' });
  const legend = page.getByRole('region', { name: 'Scrollable map legend' });
  const twinSprout = legend.getByRole('checkbox', {
    name: 'Twin Sprout, Monster',
  });
  const hollowHusk = legend.getByRole('checkbox', {
    name: 'Hollow Husk, Monster',
  });

  await legend.getByText('Twin Sprout', { exact: true }).click();
  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect(twinSprout).toBeChecked();
  const twinSproutKey = new URL(page.url()).searchParams.get('focus');
  expect(twinSproutKey).toMatch(/^monster-[a-z0-9]{8}$/u);

  await legend.getByText('Hollow Husk', { exact: true }).click();
  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect(twinSprout).not.toBeChecked();
  await expect(hollowHusk).toBeChecked();
  const hollowHuskKey = new URL(page.url()).searchParams.get('focus');
  expect(hollowHuskKey).toMatch(/^monster-[a-z0-9]{8}$/u);

  await legend
    .getByText('Twin Sprout', { exact: true })
    .click({ modifiers: ['Control'] });
  const legendNames = await legend
    .getByRole('checkbox')
    .evaluateAll((inputs) =>
      inputs.map((input) => input.getAttribute('aria-label')),
    );
  const canonicalSelection =
    legendNames.indexOf('Twin Sprout, Monster') <
    legendNames.indexOf('Hollow Husk, Monster')
      ? `${twinSproutKey},${hollowHuskKey}`
      : `${hollowHuskKey},${twinSproutKey}`;
  await expect
    .poll(() => new URL(page.url()).searchParams.get('focus'))
    .toBe(canonicalSelection);
  await expect(twinSprout).toBeChecked();
  await expect(hollowHusk).toBeChecked();
  await expect(stage.locator('[data-selected="true"]')).toHaveCount(3);
  const twinSproutMarkers = stage.getByRole('button', {
    name: /Twin Sprout, Monster/u,
  });
  await expect(twinSproutMarkers).toHaveCount(2);
  await expect(twinSproutMarkers.nth(0)).toHaveAttribute(
    'data-selected',
    'true',
  );
  await expect(twinSproutMarkers.nth(1)).toHaveAttribute(
    'data-selected',
    'true',
  );
  await expect(
    stage.getByRole('button', { name: /Hollow Husk, Monster/u }),
  ).toHaveAttribute('data-selected', 'true');

  await page.reload();
  await expect
    .poll(() => new URL(page.url()).searchParams.get('focus'))
    .toBe(canonicalSelection);
  await expect(twinSprout).toBeChecked();
  await expect(hollowHusk).toBeChecked();
  await expect(stage.locator('[data-selected="true"]')).toHaveCount(3);
  await expect(twinSproutMarkers.nth(0)).toHaveAttribute(
    'data-selected',
    'true',
  );
  await expect(twinSproutMarkers.nth(1)).toHaveAttribute(
    'data-selected',
    'true',
  );
  await expect(
    stage.getByRole('button', { name: /Hollow Husk, Monster/u }),
  ).toHaveAttribute('data-selected', 'true');
});

test('Map Detail legend Ctrl+Space adds the focused chip to the selection', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Keyboard interaction is desktop only.',
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');

  const legend = page.getByRole('region', { name: 'Scrollable map legend' });
  const hollowHusk = legend.getByRole('checkbox', {
    name: 'Hollow Husk, Monster',
  });
  const twinSprout = legend.getByRole('checkbox', {
    name: 'Twin Sprout, Monster',
  });

  await legend.getByText('Twin Sprout', { exact: true }).click();
  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect(twinSprout).toBeChecked();
  await hollowHusk.evaluate((input) => input.focus());
  await expect(hollowHusk).toBeFocused();

  await page.keyboard.press('Control+Space');

  await expect(twinSprout).toBeChecked();
  await expect(hollowHusk).toBeChecked();
  await expect
    .poll(() => new URL(page.url()).searchParams.get('focus'))
    .toMatch(/^monster-[a-z0-9]{8},monster-[a-z0-9]{8}$/u);
});

test('Map Detail shows the stage message when a map has no image', async ({
  page,
}) => {
  const publicId = mapPublicId({ sourceId: 'cw-launch:quiet-gallery' });
  await page.goto(`/maplestory/maps/quiet-gallery-${publicId}`);

  await expect(
    page.getByRole('group', {
      name: "Map image isn't available.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Map image isn't available.")).toBeVisible();
});
