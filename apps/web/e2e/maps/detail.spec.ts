import type { Locator, Page } from '@playwright/test';

import { mapPublicId, monsterPublicId } from '../../src/mocks/release';
import { expect, test } from '../fixtures';

async function waitForMapDetailHydration(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Explore map' })).toBeEnabled();
}

interface RenderedStageView {
  readonly scale: number;
  readonly imageCenterX: number;
  readonly imageCenterY: number;
  readonly imageWidth: number;
  readonly imageFitsStageOnAxis: boolean;
}

async function renderedStageView(
  stage: Locator,
): Promise<RenderedStageView | null> {
  const stageBox = await stage.boundingBox();
  const imageBox = await stage.getByRole('img').boundingBox();
  if (stageBox === null || imageBox === null) return null;
  return {
    scale: Number((await renderedStageScale(stage)).toFixed(3)),
    imageCenterX: Number(
      ((stageBox.x + stageBox.width / 2 - imageBox.x) / imageBox.width).toFixed(
        3,
      ),
    ),
    imageCenterY: Number(
      (
        (stageBox.y + stageBox.height / 2 - imageBox.y) /
        imageBox.height
      ).toFixed(3),
    ),
    imageWidth: Math.round(imageBox.width),
    imageFitsStageOnAxis:
      Math.abs(stageBox.width - imageBox.width) <= 1 ||
      Math.abs(stageBox.height - imageBox.height) <= 1,
  };
}

async function renderedStageScale(stage: Locator): Promise<number> {
  return stage.locator('.react-transform-component').evaluate((element) => {
    const match = element.getAttribute('style')?.match(/scale\(([-\d.]+)\)/u);
    return Number(match?.[1] ?? 1);
  });
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
    page.getByRole('heading', { name: 'Monsters on this map' }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Record sections' }),
  ).toHaveCount(0);
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
  await expect(
    page.getByRole('heading', { name: 'Connections' }),
  ).toBeVisible();
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

test('Map Detail renders direct sections and has no narrow overflow', async ({
  page,
}) => {
  const publicId = mapPublicId({ sourceId: 'cw-launch:lantern-square' });
  await page.goto(`/maplestory/maps/lantern-square-${publicId}`);
  await page.waitForLoadState('networkidle');
  await waitForMapDetailHydration(page);

  await expect(
    page.getByRole('navigation', { name: 'Record sections' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Connections' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Monsters on this map' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'NPCs on this map' }),
  ).toBeVisible();

  await page.setViewportSize({ width: 320, height: 844 });
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});

test('Map Detail monster and NPC cards use two columns on phones without overflow at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const practiceId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${practiceId}`);
  await page.waitForLoadState('networkidle');
  await waitForMapDetailHydration(page);

  const monsterCards = page.getByTestId('map-monster-card');
  await expect(monsterCards).toHaveCount(4);
  const monsterPositions = await monsterCards.evaluateAll((cards) =>
    cards.map((card) => {
      const bounds = card.getBoundingClientRect();
      return { left: bounds.left, top: bounds.top };
    }),
  );
  expect(monsterPositions[0]!.left).toBeLessThan(monsterPositions[1]!.left);
  expect(
    Math.abs(monsterPositions[0]!.top - monsterPositions[1]!.top),
  ).toBeLessThanOrEqual(1);
  expect(monsterPositions[2]!.top).toBeGreaterThan(monsterPositions[0]!.top);

  const townId = mapPublicId({ sourceId: 'cw-launch:lantern-square' });
  await page.goto(`/maplestory/maps/lantern-square-${townId}`);
  await page.waitForLoadState('networkidle');
  await waitForMapDetailHydration(page);
  const npcCards = page.getByTestId('map-npc-card');
  await expect(npcCards).toHaveCount(8);
  const npcPositions = await npcCards.evaluateAll((cards) =>
    cards.map((card) => {
      const bounds = card.getBoundingClientRect();
      return { left: bounds.left, top: bounds.top };
    }),
  );
  expect(npcPositions[0]!.left).toBeLessThan(npcPositions[1]!.left);
  expect(
    Math.abs(npcPositions[0]!.top - npcPositions[1]!.top),
  ).toBeLessThanOrEqual(1);
  expect(npcPositions[2]!.top).toBeGreaterThan(npcPositions[0]!.top);

  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(`/maplestory/maps/practice-grove-${practiceId}`);
  await page.waitForLoadState('networkidle');
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
  await waitForMapDetailHydration(page);

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

test('connection card minimaps preview and their links open from the card and footer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await waitForMapDetailHydration(page);

  const card = page.getByTestId('map-connection-card').first();
  const minimap = card.locator('[data-map-minimap="true"]');
  await expect(minimap).toBeVisible();
  const previewTrigger = card.getByRole('button', {
    name: 'Enlarge Lantern Square minimap',
  });
  if (await previewTrigger.isVisible()) {
    await previewTrigger.hover();
    await expect(
      page.getByRole('tooltip', {
        name: 'Lantern Square full-size minimap preview',
      }),
    ).toBeVisible();
  }
  const cardLink = card.getByRole('link').first();
  await expect(cardLink).toHaveAttribute(
    'href',
    `/maplestory/maps/lantern-square-${mapPublicId({ sourceId: 'cw-launch:lantern-square' })}`,
  );
  await cardLink.click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lantern Square' }),
  ).toBeVisible();

  await page.goBack();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Practice Grove' }),
  ).toBeVisible();
  const footer = page
    .getByTestId('map-connection-card')
    .first()
    .getByTestId('map-card-footer');
  await expect
    .poll(() =>
      footer.evaluate(
        (element) =>
          element.isConnected && element.getBoundingClientRect().width > 0,
      ),
    )
    .toBe(true);
  const footerCenter = await footer.evaluate((element) => {
    element.scrollIntoView({ block: 'center' });
    const bounds = element.getBoundingClientRect();
    return {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    };
  });
  await page.mouse.click(footerCenter.x, footerCenter.y);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lantern Square' }),
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

test('monster card navigation stays in the header outside its spawn footer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');

  const card = page
    .getByTestId('map-monster-card')
    .filter({ hasText: 'Twin Sprout' });
  const footer = card.locator('[class*="footer"]');
  const spawnButton = card.getByRole('button', {
    name: 'Locate 2 Twin Sprout spawns on map',
  });
  await expect(spawnButton).toBeVisible();
  await footer.scrollIntoViewIfNeeded();
  const blankPoint = await footer.evaluate((element) => {
    const spawnButton = element.querySelector('button');
    if (spawnButton === null) return null;
    const bounds = element.getBoundingClientRect();
    const spawnBounds = spawnButton.getBoundingClientRect();
    const y = bounds.top + bounds.height / 2;
    for (
      let x = Math.ceil(spawnBounds.right + 1);
      x < bounds.right - 1;
      x += 1
    ) {
      const target = document.elementFromPoint(x, y);
      if (
        target !== null &&
        (target === element || target === element.firstElementChild)
      ) {
        return {
          x,
          y,
          insideFooter: element.contains(target),
          insideLink: target.closest('a') !== null,
          insideButton: target.closest('button') !== null,
        };
      }
    }
    return null;
  });
  expect(blankPoint).not.toBeNull();
  if (blankPoint === null) throw new Error('Expected footer whitespace.');
  expect(blankPoint.insideFooter).toBe(true);
  expect(blankPoint.insideLink).toBe(false);
  expect(blankPoint.insideButton).toBe(false);
  await page.mouse.click(blankPoint.x, blankPoint.y);
  await expect(page).toHaveURL(
    `http://127.0.0.1:4173/maplestory/maps/practice-grove-${publicId}`,
  );

  await card.getByRole('link', { name: 'Twin Sprout' }).click();
  await expect(page).toHaveURL(/\/maplestory\/monsters\/twin-sprout-/u);
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

    const pebbleCard = page
      .getByTestId('map-monster-card')
      .filter({ hasText: 'Plain Pebble' });
    await expect(pebbleCard.getByRole('link')).toHaveAttribute(
      'href',
      /\/monsters\/plain-pebble-/u,
    );
    const locateButton = pebbleCard.getByRole('button', {
      name: 'Locate 1 Plain Pebble spawn on map',
    });
    await locateButton.scrollIntoViewIfNeeded();
    expect(
      await locateButton.evaluate((button) => {
        const bounds = button.getBoundingClientRect();
        return button.contains(
          document.elementFromPoint(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2,
          ),
        );
      }),
    ).toBe(true);
    await locateButton.click();

    const dialog = page.getByRole('dialog', { name: 'Practice Grove' });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
    const exploreStage = dialog.getByRole('group', {
      name: 'Practice Grove map',
    });
    await expect(exploreStage.locator('[data-selected="true"]')).toHaveCount(1);

    await page.goBack();

    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
    await expect(
      page
        .getByRole('group', { name: 'Practice Grove map' })
        .locator('[data-selected="true"]'),
    ).toHaveCount(1);
  });
}

test('Escape closes marker details from the marker and popover at desktop width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);

  const marker = page.getByRole('button', {
    name: 'Twin Sprout, Monster, 2 of 2',
  });
  await marker.focus();
  await marker.press('Space');
  const closeButton = page.getByRole('button', { name: 'Close details' });
  await expect(closeButton).toBeVisible();

  await marker.press('Escape');
  await expect(closeButton).toBeHidden();
  await expect(marker).toBeFocused();

  await marker.press('Space');
  await expect(closeButton).toBeVisible();
  await closeButton.focus();
  await closeButton.press('Escape');
  await expect(closeButton).toBeHidden();
  await expect(marker).toBeFocused();
});

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
  await dialog
    .getByRole('group', { name: 'Practice Grove map' })
    .getByRole('button', { name: 'Twin Sprout, Monster, 2 of 2' })
    .first()
    .click();

  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect(
    dialog
      .getByRole('group', { name: 'Practice Grove map' })
      .locator('[data-selected="true"]'),
  ).toHaveCount(2);
  expect(appFetches).toEqual([]);

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
}) => {
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

test('Explore close button and Escape keep the stage view and find text', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await waitForMapDetailHydration(page);
  await page.getByRole('button', { name: 'Explore map' }).click();

  const dialog = page.getByRole('dialog', { name: 'Practice Grove' });
  const stage = dialog.getByRole('group', { name: 'Practice Grove map' });
  await stage.getByRole('button', { name: 'Zoom in' }).click();
  const find = dialog.getByRole('combobox', { name: 'Find on this map' });
  await find.fill('sprout');
  await expect(find).toHaveValue('sprout');
  await expect.poll(() => renderedStageScale(stage)).toBeGreaterThan(1);
  const savedScale = await renderedStageScale(stage);
  const savedView = await renderedStageView(stage);
  if (savedView === null) throw new Error('Expected Explore to save its view.');

  await dialog.getByRole('button', { name: 'Close map' }).click();
  await expect(dialog).toHaveCount(0);
  const inlineStage = page.getByRole('group', { name: 'Practice Grove map' });
  await expect
    .poll(() => renderedStageScale(inlineStage))
    .toBeCloseTo(savedScale);
  await expect(
    page.getByRole('combobox', { name: 'Find on this map' }),
  ).toHaveValue('sprout');
  await expect
    .poll(() => renderedStageView(inlineStage))
    .toMatchObject({
      scale: savedView.scale,
      imageCenterX: savedView.imageCenterX,
      imageCenterY: savedView.imageCenterY,
    });

  await page.getByRole('button', { name: 'Explore map' }).click();
  const reopenedDialog = page.getByRole('dialog', { name: 'Practice Grove' });
  const reopenedFind = reopenedDialog.getByRole('combobox', {
    name: 'Find on this map',
  });
  await expect(reopenedFind).toHaveValue('sprout');
  await page.keyboard.press('Escape');
  await expect(reopenedDialog).toHaveCount(0);
  await expect
    .poll(() => renderedStageScale(inlineStage))
    .toBeCloseTo(savedScale);
  await expect(
    page.getByRole('combobox', { name: 'Find on this map' }),
  ).toHaveValue('sprout');
});

test('Map Detail restores a zoomed and panned stage after reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);

  const stage = page.getByRole('group', { name: 'Practice Grove map' });
  const image = stage.getByRole('img', { name: 'Practice Grove map' });
  const fittedView = await renderedStageView(stage);
  await stage.getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(() => renderedStageScale(stage)).toBeGreaterThan(1);
  const zoomedView = await renderedStageView(stage);

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

  await expect.poll(() => renderedStageView(stage)).not.toEqual(zoomedView);
  const savedView = await renderedStageView(stage);
  expect(savedView).not.toBeNull();

  await page.reload();
  const restoredStage = page.getByRole('group', { name: 'Practice Grove map' });
  await expect.poll(() => renderedStageView(restoredStage)).toEqual(savedView);
  expect(savedView).not.toEqual(fittedView);
});

test('Map Detail restores its stage view after following a connection and going Back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  const stage = page.getByRole('group', { name: 'Practice Grove map' });
  await stage.getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(() => renderedStageScale(stage)).toBeGreaterThan(1);
  const savedView = await renderedStageView(stage);

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
    .poll(() =>
      renderedStageView(
        page.getByRole('group', { name: 'Practice Grove map' }),
      ),
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
  await find.press('Home');
  await find.press('ArrowRight');
  await find.press('X');
  await expect(find).toHaveValue('sXprout');
  await find.fill('sprout');
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
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Explore map' }).click();
  const dialog = page.getByRole('dialog', { name: 'Practice Grove' });
  await expect(dialog).toBeVisible();
  const stage = dialog.getByRole('group', { name: 'Practice Grove map' });
  await stage.getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(() => renderedStageScale(stage)).toBeGreaterThan(1);
  const savedView = await renderedStageView(stage);
  const savedScale = await renderedStageScale(stage);
  if (savedView === null) throw new Error('Expected Explore to save its view.');
  await stage
    .getByRole('button', { name: 'Lantern Square, Connection, 1 of 1' })
    .click();
  await dialog.getByRole('link', { name: 'Lantern Square' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lantern Square' }),
  ).toBeVisible();
  await page.goBack();

  await expect(dialog).toBeVisible();
  await expect.poll(() => renderedStageView(stage)).toEqual(savedView);
  await expect
    .poll(() =>
      renderedStageScale(
        dialog.getByRole('group', { name: 'Practice Grove map' }),
      ),
    )
    .toBeCloseTo(savedScale);
});

test('opening Explore keeps the inline stage view', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  const inlineStage = page.getByRole('group', { name: 'Practice Grove map' });
  await inlineStage.getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(() => renderedStageScale(inlineStage)).toBeGreaterThan(1);
  const inlineView = await renderedStageView(inlineStage);
  if (inlineView === null) throw new Error('Expected inline view to be saved.');
  const inlineScale = await renderedStageScale(inlineStage);

  await page.getByRole('button', { name: 'Explore map' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Practice Grove' }),
  ).toBeVisible();
  const exploreView = await renderedStageView(
    page
      .getByRole('dialog', { name: 'Practice Grove' })
      .getByRole('group', { name: 'Practice Grove map' }),
  );
  expect(exploreView).not.toBeNull();
  expect(exploreView?.scale).toBeCloseTo(inlineScale);
  expect(exploreView?.imageCenterX).toBeCloseTo(inlineView.imageCenterX, 2);
  expect(exploreView?.imageCenterY).toBeCloseTo(inlineView.imageCenterY, 2);
});

test('a copied focused address opens fitted with only its selection restored', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
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
  await copiedPage.setViewportSize({ width: 1440, height: 900 });
  await copiedPage.goto(page.url());
  await waitForMapDetailHydration(copiedPage);
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
  await expect
    .poll(() => renderedStageView(copiedStage))
    .toMatchObject({
      scale: 1,
      imageCenterX: 0.5,
      imageCenterY: 0.5,
      imageFitsStageOnAxis: true,
    });
  await copiedPage.close();
});

test('Explore stage accepts wheel zoom on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
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
      stageBox!.y + stageBox!.height - controlsBox!.y - controlsBox!.height - 8,
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
}) => {
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

test('Map Detail uses a compact desktop rail and places the description below the map legend', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:lantern-square' });
  await page.goto(`/maplestory/maps/lantern-square-${publicId}`);
  await page.waitForLoadState('networkidle');

  const reference = page.getByRole('complementary', { name: 'Map reference' });
  const measurements = await reference.evaluate((rail) => {
    const hero = rail.parentElement;
    const stageColumn = hero?.firstElementChild;
    const railRect = rail.getBoundingClientRect();
    const stageRect = stageColumn?.getBoundingClientRect();
    const columns =
      hero === null
        ? []
        : getComputedStyle(hero)
            .gridTemplateColumns.split(' ')
            .map((column) => Number.parseFloat(column));
    return {
      railWidth: railRect.width,
      railX: railRect.x,
      stageRight: stageRect?.right ?? 0,
      columns,
    };
  });
  expect(measurements.columns).toHaveLength(2);
  expect(measurements.columns[1]).toBeCloseTo(240, 0);
  expect(measurements.railWidth).toBeCloseTo(240, 0);
  expect(measurements.railX).toBeGreaterThan(measurements.stageRight);

  const legend = page.getByRole('region', { name: 'Scrollable map legend' });
  const description = page.getByText(
    'A gathering place beneath paper lanterns.',
  );
  const legendBox = await legend.boundingBox();
  const descriptionBox = await description.boundingBox();
  expect(legendBox).not.toBeNull();
  expect(descriptionBox).not.toBeNull();
  expect(descriptionBox!.y).toBeGreaterThanOrEqual(
    legendBox!.y + legendBox!.height,
  );
});

test('Monsters and Spawns rows share monster marker selection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const publicId = mapPublicId({ sourceId: 'cw-launch:practice-grove' });
  await page.goto(`/maplestory/maps/practice-grove-${publicId}`);
  await page.waitForLoadState('networkidle');
  await waitForMapDetailHydration(page);

  const summary = page.getByRole('region', { name: 'On this map' });
  const monsters = summary.getByRole('button', {
    name: /Highlight Monsters on map/u,
  });
  const spawns = summary.getByRole('button', {
    name: /Highlight monster spawns on map/u,
  });
  const monsterMarkers = page
    .getByRole('group', { name: 'Practice Grove map' })
    .locator('[data-marker-ids*="monster:"]');

  await spawns.click();
  await expect(page).toHaveURL(/focus=monsters/u);
  await expect(monsters).toHaveAttribute('aria-pressed', 'true');
  await expect(spawns).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(async () =>
      monsterMarkers.evaluateAll(
        (markers) =>
          markers.length > 0 &&
          markers.every(
            (marker) => marker.getAttribute('data-selected') === 'true',
          ),
      ),
    )
    .toBe(true);

  await monsters.click();
  await expect(page).not.toHaveURL(/focus=monsters/u);
  await expect(monsters).toHaveAttribute('aria-pressed', 'false');
  await expect(spawns).toHaveAttribute('aria-pressed', 'false');
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
  await expect(
    page.getByRole('tablist', { name: 'Map legend kinds' }),
  ).toHaveCount(0);
  const chip = legend.getByRole('checkbox', { name: 'Twin Sprout, Monster' });
  const label = legend.getByText('Twin Sprout', { exact: true });
  await expect(chip).not.toBeChecked();
  const widthBefore = (await label.boundingBox())?.width;
  await label.click();

  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect(chip).toBeChecked();
  await expect(stage.locator('[data-selected="true"]')).toHaveCount(2);
  // Selection must not resize the chip and shift the legend.
  expect((await label.boundingBox())?.width).toBe(widthBefore);
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
  await page.getByRole('option', { name: 'Twin Sprout, Monster' }).click();

  await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
  await expect(
    page
      .getByRole('group', { name: 'Practice Grove map' })
      .locator('[data-selected="true"]'),
  ).toHaveCount(2);
});

test('Map Detail legend Ctrl-click selects two monsters in legend order and survives reload', async ({
  page,
}) => {
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
  await expect(
    page.getByRole('combobox', { name: 'Find on this map' }),
  ).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Map legend' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Explore map' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('complementary', { name: 'Map reference' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'NPCs on this map' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Monsters on this map' }),
  ).toHaveCount(0);
});
