import { test, expect, ready } from './support/test';

const MONSTER_TABLE = 'Classic World monsters comparison';

function table(page: Parameters<typeof ready>[0]) {
  return page.getByRole('table', { name: MONSTER_TABLE });
}

function dropButtons(page: Parameters<typeof ready>[0]) {
  return table(page).getByRole('button', { name: /Show drops\.$/u });
}

function countFromSummaryLabel(label: string): number {
  const count = /\((\d+)\)/u.exec(label)?.[1];
  if (count === undefined)
    throw new Error(`Missing count in bucket label: ${label}`);
  return Number(count);
}

test('server render and hydration expose the verified Monster fixture', async ({
  page,
  request,
  artifactRequests,
}) => {
  await test.step('the direct response is server rendered', async () => {
    const response = await request.get('/maplestory/monsters');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(
      '<title>MapleStory Classic World Monsters – MapleTip</title>',
    );
    expect(html).toContain(
      'Browse Classic World monsters in MapleStory. Compare levels, HP, EXP, attack, defense, and other stats.',
    );
    expect(html).toContain('30 Monsters');
    expect(html).toContain('Plain Pebble');
  });

  await test.step('the browser hydrates without reloading artifacts', async () => {
    await page.goto('/maplestory/monsters');
    await ready(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'MapleStory Classic World Monsters',
    );
    await expect(dropButtons(page)).toHaveCount(25);
    await expect(
      table(page).getByRole('row', { name: /Plain Pebble/u }),
    ).toBeVisible();
    await expect(
      table(page).getByRole('row', { name: /Unnamed monster/u }),
    ).toBeVisible();

    const patchy = table(page).getByRole('row', { name: /Patchy Records/u });
    await expect(patchy.getByText('-')).toHaveCount(3);
    await expect(patchy.getByText('Unknown', { exact: true })).toHaveCount(2);
    await expect(patchy.getByText('Unavailable')).toBeVisible();

    await expect(
      table(page)
        .getByRole('row', { name: /Zero Yield Drone/u })
        .getByText('0', {
          exact: true,
        }),
    ).toHaveCount(3);
    await expect(
      table(page)
        .getByRole('row', { name: /Hollow Husk/u })
        .getByText('-', {
          exact: true,
        }),
    ).toBeVisible();
    await expect(
      table(page)
        .getByRole('row', { name: /Slow Burn Titan/u })
        .getByText('<0.01'),
    ).toBeVisible();
    await expect(
      table(page)
        .getByRole('row', { name: /Big Number Brute/u })
        .getByText('2,147,483,647'),
    ).toHaveCount(2);

    for (const name of ['Lost Portrait', 'Unrecorded Portrait']) {
      const spriteCell = table(page)
        .getByRole('row', { name: new RegExp(name, 'u') })
        .getByRole('cell')
        .first();
      const sprite = spriteCell.locator('img');
      await sprite.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          sprite.evaluate((image) => (image as HTMLImageElement).naturalWidth),
        )
        .toBe(1);
      const fallbackBox = await sprite.boundingBox();
      expect(fallbackBox?.width).toBe(40);
      expect(fallbackBox?.height).toBe(40);
    }
    const plainSprite = table(page)
      .getByRole('row', { name: /Plain Pebble/u })
      .getByRole('cell')
      .first()
      .locator('img');
    await expect
      .poll(() =>
        plainSprite.evaluate(
          (image) => (image as HTMLImageElement).naturalWidth,
        ),
      )
      .toBe(40);
    expect(artifactRequests).toEqual([]);
  });
});

test('browse journey searches, filters, sorts and pages the fixture rows', async ({
  page,
}) => {
  await page.goto('/maplestory/monsters');
  await ready(page);
  const search = page.getByRole('textbox', {
    name: 'Search Classic World monsters',
  });
  const summary = page.getByText(/^\d+ Monsters?$/u).first();

  await test.step('search and sort', async () => {
    await search.fill('twin');
    await expect(summary).toHaveText('2 Monsters');
    await expect(
      table(page).getByRole('row', { name: /Twin Sprout/u }),
    ).toHaveCount(2);
    await search.clear();
    await page
      .getByRole('button', { name: 'HP Not sorted', exact: true })
      .click();
    await expect
      .poll(async () => dropButtons(page).first().getAttribute('aria-label'))
      .toMatch(/^Big Number Brute,/u);
  });

  await test.step('boolean and range facets', async () => {
    const boss = page.getByRole('group', { name: 'Boss' });
    await boss.getByRole('checkbox', { name: /^Yes \(2\)$/u }).click();
    await expect(summary).toHaveText('2 Monsters');
    await expect(
      table(page).getByRole('row', { name: /Mystery Traits/u }),
    ).toHaveCount(0);

    const undead = page.getByRole('group', { name: 'Undead' });
    await undead.getByRole('checkbox', { name: /^Yes \(1\)$/u }).click();
    await expect(summary).toHaveText('1 Monster');
    await expect(
      table(page).getByRole('row', { name: /Crowned Revenant/u }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Remove Boss/u }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Remove Undead/u }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(summary).toHaveText('30 Monsters');

    const ratio = page.getByRole('group', { name: 'EXP / 100 HP' });
    const bucket = ratio.getByRole('checkbox').first();
    const snapshot = await bucket.ariaSnapshot();
    const label = /checkbox "([^"]+)"/u.exec(snapshot)?.[1] ?? '';
    expect(label).toMatch(/\d+.*\(\d+\)/u);
    const expectedCount = countFromSummaryLabel(label);
    await bucket.click();
    await expect(summary).toHaveText(
      `${expectedCount} Monster${expectedCount === 1 ? '' : 's'}`,
    );
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(summary).toHaveText('30 Monsters');
  });

  await test.step('dropped-item facet distinguishes matching item keys', async () => {
    const drops = page.getByRole('combobox', { name: 'Drops' });
    await drops.fill('Practice Tonic B');
    await page.getByRole('option', { name: 'Practice Tonic B' }).click();
    await expect(summary).toHaveText('1 Monster');
    await expect(
      table(page).getByRole('row', { name: /Crowned Warden/u }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();

    await drops.fill('Sample Charm');
    const duplicateOptions = page.getByRole('option', {
      name: /Sample Charm/u,
    });
    await expect(duplicateOptions).toHaveCount(2);
    const names = await duplicateOptions.allTextContents();
    expect(names[0]).not.toBe(names[1]);
    expect(names.every((name) => name.includes('item-'))).toBe(true);
  });

  await test.step('page and page-size controls update visible rows', async () => {
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(dropButtons(page)).toHaveCount(5);
    await page
      .getByRole('combobox', { name: 'Classic World monsters per page' })
      .click();
    await page.getByRole('option', { name: '50' }).click();
    await expect(dropButtons(page)).toHaveCount(30);
  });
});

test('desktop drop panels group and search entries and close in Escape order', async ({
  page,
}) => {
  await page.goto('/maplestory/monsters');
  await ready(page);
  const monsterTable = table(page);

  const wardenButton = monsterTable.getByRole('button', {
    name: 'Crowned Warden, 24 drops. Show drops.',
  });
  await wardenButton.click();
  const panel = page.getByRole('region', { name: 'Crowned Warden Drops (24)' });
  await expect(panel).toBeVisible();
  const tableBox = await monsterTable.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(tableBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  expect(panelBox!.width).toBeLessThanOrEqual(tableBox!.width + 1);

  const categoryHeadings = [
    'Equipment',
    'Use',
    'ETC',
    'Set-up',
    'Cash Items',
    'Pets',
    'Other',
  ];
  for (const name of categoryHeadings) {
    await expect(panel.getByRole('heading', { name, level: 4 })).toBeVisible();
  }
  await expect(panel.getByText('Unknown item name')).toBeVisible();
  await expect(panel.getByText('Unresolved item reference')).toBeVisible();

  const itemSearch = panel.getByRole('textbox', { name: 'Search items' });
  await itemSearch.fill('Practice Tonic A');
  await expect(panel.getByText('Practice Tonic A')).toBeVisible();
  await expect(panel.getByText('Practice Tonic B')).toHaveCount(0);
  await itemSearch.fill('no matching fixture item');
  await expect(panel.getByText(/No drop entries match/u)).toBeVisible();
  await itemSearch.clear();

  const certainty = panel.getByRole('button', {
    name: 'Show unconfirmed drop details for Practice Cap',
  });
  await certainty.focus();
  await certainty.hover();
  const detailDialog = page.getByRole('dialog', {
    name: 'Show unconfirmed drop details for Practice Cap',
  });
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog.getByText('Maybe')).toBeVisible();
  await expect(
    detailDialog.getByText('Source: GMS v83 Monster Book.'),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(detailDialog).toHaveCount(0);
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);

  await monsterTable
    .getByRole('button', { name: 'Twin Sprout, 0. Show drops.' })
    .first()
    .click();
  await expect(
    page.getByRole('region', { name: 'Twin Sprout Drops (0)' }),
  ).toContainText('No drops have been recorded for this monster');
  await page
    .getByRole('button', { name: 'Close Drops for Twin Sprout' })
    .click();
  await expect(
    monsterTable.getByRole('button', {
      name: 'Plain Pebble, 1 drop. Show drops.',
    }),
  ).toBeVisible();
});

test('history navigation loads Monster artifacts in the browser', async ({
  page,
  artifactRequests,
  expectedArtifactRequests,
}) => {
  await page.goto('/maplestory/monsters');
  await ready(page);
  await page
    .getByRole('banner')
    .getByRole('link', { name: 'MapleTip' })
    .click();
  await expect(page).toHaveURL('/');
  artifactRequests.splice(0);
  expectedArtifactRequests.push(
    /^\/v1\/releases\//u,
    /^\/v1\/build-indexes\//u,
    /^\/v2\/products\//u,
    /^\/v2\/catalogs\//u,
    /^\/v2\/browse\//u,
  );
  await page.goBack();
  await ready(page);
  await expect(
    table(page).getByRole('row', { name: /Plain Pebble/u }),
  ).toBeVisible();
  await expect.poll(() => artifactRequests.length).toBe(5);
  expect(
    artifactRequests
      .map((path) => path.split('/').filter(Boolean).slice(0, 2).join('/'))
      .sort(),
  ).toEqual(
    [
      'v1/releases',
      'v1/build-indexes',
      'v2/products',
      'v2/catalogs',
      'v2/browse',
    ].sort(),
  );
});

test('failed server loads hide diagnostics and retry in the browser', async ({
  page,
  expectedBrowserErrors,
  expectedArtifactRequests,
}) => {
  expectedBrowserErrors.console.push(/Failed to load resource.*500/u);
  expectedBrowserErrors.console.push(
    /^Error: Monster data could not be loaded\./u,
  );
  const urls = [
    'http://127.0.0.1:4174/maplestory/monsters',
    'http://127.0.0.1:4174/maplestory/gms-v83/monsters',
  ];
  for (const url of urls) {
    const response = await page.request.get(url);
    expect(response.status()).toBe(500);
    const body = await response.text();
    expect(body).toContain('Something went wrong');
    expect(body).not.toMatch(
      /mismatch|Integrity|HTTP 5\d\d|RequestError|v[12]\/(releases|build-indexes|products|catalogs|browse)|[a-f0-9]{64}/u,
    );
  }

  await page.goto(urls[0]!);
  await ready(page);
  await expect(
    page.getByRole('heading', { name: 'Something went wrong' }),
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.evaluate(() => {
    (window as Window & { retryMarker?: string }).retryMarker = 'kept';
  });
  expectedArtifactRequests.push(
    /^\/v1\/releases\//u,
    /^\/v1\/build-indexes\//u,
    /^\/v2\/products\//u,
    /^\/v2\/catalogs\//u,
    /^\/v2\/browse\//u,
  );
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(
    table(page).getByRole('row', { name: /Plain Pebble/u }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { retryMarker?: string }).retryMarker,
      ),
    )
    .toBe('kept');
});
