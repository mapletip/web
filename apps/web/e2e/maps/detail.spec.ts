import { mapPublicId, monsterPublicId } from '../../src/mocks/release';
import { expect, test } from '../fixtures';

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
    await expect(page.locator('[data-selected="true"]')).toHaveCount(2);
    expect(escapedDataRequests).toEqual(dataRequestsAfterLoad);

    await marker.click();
    await expect(page).not.toHaveURL(/focus=/u);
    expect(escapedDataRequests).toEqual(dataRequestsAfterLoad);

    await marker.click();
    await expect(page).toHaveURL(/focus=monster-[a-z0-9]{8}/u);
    expect(escapedDataRequests).toEqual(dataRequestsAfterLoad);

    await page.reload();
    await expect(page.locator('[data-selected="true"]')).toHaveCount(2);
    return;
  }

  expect(viewportWidth).toBe(390);
  await expect(stage.locator('button[data-marker-ids]')).toHaveCount(0);
  await expect(stage.locator('[data-marker-ids]').first()).toBeVisible();
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
