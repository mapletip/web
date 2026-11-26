import { fixtureRelease } from '../../src/mocks/release';

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
      monsterPage.results.row(/Zero Yield Drone/u).getByRole('cell', {
        name: '0',
        exact: true,
      }),
    ).toHaveCount(2);
    await expect(
      monsterPage.drops.tableButton('Zero Yield Drone', 0),
    ).toHaveText('0');
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

  const sourceButton = monsterPage.drops.certaintyButton(panel, 'Practice Cap');
  await sourceButton.focus();
  await sourceButton.hover();
  const detailDialog = monsterPage.drops.certaintyDialog('Practice Cap');
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

test('history navigation reuses cached Monster artifacts', async ({
  page,
  monsterPage,
  artifactRequests,
}) => {
  await monsterPage.goto();
  await page
    .getByRole('banner')
    .getByRole('link', { name: 'MapleTip' })
    .click();
  await expect(page).toHaveURL('/');
  artifactRequests.splice(0);

  await page.goBack();
  await monsterPage.ready();
  await expect(monsterPage.results.row(/Plain Pebble/u)).toBeVisible();
  expect(artifactRequests).toEqual([]);
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

test('desktop Locations open a searchable side drawer and preserve the comparison', async ({
  page,
  monsterPage,
  artifactRequests,
  expectedArtifactRequests,
}) => {
  const files = fixtureRelease.builds.get('cw-launch')!;
  expectedArtifactRequests.push(
    /^\/v1\/(releases|build-indexes)\//u,
    /^\/v2\/products\//u,
    new RegExp(`^/${files.locationBrowse.path.replace('.', '[.]')}$`, 'u'),
  );
  await monsterPage.goto();
  expect(artifactRequests).toEqual([]);
  await expect(
    monsterPage.results.row(/Plain Pebble/u).getByTitle('0 recorded maps'),
  ).toContainText('0');

  const row = monsterPage.results.row(/Crowned Warden/u);
  const trigger = row.getByRole('button', {
    name: /locations for Crowned Warden/u,
  });
  const panel = page.getByRole('dialog', { name: 'Crowned Warden Locations' });
  const close = panel.getByRole('button', {
    name: 'Close details for Crowned Warden',
  });
  const drops = monsterPage.drops.tableButton('Crowned Warden', 24);
  await drops.click();
  await expect(monsterPage.drops.panel('Crowned Warden', 24)).toBeVisible();
  await trigger.scrollIntoViewIfNeeded();
  const triggerPosition = await trigger.boundingBox();
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(close).toBeFocused();
  const drawer = (await panel.boundingBox())!;
  expect(drawer.x).toBeGreaterThan(0);
  expect(drawer.y).toBe(0);
  expect(drawer.y + drawer.height).toBe(page.viewportSize()!.height);
  expect(drawer.x + drawer.width).toBeCloseTo(page.viewportSize()!.width, 0);

  const cards = panel.getByTestId('monster-browse-location-card');
  await expect(cards).toHaveCount(12);
  await expect(cards.first()).toContainText('Practice Map 01');
  await expect(cards.first()).toContainText('12 spawns');
  await expect(cards.nth(1)).toContainText('11 spawns');
  await expect(cards.nth(1).getByRole('img')).toHaveAttribute(
    'loading',
    'lazy',
  );

  // Browsing the list can put a card under the pointer before a map is chosen.
  await cards.first().getByRole('link').hover();
  const intercepted = await cards
    .first()
    .getByRole('link')
    .evaluate((link) => {
      let prevented = true;
      document.addEventListener(
        'click',
        (event) => {
          prevented = event.defaultPrevented;
          event.preventDefault();
        },
        { once: true },
      );
      link.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
        }),
      );
      return prevented;
    });
  expect(intercepted).toBe(false);

  const search = panel.getByRole('textbox', { name: 'Find a map' });
  const sort = panel.getByRole('radiogroup', { name: 'Order locations' });
  await expect(sort.getByRole('radio', { name: 'Spawns' })).toBeChecked();
  await sort.getByText('Map name', { exact: true }).click();
  await expect(sort.getByRole('radio', { name: 'Map name' })).toBeChecked();
  await search.fill('EASTERN');
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toContainText('Practice Map 09');
  await search.fill('xyz');
  await expect(panel.getByRole('status')).toHaveText(
    'No maps match your search',
  );
  await search.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();

  expect(await trigger.boundingBox()).toEqual(triggerPosition);
  await expect(monsterPage.drops.panel('Crowned Warden', 24)).toBeVisible();

  await trigger.click();
  await expect(cards).toHaveCount(12);
  await expect(sort.getByRole('radio', { name: 'Spawns' })).toBeChecked();
  await expect(search).toHaveValue('');
  await cards.last().scrollIntoViewIfNeeded();
  await expect(cards.last()).toBeInViewport();
  await expect(close).toBeInViewport();
  await close.click();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(panel).toBeVisible();
  await page.goBack();
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.goForward();
  await expect(cards).toHaveCount(12);
  await close.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  expect(
    artifactRequests.filter((path) => path.startsWith('/v2/browse/')),
  ).toEqual([`/${files.locationBrowse.path}`]);
});

test('Locations loading and retry leave the roster and Drops usable', async ({
  page,
  monsterPage,
  expectedArtifactRequests,
}) => {
  const locationPath = `/${fixtureRelease.builds.get('cw-launch')!.locationBrowse.path}`;
  expectedArtifactRequests.push(
    /^\/v1\/(releases|build-indexes)\//u,
    /^\/v2\/products\//u,
    new RegExp(`^${locationPath.replace('.', '[.]')}$`, 'u'),
  );
  await monsterPage.goto();
  await page.evaluate((path) => {
    const fetch = window.fetch.bind(window);
    let once = true;
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (once && new URL(url).pathname === path) {
        once = false;
        await new Promise((resolve) => {
          document.documentElement.dataset['locationReadPending'] = 'true';
          window.addEventListener('fail-location-read', resolve, {
            once: true,
          });
        });
        return new Response('Unavailable', { status: 503 });
      }
      return fetch(input, init);
    };
  }, locationPath);

  const trigger = page.getByRole('button', {
    name: /locations for Crowned Warden/u,
  });
  const panel = page.getByRole('dialog', { name: 'Crowned Warden Locations' });
  const drops = monsterPage.drops.tableButton('Crowned Warden', 24);
  await trigger.click();
  await expect(panel.getByRole('status')).toHaveText('Loading locations…');
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await drops.click();
  await expect(monsterPage.drops.panel('Crowned Warden', 24)).toBeVisible();
  await trigger.click();
  await expect(panel.getByRole('status')).toHaveText('Loading locations…');
  await page.evaluate(() =>
    window.dispatchEvent(new Event('fail-location-read')),
  );
  await expect(panel.getByRole('alert')).toHaveText(
    'Locations could not be loaded.',
  );
  await expect(monsterPage.results.search).toBeEnabled();
  await panel.getByRole('button', { name: 'Retry' }).click();
  await expect(panel.getByTestId('monster-browse-location-card')).toHaveCount(
    12,
  );
});
