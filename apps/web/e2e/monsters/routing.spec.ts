import { test, expect } from './fixtures';

test('build-specific routes serve their own fixture and reject unsupported slugs', async ({
  monsterPage,
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

  await monsterPage.goto('/maplestory/unknown/monsters');
  await expect(monsterPage.heading('Page not found')).toBeVisible();

  await monsterPage.goto('/maplestory/gms-v83/monsters');
  const alphaDrops = monsterPage.drops.tableButton('Native Alpha', 2);
  await alphaDrops.click();
  const panel = monsterPage.drops.panel('Native Alpha', 2);
  const certainty = monsterPage.drops.certaintyButton(
    panel,
    'confirmed',
    'Native Flake',
  );
  await certainty.focus();
  await certainty.hover();
  const dialog = monsterPage.drops.certaintyDialog(
    'Show confirmed drop details for Native Flake',
  );
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Confirmed')).toBeVisible();
  await expect(dialog.getByText('Source: GMS v83 Monster Book.')).toBeVisible();
});
