import { expect, test } from '@playwright/test';

import { mapPublicId } from '../../src/mocks/release';

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
