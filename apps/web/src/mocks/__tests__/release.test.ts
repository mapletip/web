import { MissingRecordError } from '@mapletip/data';
import { getMapPage, type MapPageRecordV1 } from '@mapletip/data/maps';
import { getMonsterPage, hasMonsterPublicIds } from '@mapletip/data/monsters';
import { openRelease } from '@mapletip/data/release';
import { describe, expect, it } from 'vitest';

import { buildRelease, fixtureRelease, mapPublicId } from '../release';
import { fixtureMaps, world } from '../world';

function fileFetch(files: ReadonlyMap<string, Uint8Array>): typeof fetch {
  return (input) => {
    const url = input instanceof Request ? input.url : String(input);
    const path = new URL(url).pathname.slice(1);
    const bytes = files.get(path);
    return Promise.resolve(
      bytes === undefined
        ? new Response(null, { status: 404 })
        : new Response(new Uint8Array(bytes).buffer, {
            headers: { 'content-type': 'application/json' },
          }),
    );
  };
}

describe('fixture release', () => {
  it('opens both builds through the real SDK with all verification enabled', async () => {
    const release = await openRelease({
      baseUrl: 'https://d0.mapletip.com/',
      pin: fixtureRelease.pin,
      fetch: fileFetch(fixtureRelease.files),
    });

    for (const [buildId, expectedCount] of [
      ['cw-launch', 30],
      ['gms-v83', 3],
    ] as const) {
      const product = await release.openBuild(buildId);
      const [catalog, dropBrowse] = await Promise.all([
        product.loadCatalog(),
        product.loadDropBrowse(),
      ]);
      expect(catalog.records).toHaveLength(expectedCount);
      expect(Object.keys(dropBrowse.records)).toHaveLength(expectedCount);
      expect(hasMonsterPublicIds(catalog)).toBe(true);
      if (!hasMonsterPublicIds(catalog)) {
        throw new Error(`Expected catalog v2.5 for ${buildId}.`);
      }

      const first = catalog.records[0];
      if (first === undefined) {
        throw new Error(`Expected at least one monster in ${buildId}.`);
      }
      const [pageFromProduct, pageFromSdk] = await Promise.all([
        product.loadPage(first.publicId),
        getMonsterPage({
          baseUrl: 'https://d0.mapletip.com/',
          pin: fixtureRelease.pin,
          buildId,
          publicId: first.publicId,
          fetch: fileFetch(fixtureRelease.files),
        }),
      ]);
      for (const page of [pageFromProduct, pageFromSdk]) {
        expect(page.publicId).toBe(first.publicId);
        expect(page.slug).toBe(first.slug);
        expect(page.name).toEqual(first.name);
      }

      await expect(product.loadPage('00000000')).rejects.toBeInstanceOf(
        MissingRecordError,
      );
    }
  });

  it('serves validated Map pages for each synthetic fixture case', async () => {
    const pages = new Map<string, MapPageRecordV1>();
    for (const map of fixtureMaps) {
      const publicId = mapPublicId({ sourceId: `cw-launch:${map.id}` });
      const page = await getMapPage({
        baseUrl: 'https://d0.mapletip.com/',
        pin: fixtureRelease.pin,
        buildId: 'cw-launch',
        publicId,
        fetch: fileFetch(fixtureRelease.files),
      });
      expect(page.publicId).toBe(publicId);
      pages.set(map.id, page);
    }
    const knownMapIds = new Set(
      [...pages.values()].map((page) => page.publicId),
    );
    for (const page of pages.values()) {
      expect(
        page.connections.items.every((connection) =>
          knownMapIds.has(connection.publicId),
        ),
      ).toBe(true);
      const returnMap = page.information.returnMap;
      expect(returnMap.state).toBe('known');
      expect(
        returnMap.state === 'known' &&
          knownMapIds.has(returnMap.value.publicId),
      ).toBe(true);
    }
    const gmsPage = await getMapPage({
      baseUrl: 'https://d0.mapletip.com/',
      pin: fixtureRelease.pin,
      buildId: 'gms-v83',
      publicId: mapPublicId({ sourceId: 'gms-v83:practice-grove' }),
      fetch: fileFetch(fixtureRelease.files),
    });
    expect(gmsPage.scope.build_id).toBe('gms-v83');
    expect(gmsPage.name).toEqual({ state: 'known', value: 'Practice Grove' });

    const pageFor = (id: string): MapPageRecordV1 => {
      const page = pages.get(id);
      if (page === undefined)
        throw new Error(`Missing fixture Map page "${id}".`);
      return page;
    };

    const huntingMap = pageFor('practice-grove');
    expect(huntingMap.monsters.items).toHaveLength(4);
    expect(huntingMap.warps.items).toHaveLength(1);
    const occupiedPoints = huntingMap.monsters.items.flatMap((monster) =>
      monster.points.items.map(({ x, y }) => `${x},${y}`),
    );
    expect(new Set(occupiedPoints).size).toBeLessThan(occupiedPoints.length);

    const town = pageFor('lantern-square');
    expect(town.monsters.items).toHaveLength(0);
    expect(town.npcs.items.length).toBeGreaterThanOrEqual(8);
    expect(town.connections.items.length).toBeGreaterThanOrEqual(7);
    expect(
      new Set(town.connections.items.map((connection) => connection.publicId))
        .size,
    ).toBeGreaterThanOrEqual(7);

    expect(pageFor('quiet-gallery').stage.state).toBe('absent');
    const positionless = pageFor('stillwater-stage');
    expect(positionless.stage.state).toBe('known');
    expect(positionless.monsters.items.length).toBeGreaterThan(0);
    expect(
      positionless.monsters.items.every(
        (monster) => monster.points.state === 'unknown',
      ),
    ).toBe(true);

    const unnamed = pageFor('unnamed-stage');
    expect(unnamed.name.state).toBe('unknown');
    expect(unnamed.geography).toBeUndefined();

    await expect(
      getMapPage({
        baseUrl: 'https://d0.mapletip.com/',
        pin: fixtureRelease.pin,
        buildId: 'cw-launch',
        publicId: 'zzzzzzzz',
        fetch: fileFetch(fixtureRelease.files),
      }),
    ).rejects.toBeInstanceOf(MissingRecordError);
  });

  it('rejects a catalog whose bytes no longer match its digest', async () => {
    const catalogPath = fixtureRelease.builds.get('cw-launch')?.catalog.path;
    if (catalogPath === undefined)
      throw new Error('Missing fixture catalog path.');
    const files = new Map(fixtureRelease.files);
    const original = files.get(catalogPath);
    if (original === undefined)
      throw new Error('Missing fixture catalog bytes.');
    const tampered = new Uint8Array(original);
    tampered[0] = (tampered[0] ?? 0) ^ 1;
    files.set(catalogPath, tampered);

    const release = await openRelease({
      baseUrl: 'https://d0.mapletip.com/',
      pin: fixtureRelease.pin,
      fetch: fileFetch(files),
    });
    const product = await release.openBuild('cw-launch');

    await expect(product.loadCatalog()).rejects.toThrow();
  });

  it('builds the same pin deterministically', async () => {
    const secondRelease = await buildRelease(world);
    expect(secondRelease.pin).toEqual(fixtureRelease.pin);
  });
});
