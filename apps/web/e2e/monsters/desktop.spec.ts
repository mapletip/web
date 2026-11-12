import { test, expect } from './fixtures';

function countFromSummaryLabel(label: string): number {
  const count = /\((\d+)\)/u.exec(label)?.[1];
  if (count === undefined)
    throw new Error(`Missing count in bucket label: ${label}`);
  return Number(count);
}

test('server render and hydration expose the verified Monster fixture', async ({
  monsterPage,
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
    await monsterPage.goto();
    await expect(monsterPage.heading()).toHaveText(
      'MapleStory Classic World Monsters',
    );
    await expect(monsterPage.results.dropButtons).toHaveCount(25);
    await expect(monsterPage.results.row(/Plain Pebble/u)).toBeVisible();
    await expect(monsterPage.results.row(/Unnamed monster/u)).toBeVisible();

    const patchy = monsterPage.results.row(/Patchy Records/u);
    await expect(patchy.getByText('-')).toHaveCount(3);
    await expect(patchy.getByText('Unknown', { exact: true })).toHaveCount(2);
    await expect(patchy.getByText('Unavailable')).toBeVisible();

    await expect(
      monsterPage.results.row(/Zero Yield Drone/u).getByText('0', {
        exact: true,
      }),
    ).toHaveCount(3);
    await expect(
      monsterPage.results.row(/Hollow Husk/u).getByText('-', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      monsterPage.results.row(/Slow Burn Titan/u).getByText('<0.01'),
    ).toBeVisible();
    await expect(
      monsterPage.results.row(/Big Number Brute/u).getByText('2,147,483,647'),
    ).toHaveCount(2);

    for (const name of ['Lost Portrait', 'Unrecorded Portrait']) {
      const spriteCell = monsterPage.results
        .row(new RegExp(name, 'u'))
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
    const plainSprite = monsterPage.results
      .row(/Plain Pebble/u)
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
  monsterPage,
}) => {
  await monsterPage.goto();
  const search = monsterPage.results.search;
  const summary = monsterPage.results.summary;

  await test.step('search and sort', async () => {
    await search.fill('twin');
    await expect(summary).toHaveText('2 Monsters');
    await expect(monsterPage.results.row(/Twin Sprout/u)).toHaveCount(2);
    await search.clear();
    await monsterPage.results.sortButton('HP Not sorted').click();
    await expect
      .poll(async () =>
        monsterPage.results.dropButtons.first().getAttribute('aria-label'),
      )
      .toMatch(/^Big Number Brute,/u);
  });

  await test.step('boolean and range facets', async () => {
    await monsterPage.filters.checkbox('Boss', /^Yes \(2\)$/u).click();
    await expect(summary).toHaveText('2 Monsters');
    await expect(monsterPage.results.row(/Mystery Traits/u)).toHaveCount(0);

    await monsterPage.filters.checkbox('Undead', /^Yes \(1\)$/u).click();
    await expect(summary).toHaveText('1 Monster');
    await expect(monsterPage.results.row(/Crowned Revenant/u)).toBeVisible();
    await expect(monsterPage.filters.removeButton('Boss')).toBeVisible();
    await expect(monsterPage.filters.removeButton('Undead')).toBeVisible();
    await monsterPage.filters.clearButton.click();
    await expect(summary).toHaveText('30 Monsters');

    const ratio = monsterPage.filters.facet('EXP / 100 HP');
    const bucket = ratio.getByRole('checkbox').first();
    const snapshot = await bucket.ariaSnapshot();
    const label = /checkbox "([^"]+)"/u.exec(snapshot)?.[1] ?? '';
    expect(label).toMatch(/\d+.*\(\d+\)/u);
    const expectedCount = countFromSummaryLabel(label);
    await bucket.click();
    await expect(summary).toHaveText(
      `${expectedCount} Monster${expectedCount === 1 ? '' : 's'}`,
    );
    await monsterPage.filters.clearButton.click();
    await expect(summary).toHaveText('30 Monsters');
  });

  await test.step('dropped-item facet distinguishes matching item keys', async () => {
    const drops = monsterPage.filters.dropItems;
    await drops.fill('Practice Tonic B');
    await page.getByRole('option', { name: 'Practice Tonic B' }).click();
    await expect(summary).toHaveText('1 Monster');
    await expect(monsterPage.results.row(/Crowned Warden/u)).toBeVisible();
    await monsterPage.filters.clearButton.click();

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
    await monsterPage.results.nextPageButton.click();
    await expect(monsterPage.results.dropButtons).toHaveCount(5);
    await monsterPage.results.pageSize('Classic World').click();
    await page.getByRole('option', { name: '50' }).click();
    await expect(monsterPage.results.dropButtons).toHaveCount(30);
  });
});

test('desktop drop panels group and search entries and close in Escape order', async ({
  page,
  monsterPage,
}) => {
  await monsterPage.goto();
  const monsterTable = monsterPage.results.table;

  const wardenButton = monsterPage.drops.tableButton('Crowned Warden', 24);
  await wardenButton.click();
  const panel = monsterPage.drops.panel('Crowned Warden', 24);
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
    await expect(monsterPage.drops.category(panel, name, 4)).toBeVisible();
  }
  await expect(panel.getByText('Unknown item name')).toBeVisible();
  await expect(panel.getByText('Unresolved item reference')).toBeVisible();

  const itemSearch = monsterPage.drops.itemSearch(panel);
  await itemSearch.fill('Practice Tonic A');
  await expect(panel.getByText('Practice Tonic A')).toBeVisible();
  await expect(panel.getByText('Practice Tonic B')).toHaveCount(0);
  await itemSearch.fill('no matching fixture item');
  await expect(panel.getByText(/No drop entries match/u)).toBeVisible();
  await itemSearch.clear();

  const certainty = monsterPage.drops.certaintyButton(
    panel,
    'unconfirmed',
    'Practice Cap',
  );
  await certainty.focus();
  await certainty.hover();
  const detailDialog = monsterPage.drops.certaintyDialog(
    'Show unconfirmed drop details for Practice Cap',
  );
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

  await monsterPage.drops.tableButton('Twin Sprout', 0).first().click();
  const emptyPanel = monsterPage.drops.panel('Twin Sprout', 0);
  await expect(emptyPanel).toContainText(
    'No drops have been recorded for this monster',
  );
  await monsterPage.drops.closeButton(emptyPanel, 'Twin Sprout').click();
  await expect(monsterPage.drops.tableButton('Plain Pebble', 1)).toBeVisible();
});

test('history navigation loads Monster artifacts in the browser', async ({
  page,
  monsterPage,
  artifactRequests,
  expectedArtifactRequests,
}) => {
  await monsterPage.goto();
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
  await monsterPage.ready();
  await expect(monsterPage.results.row(/Plain Pebble/u)).toBeVisible();
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
  monsterPage,
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
  await monsterPage.ready();
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
  await expect(monsterPage.results.row(/Plain Pebble/u)).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { retryMarker?: string }).retryMarker,
      ),
    )
    .toBe('kept');
});
