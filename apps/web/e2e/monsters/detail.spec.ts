import type { Request } from '@playwright/test';

import { monsterPublicId, monsterSlug } from '../../src/mocks/release';

import { expect, test } from './fixtures';

const DIAGNOSTIC_LEAK_PATTERN =
  /mismatch|Integrity|HTTP 5\d\d|RequestError|v[12]\/(releases|build-indexes|products|catalogs|browse|monsters)|[a-f0-9]{64}/u;

interface DetailCase {
  readonly buildId: 'cw-launch' | 'gms-v83';
  readonly prefix: string;
  readonly sourceId: string;
  readonly name: string;
  readonly buildLabel: string;
}

const DETAIL_CASES: readonly DetailCase[] = [
  {
    buildId: 'cw-launch',
    prefix: '/maplestory',
    sourceId: 'plain-pebble',
    name: 'Plain Pebble',
    buildLabel: 'Classic World',
  },
  {
    buildId: 'gms-v83',
    prefix: '/maplestory/gms-v83',
    sourceId: 'native-alpha',
    name: 'Native Alpha',
    buildLabel: 'GMS v83',
  },
];

function canonicalPath(item: DetailCase): string {
  const publicId = monsterPublicId(item.sourceId);
  const slug = monsterSlug(item.name, publicId);
  return `${item.prefix}/monsters/${slug}-${publicId}`;
}

test('detail pages server-render metadata, hydrate without whole-build artifacts, and redirect stale slugs', async ({
  page,
  monsterPage,
  request,
  artifactRequests,
}) => {
  for (const item of DETAIL_CASES) {
    const publicId = monsterPublicId(item.sourceId);
    const canonical = canonicalPath(item);
    const stale = `${item.prefix}/monsters/wrong-slug-${publicId}`;

    const response = await request.get(canonical);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(item.name);
    expect(html).toContain(
      `<title>${item.name} – MapleStory ${item.buildLabel} Monster – MapleTip</title>`,
    );
    expect(html).toContain('rel="canonical"');
    expect(html).toContain(canonical);
    expect(html).toContain('BreadcrumbList');

    await monsterPage.goto(canonical);
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeVisible();
    await expect(monsterPage.heading(item.name)).toBeVisible();
    expect(artifactRequests).toEqual([]);

    const redirectResponse = await request.get(stale, { maxRedirects: 0 });
    expect(redirectResponse.status()).toBe(301);
    const location = redirectResponse.headers()['location'];
    expect(location).toBeDefined();
    expect(new URL(location!, 'http://127.0.0.1:4173').pathname).toBe(
      canonical,
    );

    await monsterPage.goto(stale);
    await expect(page).toHaveURL(canonical);
    await expect(monsterPage.heading(item.name)).toBeVisible();
  }
});

for (const item of DETAIL_CASES) {
  test(`Monster Browse links open the same-build ${item.buildLabel} Monster Detail page`, async ({
    page,
    monsterPage,
    artifactRequests,
    expectedArtifactRequests,
  }) => {
    const canonical = canonicalPath(item);
    await monsterPage.goto(`${item.prefix}/monsters`);
    expect(artifactRequests).toEqual([]);
    const nameLink = page
      .getByRole('link', { name: item.name, exact: true })
      .filter({ visible: true });
    await expect(nameLink).toHaveCount(1);
    await expect(nameLink).toHaveAttribute('href', canonical);
    expectedArtifactRequests.push(
      /^\/v1\/releases\/[a-f0-9]{64}\.json$/u,
      /^\/v1\/build-indexes\/[a-f0-9]{64}\.json$/u,
      /^\/v2\/products\/[a-f0-9]{64}\.json$/u,
      /^\/v2\/monsters\/page-packs\/[a-f0-9]{64}\.json$/u,
    );
    const documentNavigations: string[] = [];
    const recordDocumentNavigation = (request: Request) => {
      if (
        request.isNavigationRequest() &&
        request.frame() === page.mainFrame()
      ) {
        documentNavigations.push(request.url());
      }
    };
    page.on('request', recordDocumentNavigation);
    await nameLink.click();
    await expect(page).toHaveURL(`http://127.0.0.1:4173${canonical}`);
    await expect(monsterPage.heading(item.name)).toBeVisible();
    await page.waitForLoadState('networkidle');
    page.off('request', recordDocumentNavigation);
    expect(documentNavigations).toEqual([]);
  });
}

test('detail not-found addresses return 404 with noindex and a browse link', async ({
  page,
  monsterPage,
  request,
}) => {
  const cases = [
    {
      path: '/maplestory/monsters/snail',
      browseLabel: 'Browse Classic World Monsters',
      browsePath: '/maplestory/monsters',
    },
    {
      path: '/maplestory/monsters/snail-00000000',
      browseLabel: 'Browse Classic World Monsters',
      browsePath: '/maplestory/monsters',
    },
    {
      path: '/maplestory/gms-v83/monsters/snail-00000000',
      browseLabel: 'Browse GMS v83 Monsters',
      browsePath: '/maplestory/gms-v83/monsters',
    },
  ];

  for (const entry of cases) {
    const response = await request.get(entry.path);
    expect(response.status()).toBe(404);
    const html = await response.text();
    expect(html).toContain('noindex,follow');

    await monsterPage.goto(entry.path);
    await expect(monsterPage.heading('Monster not found')).toBeVisible();
    const browseLink = page.getByRole('link', { name: entry.browseLabel });
    await expect(browseLink).toBeVisible();
    await expect(browseLink).toHaveAttribute('href', entry.browsePath);
  }
});

test('failed detail origin returns 500 with noindex and zero SDK diagnostics', async ({
  page,
  monsterPage,
  expectedBrowserErrors,
}) => {
  expectedBrowserErrors.console.push(/Failed to load resource.*500/u);
  expectedBrowserErrors.console.push(
    /^Error: Monster details could not be loaded\./u,
  );

  for (const item of DETAIL_CASES) {
    const url = `http://127.0.0.1:4174${canonicalPath(item)}`;
    const response = await page.request.get(url);
    expect(response.status()).toBe(500);
    const html = await response.text();
    expect(html).toContain('Something went wrong');
    expect(html).toContain('noindex,follow');
    expect(html).not.toMatch(DIAGNOSTIC_LEAK_PATTERN);

    await page.goto(url);
    await monsterPage.ready();
    await expect(
      page.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  }
});
