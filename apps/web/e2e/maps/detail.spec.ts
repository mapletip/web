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

test('Map Detail shows its static stage and markers on desktop and mobile', async ({
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
