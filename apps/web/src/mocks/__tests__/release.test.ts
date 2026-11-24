import { MissingRecordError } from '@mapletip/data';
import {
  getMapBrowse,
  getMapPage,
  type StaticMapPageRecord,
} from '@mapletip/data/maps';
import {
  getMonsterLocationBrowse,
  getMonsterPage,
  hasMonsterPublicIds,
} from '@mapletip/data/monsters';
import { openRelease } from '@mapletip/data/release';
import { describe, expect, it } from 'vitest';

import { fileFetch } from '../fileFetch';
import {
  buildRelease,
  fixtureRelease,
  mapPublicId,
  monsterPublicId,
} from '../release';
import { fixtureMaps, world } from '../world';

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
    const pages = new Map<string, StaticMapPageRecord>();
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

    const pageFor = (id: string): StaticMapPageRecord => {
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
    if (town.contractVersion !== '1.1') {
      throw new Error('Expected Map page revision 1.1 for Lantern Square.');
    }
    expect(town.monsters.items).toHaveLength(0);
    expect(town.npcs.items.length).toBeGreaterThanOrEqual(8);
    expect(town.connections.items.length).toBeGreaterThanOrEqual(7);
    expect(
      new Set(town.connections.items.map((connection) => connection.publicId))
        .size,
    ).toBeGreaterThanOrEqual(7);
    const lanternMaker = town.npcs.items.find(
      (npc) => npc.name.state === 'known' && npc.name.value === 'Lantern Maker',
    );
    const storyteller = town.npcs.items.find(
      (npc) => npc.name.state === 'known' && npc.name.value === 'Storyteller',
    );
    expect(lanternMaker?.questCount).toEqual({ state: 'known', count: 1 });
    expect(storyteller?.questCount).toEqual({ state: 'partial', count: 1 });

    expect(
      pageFor('synthetic-monster-yard').monsters.items.length,
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

  it('serves Map Browse rows, roster and geography through the real SDK', async () => {
    const browse = await getMapBrowse({
      baseUrl: 'https://d0.mapletip.com/',
      pin: fixtureRelease.pin,
      buildId: 'cw-launch',
      fetch: fileFetch(fixtureRelease.files),
    });

    const names = browse.rows.records.flatMap((row) =>
      row.name.state === 'known' ? [row.name.value] : [],
    );
    expect(names).toEqual(
      expect.arrayContaining(fixtureMaps.flatMap(({ name }) => name ?? [])),
    );
    const lanternHills = browse.geography.regions.find(
      ({ key }) => key === 'region:lantern-hills',
    );
    expect(lanternHills?.mapCount).toBe(6);
    expect(lanternHills?.areas).toEqual([
      { key: 'area:lantern-hills/lamplight', label: 'Lamplight', mapCount: 3 },
    ]);
    expect(browse.geography.collections).toEqual([
      { key: 'collection:event', label: 'Event maps', mapCount: 1 },
    ]);

    const byName = (name: string) =>
      browse.rows.records.find(
        (row) => row.name.state === 'known' && row.name.value === name,
      );
    const rehearsal = byName('Lantern Rehearsal <Stage 1>');
    expect(rehearsal?.activity).toEqual({
      state: 'known',
      value: 'Lantern Relay',
    });
    expect(
      browse.geography.placements.find(
        (placement) => placement.mapKey === rehearsal?.key,
      )?.classification,
    ).toBe('party-quest');

    const unplaced = byName('Brass Walk');
    expect(unplaced?.geography).toEqual({ provenance: 'none' });
    expect(browse.roster.records[unplaced?.key ?? '']?.npcs).toHaveLength(1);

    const unnamed = browse.rows.records.find(
      (row) =>
        row.streetName.state === 'known' &&
        row.streetName.value === 'Lamplight Hall',
    );
    expect(unnamed?.name.state).toBe('unknown');
    expect(byName('Quiet Gallery')?.minimap.state).toBe('absent');

    const meadow = byName('Lamplight Meadow');
    const meadowRoster = browse.roster.records[meadow?.key ?? ''];
    expect(meadow?.spawnPointCount).toEqual({ state: 'known', value: 3 });
    expect(
      meadowRoster?.monsters.map(({ monster, spawnPointCount }) => [
        browse.roster.monsters[monster]?.name,
        spawnPointCount,
      ]),
    ).toEqual([
      [{ state: 'known', value: 'Twin Sprout' }, 2],
      [
        {
          state: 'known',
          value:
            'Extraordinarily Long Named Fixture Creature Of The Far Northern Reaches',
        },
        1,
      ],
    ]);
  });

  it('serves matching Monster location and Map page identities from v1.3 fixtures', async () => {
    const options = {
      baseUrl: 'https://d0.mapletip.com/',
      pin: fixtureRelease.pin,
      buildId: 'cw-launch',
      fetch: fileFetch(fixtureRelease.files),
    } as const;
    const [page, eventMonster, locations] = await Promise.all([
      getMonsterPage({
        ...options,
        publicId: monsterPublicId('crowned-warden'),
      }),
      getMonsterPage({
        ...options,
        publicId: monsterPublicId('crowned-revenant'),
      }),
      getMonsterLocationBrowse(options),
    ]);
    if (
      page.contractVersion !== '1.2' ||
      eventMonster.contractVersion !== '1.2' ||
      locations.contractVersion !== '1.3'
    ) {
      throw new Error(
        'Expected the current Monster page and location revisions.',
      );
    }
    expect(page.contractVersion).toBe('1.2');
    expect(locations.contractVersion).toBe('1.3');
    expect(page.sprite).toMatchObject({
      contentId: { state: 'known' },
      width: 40,
      height: 40,
    });

    const hunt = page.quests.entries.find(
      (quest) => quest.questKey === 'fixture:quest:warden-hunt',
    );
    expect(hunt?.startNpc).toEqual({
      state: 'known',
      value: {
        name: { state: 'known', value: 'Lantern Maker' },
        sprite: { state: 'unknown' },
      },
    });
    expect(hunt?.event).toEqual({ state: 'known', value: false });
    const eventQuest = eventMonster.quests.entries.find(
      (quest) => quest.questKey === 'fixture:quest:lantern-festival',
    );
    expect(eventQuest?.startNpc).toEqual({
      state: 'absent',
      coverageKey: 'fixture:quest-start-npc',
    });
    expect(eventQuest?.event).toEqual({ state: 'known', value: true });

    const location = locations.records[page.key]?.entries[0];
    if (location === undefined) {
      throw new Error('Missing Crowned Warden fixture location.');
    }
    const mapPage = await getMapPage({
      ...options,
      publicId: location.publicId,
    });
    expect(mapPage.key).toBe(location.mapKey);
    expect(mapPage.publicId).toBe(location.publicId);
    expect(mapPage.slug).toBe(location.slug);
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
