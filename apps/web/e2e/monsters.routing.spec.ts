import { test, expect, ready } from './support/test';

test('build-specific routes serve their own fixture and reject unsupported slugs', async ({
  page,
  request,
}) => {
  const gmsResponse = await request.get('/maplestory/gms-v83/monsters');
  expect(gmsResponse.status()).toBe(200);
  const gmsHtml = await gmsResponse.text();
  expect(gmsHtml).toContain(
    '<title>MapleStory GMS v83 Monsters – MapleTip</title>',
  );
  expect(gmsHtml).toContain('3 Monsters');
  expect(gmsHtml).toContain('Native Alpha');

  for (const path of [
    '/maplestory/unknown/monsters',
    '/maplestory/cw-launch/monsters',
  ]) {
    expect((await request.get(path)).status()).toBe(404);
  }

  await page.goto('/maplestory/unknown/monsters');
  await ready(page);
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible();

  await page.goto('/maplestory/gms-v83/monsters');
  await ready(page);
  const alphaDrops = page.getByRole('button', {
    name: 'Native Alpha, 2 drops. Show drops.',
  });
  await alphaDrops.click();
  const panel = page.getByRole('region', { name: 'Native Alpha Drops (2)' });
  const certainty = panel.getByRole('button', {
    name: 'Show confirmed drop details for Native Flake',
  });
  await certainty.focus();
  await certainty.hover();
  const dialog = page.getByRole('dialog', {
    name: 'Show confirmed drop details for Native Flake',
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Confirmed')).toBeVisible();
  await expect(dialog.getByText('Source: GMS v83 Monster Book.')).toBeVisible();
});
