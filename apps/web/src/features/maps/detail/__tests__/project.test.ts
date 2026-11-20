import { mapMarkUrl, mapNpcSpriteUrl } from '@mapletip/data/maps';
import { describe, expect, it } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { projectMapDetail, UNNAMED_MAP_LABEL } from '../project';

import { mapPageRecordFixture } from './mapPageFixture';

type MapPageMonster = ReturnType<
  typeof mapPageRecordFixture
>['monsters']['items'][number];
type MapPageNpc = ReturnType<
  typeof mapPageRecordFixture
>['npcs']['items'][number];

function monster(
  source: MapPageMonster,
  overrides: Partial<MapPageMonster>,
): MapPageMonster {
  return { ...source, ...overrides };
}

function npc(
  source: MapPageNpc,
  options: { readonly key: string; readonly name?: string },
): MapPageNpc {
  return {
    ...source,
    key: options.key,
    name:
      options.name === undefined
        ? { state: 'unknown' }
        : { state: 'known', value: options.name },
  };
}

function connection(
  record: ReturnType<typeof mapPageRecordFixture>,
  options: {
    readonly name: string;
    readonly slug: string;
    readonly publicId: string;
    readonly monsterCount?: number;
    readonly npcCount?: number;
    readonly minimap?:
      | { readonly state: 'known'; readonly value: string }
      | { readonly state: 'absent'; readonly coverageKey: string };
  },
): (typeof record.connections.items)[number] {
  const original = record.connections.items[0];
  if (original === undefined) throw new Error('Expected a fixture connection.');
  return {
    ...original,
    key: `fixture:map:${options.slug}`,
    slug: options.slug,
    publicId: options.publicId,
    name: { state: 'known', value: options.name },
    monsterCount: options.monsterCount ?? 0,
    npcCount: options.npcCount ?? 0,
    minimap: options.minimap ?? {
      state: 'absent',
      coverageKey: 'fixture:minimap',
    },
  };
}

describe('projectMapDetail', () => {
  it('resolves the page Map mark only when it is known', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const contentId = 'a'.repeat(64);

    expect(
      projectMapDetail({
        record: { ...record, markImage: { state: 'known', value: contentId } },
        buildId: 'cw-launch',
      }).markUrl,
    ).toBe(mapMarkUrl(MAPLEKIT_RELEASE.baseUrl, contentId));
    expect(
      projectMapDetail({
        record: { ...record, markImage: { state: 'unknown' } },
        buildId: 'cw-launch',
      }).markUrl,
    ).toBeUndefined();
  });

  it('resolves known NPC sprites into cards, entities, and stage markers', () => {
    const source = mapPageRecordFixture({ mapId: 'lantern-square' });
    const npc = source.npcs.items[0];
    if (npc === undefined) throw new Error('Expected a fixture NPC.');
    const contentId = 'b'.repeat(64);
    const record = {
      ...source,
      npcs: {
        ...source.npcs,
        items: [
          { ...npc, sprite: { state: 'known' as const, value: contentId } },
        ],
      },
    };
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    const expectedUrl = mapNpcSpriteUrl(MAPLEKIT_RELEASE.baseUrl, contentId);
    const projectedNpc = view.npcs.npcs[0];

    expect(projectedNpc?.spriteUrl).toBe(expectedUrl);
    expect(view.entities.find(({ kind }) => kind === 'npc')?.spriteUrl).toBe(
      expectedUrl,
    );
    expect(
      view.stage.markers.find(({ kind }) => kind === 'npc')?.spriteUrl,
    ).toBe(expectedUrl);
  });

  it('omits NPC sprites when the sprite fact is unknown', () => {
    const source = mapPageRecordFixture({ mapId: 'lantern-square' });
    const npc = source.npcs.items[0];
    if (npc === undefined) throw new Error('Expected a fixture NPC.');
    const record = {
      ...source,
      npcs: {
        ...source.npcs,
        items: [{ ...npc, sprite: { state: 'unknown' as const } }],
      },
    };
    const view = projectMapDetail({ record, buildId: 'cw-launch' });

    expect(view.npcs.npcs[0]?.spriteUrl).toBeUndefined();
    expect(
      view.entities.find(({ kind }) => kind === 'npc')?.spriteUrl,
    ).toBeUndefined();
    expect(
      view.stage.markers.find(({ kind }) => kind === 'npc')?.spriteUrl,
    ).toBeUndefined();
  });

  it('projects stage markers with stable labels and pairs the ends of each warp', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    const stage = view.stage;
    const firstMonster = record.monsters.items[0];
    const firstWarp = record.warps.items[0];

    expect(stage.image).toMatchObject({
      width: record.stage.state === 'known' ? record.stage.value.width : 0,
      height: record.stage.state === 'known' ? record.stage.value.height : 0,
      alt: 'Practice Grove map',
    });
    expect(stage.positionsUnavailable).toBe(false);
    expect(stage.markers.map(({ label }) => label)).toEqual([
      'Plain Pebble, Monster, 1 of 1',
      'Twin Sprout, Monster, 1 of 2',
      'Twin Sprout, Monster, 2 of 2',
      'Hollow Husk, Monster, 1 of 1',
      'Crowned Warden, Monster, 1 of 1',
      'Lantern Square, Connection, 1 of 1',
      'Warp 1, 1 of 2',
      'Warp 1, 2 of 2',
    ]);
    expect(stage.markers[0]).toMatchObject({
      id: `monster:${firstMonster?.key}:1`,
      kind: 'monster',
      entityKey: firstMonster?.key,
      focusKey: `monster-${firstMonster?.focusToken}`,
      x: 240,
      y: 390,
      spriteUrl: view.monsters.monsters.find(
        ({ key }) => key === firstMonster?.key,
      )?.spriteUrl,
    });
    expect(stage.connectors).toEqual([
      {
        id: `warp:${firstWarp?.focusToken}`,
        from: `warp:${firstWarp?.focusToken}:1`,
        to: `warp:${firstWarp?.focusToken}:2`,
      },
    ]);
    const firstConnection = record.connections.items[0];
    expect(
      stage.markers.find((marker) => marker.kind === 'connection'),
    ).toMatchObject({ focusKey: `connection-${firstConnection?.focusToken}` });
    expect(
      stage.markers.find((marker) => marker.kind === 'warp'),
    ).toMatchObject({ focusKey: `warp-${firstWarp?.focusToken}` });
    expect(
      projectMapDetail({ record, buildId: 'cw-launch' }).stage.markers.map(
        ({ id }) => id,
      ),
    ).toEqual(stage.markers.map(({ id }) => id));
  });

  it('projects entities in kind and name order', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    expect(view.entities.map(({ name }) => name)).toEqual([
      'Lantern Square',
      'Warp 1',
      'Crowned Warden',
      'Hollow Husk',
      'Plain Pebble',
      'Twin Sprout',
    ]);
    expect(
      view.entities
        .filter(({ kind }) => kind === 'monster')
        .map(({ name }) => name),
    ).toEqual(['Crowned Warden', 'Hollow Husk', 'Plain Pebble', 'Twin Sprout']);
    expect(view.entities.find(({ kind }) => kind === 'monster')).toMatchObject({
      kindLabel: 'Monster',
      link: { to: '/maplestory/{-$buildId}/monsters/$slugId' },
    });
  });

  it('includes known and partial positions and skips unresolved position collections', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const firstMonster = record.monsters.items[0];
    const secondMonster = record.monsters.items[1];
    const firstNpc = mapPageRecordFixture({ mapId: 'lantern-square' }).npcs
      .items[0];
    const firstConnection = record.connections.items[0];
    if (
      firstMonster === undefined ||
      secondMonster === undefined ||
      firstNpc === undefined ||
      firstConnection === undefined
    ) {
      throw new Error('Expected stage position fixture entries.');
    }

    const view = projectMapDetail({
      record: {
        ...record,
        monsters: {
          state: 'partial',
          items: [
            {
              ...firstMonster,
              points: {
                state: 'partial',
                items: [
                  { x: 10, y: 20 },
                  { x: 30, y: 40 },
                ],
              },
            },
            {
              ...secondMonster,
              points: { state: 'unknown', items: secondMonster.points.items },
            },
          ],
        },
        npcs: {
          state: 'partial',
          items: [
            {
              ...firstNpc,
              points: { state: 'absent', items: firstNpc.points.items },
            },
          ],
        },
        connections: {
          state: 'partial',
          items: [
            {
              ...firstConnection,
              points: {
                state: 'partial',
                items: firstConnection.points.items,
              },
            },
          ],
        },
        warps: { state: 'partial', items: record.warps.items },
      },
      buildId: 'cw-launch',
    });

    expect(view.stage.markers.map(({ kind, label }) => [kind, label])).toEqual([
      ['monster', 'Plain Pebble, Monster, 1 of 2'],
      ['monster', 'Plain Pebble, Monster, 2 of 2'],
      ['connection', 'Lantern Square, Connection, 1 of 1'],
      ['warp', 'Warp 1, 1 of 2'],
      ['warp', 'Warp 1, 2 of 2'],
    ]);
    expect(view.stage.positionsUnavailable).toBe(false);
  });

  it('projects no image separately from an image with no usable positions', () => {
    const noImage = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'quiet-gallery' }),
      buildId: 'cw-launch',
    });
    const noPositions = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'stillwater-stage' }),
      buildId: 'cw-launch',
    });

    expect(noImage.stage.image).toBeUndefined();
    expect(noImage.stage.positionsUnavailable).toBe(false);
    expect(noPositions.stage.image).toMatchObject({
      alt: 'Stillwater Stage map',
    });
    expect(noPositions.stage.markers).toEqual([]);
    expect(noPositions.stage.positionsUnavailable).toBe(true);
  });

  it('does not call known empty point collections unavailable', () => {
    const record = mapPageRecordFixture({ mapId: 'stillwater-stage' });
    const view = projectMapDetail({
      record: {
        ...record,
        monsters: { state: 'known', items: [] },
        npcs: { state: 'known', items: [] },
        connections: { state: 'known', items: [] },
        warps: { state: 'known', items: [] },
      },
      buildId: 'cw-launch',
    });

    expect(view.stage.markers).toEqual([]);
    expect(view.stage.positionsUnavailable).toBe(false);
  });

  it('considers the warp collection when deciding whether positions are unavailable', () => {
    const record = mapPageRecordFixture({ mapId: 'stillwater-stage' });
    const view = projectMapDetail({
      record: {
        ...record,
        monsters: { state: 'unknown', items: [] },
        npcs: { state: 'unknown', items: [] },
        connections: { state: 'unknown', items: [] },
        warps: { state: 'known', items: [] },
      },
      buildId: 'cw-launch',
    });

    expect(view.stage.positionsUnavailable).toBe(false);
  });

  it('projects NPCs in natural name order and labels unknown names once', () => {
    const record = mapPageRecordFixture({ mapId: 'lantern-square' });
    const template = record.npcs.items[0];
    if (template === undefined) throw new Error('Expected a fixture NPC.');

    const view = projectMapDetail({
      record: {
        ...record,
        npcs: {
          state: 'known',
          items: [
            npc(template, { key: 'npc-10', name: 'Guide 10' }),
            npc(template, { key: 'npc-unknown' }),
            npc(template, { key: 'npc-2', name: 'Guide 2' }),
            npc(template, { key: 'npc-1', name: 'Guide 1' }),
          ],
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.npcs.count).toBe(4);
    expect(view.npcs.npcs.map(({ name }) => name)).toEqual([
      'Guide 1',
      'Guide 2',
      'Guide 10',
      'Unnamed NPC',
    ]);
  });

  it('projects NPC notices and counts for each collection state', () => {
    const record = mapPageRecordFixture({ mapId: 'lantern-square' });
    const template = record.npcs.items[0];
    if (template === undefined) throw new Error('Expected a fixture NPC.');
    const projectNpcs = (npcs: typeof record.npcs) =>
      projectMapDetail({ record: { ...record, npcs }, buildId: 'cw-launch' })
        .npcs;

    expect(projectNpcs({ state: 'unknown', items: [] })).toMatchObject({
      count: 'unknown',
      notice: 'NPC information is unavailable.',
    });
    expect(
      projectNpcs({
        state: 'partial',
        items: [npc(template, { key: 'npc-known', name: 'Guide' })],
      }),
    ).toMatchObject({
      count: 1,
      notice: 'Some NPC information may be missing.',
    });
    expect(projectNpcs({ state: 'known', items: [] })).toMatchObject({
      count: 0,
      notice: 'No NPCs are recorded on this map.',
    });
    expect(projectNpcs({ state: 'absent', items: [] })).toMatchObject({
      count: 0,
      notice: 'No NPCs are recorded on this map.',
    });
  });

  it('projects a named map and default-build canonical path', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });

    expect(view).toMatchObject({
      publicId: record.publicId,
      slug: 'practice-grove',
      name: 'Practice Grove',
      regionLabel: 'Lantern Hills',
      buildId: 'cw-launch',
      canonicalPath: `/maplestory/maps/practice-grove-${record.publicId}`,
    });
    expect(view.subtitle).toBeUndefined();
  });

  it('projects empty Connections while retaining the zero count for the rail', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });

    const knownEmpty = projectMapDetail({
      record: { ...record, connections: { state: 'known', items: [] } },
      buildId: 'cw-launch',
    });
    const absent = projectMapDetail({
      record: { ...record, connections: { state: 'absent', items: [] } },
      buildId: 'cw-launch',
    });

    expect(knownEmpty.connections).toMatchObject({ count: 0, maps: [] });
    expect(absent.connections).toMatchObject({ count: 0, maps: [] });
    expect(knownEmpty.onThisMap[0]).toMatchObject({
      key: 'connections',
      count: 0,
      state: 'known',
      focus: 'connections',
    });
    expect(absent.onThisMap[0]).toMatchObject({
      key: 'connections',
      count: 0,
      state: 'absent',
      focus: 'connections',
    });
  });

  it('projects On this map counts and states from the map sections', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const town = mapPageRecordFixture({ mapId: 'lantern-square' });
    const firstMonster = record.monsters.items[0];
    const firstNpc = town.npcs.items[0];
    const firstConnection = record.connections.items[0];
    if (
      firstMonster === undefined ||
      firstNpc === undefined ||
      firstConnection === undefined
    ) {
      throw new Error('Expected fixture records for each On this map section.');
    }

    const known = projectMapDetail({ record, buildId: 'cw-launch' });
    expect(known.onThisMap.map(({ key }) => key)).toEqual([
      'connections',
      'monsters',
      'spawns',
      'npcs',
    ]);
    expect(known.onThisMap[0]).toMatchObject({
      count: known.connections.count,
      state: known.connections.state,
    });
    expect(known.onThisMap[1]).toMatchObject({
      count: known.monsters.count,
      state: known.monsters.state,
    });
    expect(known.onThisMap[2]).toMatchObject({
      count: known.monsters.totalSpawns,
      state: known.monsters.state,
    });
    expect(known.onThisMap[3]).toMatchObject({
      count: known.npcs.count,
      state: known.npcs.state,
    });

    const partial = projectMapDetail({
      record: {
        ...record,
        connections: { state: 'partial', items: [firstConnection] },
        monsters: { state: 'partial', items: [firstMonster] },
        npcs: { state: 'partial', items: [firstNpc] },
      },
      buildId: 'cw-launch',
    });
    expect(partial.onThisMap).toMatchObject([
      { key: 'connections', count: 1, state: 'partial', focus: 'connections' },
      { key: 'monsters', count: 1, state: 'partial', focus: 'monsters' },
      {
        key: 'spawns',
        count: firstMonster.placementCount,
        state: 'partial',
      },
      { key: 'npcs', count: 1, state: 'partial', focus: 'npcs' },
    ]);

    const unknown = projectMapDetail({
      record: {
        ...record,
        connections: { state: 'unknown', items: [] },
        monsters: { state: 'unknown', items: [] },
        npcs: { state: 'unknown', items: [] },
      },
      buildId: 'cw-launch',
    });
    expect(unknown.onThisMap).toMatchObject([
      { key: 'connections', count: 'unknown', state: 'unknown' },
      { key: 'monsters', count: 'unknown', state: 'unknown' },
      { key: 'npcs', count: 'unknown', state: 'unknown' },
    ]);

    const townView = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'lantern-square' }),
      buildId: 'cw-launch',
    });
    expect(townView.monsters.count).toBe(0);
    expect(townView.onThisMap.map(({ key }) => key)).not.toContain('spawns');
  });

  it('projects sorted connection cards with natural number order and same-build destinations', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({
      record: {
        ...record,
        connections: {
          state: 'known',
          items: [
            connection(record, {
              name: 'Hunting Ground X',
              slug: 'hunting-ground-x',
              publicId: 'a0000004',
            }),
            connection(record, {
              name: 'Hunting Ground 10',
              slug: 'hunting-ground-10',
              publicId: 'a0000003',
            }),
            connection(record, {
              name: 'Hunting Ground II',
              slug: 'hunting-ground-ii',
              publicId: 'a0000002',
            }),
            connection(record, {
              name: 'Hunting Ground 2',
              slug: 'hunting-ground-2',
              publicId: 'a0000001',
            }),
          ],
        },
      },
      buildId: 'gms-v83',
    });

    const connections = view.connections;
    if (connections === undefined)
      throw new Error('Expected projected connections.');

    expect(connections.state).toBe('known');
    expect(connections.count).toBe(4);
    expect(connections.maps.map(({ name }) => name)).toEqual([
      'Hunting Ground 2',
      'Hunting Ground 10',
      'Hunting Ground II',
      'Hunting Ground X',
    ]);
    expect(connections.maps[0]?.destination).toEqual({
      href: '/maplestory/gms-v83/maps/hunting-ground-2-a0000001',
    });
  });

  it('projects count wording, unnamed maps, and absent minimaps for connection cards', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const single = connection(record, {
      name: 'Quiet Gallery',
      slug: 'quiet-gallery',
      publicId: 'a0000001',
      monsterCount: 1,
      npcCount: 1,
      minimap: { state: 'known', value: 'a'.repeat(64) },
    });
    const multiple = {
      ...connection(record, {
        name: 'Brass Walk',
        slug: 'brass-walk',
        publicId: 'a0000002',
        monsterCount: 2,
        npcCount: 0,
      }),
      name: { state: 'unknown' as const },
    };
    const view = projectMapDetail({
      record: {
        ...record,
        connections: { state: 'known', items: [single, multiple] },
      },
      buildId: 'cw-launch',
    });

    const connections = view.connections;
    if (connections === undefined)
      throw new Error('Expected projected connections.');

    const quietGallery = connections.maps.find(
      ({ name }) => name === 'Quiet Gallery',
    );
    expect(quietGallery?.footerParts).toEqual([
      { value: '1', label: 'monster' },
      { value: '1', label: 'NPC' },
    ]);
    expect(quietGallery?.minimapUrl).toContain(
      `/media/images/aa/${'a'.repeat(64)}.png`,
    );

    const unnamed = connections.maps.find(
      ({ name }) => name === UNNAMED_MAP_LABEL,
    );
    expect(unnamed?.footerParts).toEqual([{ value: '2', label: 'monsters' }]);
    expect(unnamed?.minimapUrl).toBeUndefined();
    expect(unnamed?.minimapUnavailableLabel).toBe('Minimap unavailable');
  });

  it('retains partial and unknown connection states', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const item = connection(record, {
      name: 'Quiet Gallery',
      slug: 'quiet-gallery',
      publicId: 'a0000001',
    });

    const partial = projectMapDetail({
      record: { ...record, connections: { state: 'partial', items: [item] } },
      buildId: 'cw-launch',
    });
    expect(partial.connections).toMatchObject({
      state: 'partial',
      count: 1,
      notice: 'Some connection information may be missing.',
      maps: [{ name: 'Quiet Gallery' }],
    });

    const unknown = projectMapDetail({
      record: { ...record, connections: { state: 'unknown', items: [] } },
      buildId: 'cw-launch',
    });
    expect(unknown.connections).toEqual({
      state: 'unknown',
      count: 'unknown',
      notice: 'Connection information is unavailable.',
      maps: [],
    });
  });

  it('orders Monsters by known level, then natural name, with unknown levels last', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const source = record.monsters.items[0];
    if (source === undefined) throw new Error('Expected a fixture monster.');
    const view = projectMapDetail({
      record: {
        ...record,
        monsters: {
          state: 'known',
          items: [
            monster(source, {
              key: 'fixture:monster:ten',
              name: { state: 'known', value: 'Monster 10' },
              level: { state: 'known', value: 2 },
              placementCount: 3,
            }),
            monster(source, {
              key: 'fixture:monster:unknown',
              name: { state: 'known', value: 'Unknown Level' },
              level: { state: 'unknown' },
              placementCount: 4,
            }),
            monster(source, {
              key: 'fixture:monster:one',
              name: { state: 'known', value: 'Monster 2' },
              level: { state: 'known', value: 2 },
              placementCount: 2,
            }),
            monster(source, {
              key: 'fixture:monster:level-one',
              name: { state: 'known', value: 'First' },
              level: { state: 'known', value: 1 },
              placementCount: 1,
            }),
          ],
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.monsters.monsters.map(({ name }) => name)).toEqual([
      'First',
      'Monster 2',
      'Monster 10',
      'Unknown Level',
    ]);
    expect(view.monsters).toMatchObject({
      state: 'known',
      count: 4,
      summary: '4 monster types, 10 total spawns',
    });
  });

  it('uses singular summary labels for one monster type and one spawn', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({
      record: {
        ...record,
        monsters: {
          state: 'known',
          items: [record.monsters.items[0]!],
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.monsters.summary).toBe('1 monster type, 1 total spawn');
  });

  it('projects respawn labels and omits ordinary respawn', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const source = record.monsters.items[0];
    if (source === undefined) throw new Error('Expected a fixture monster.');
    const view = projectMapDetail({
      record: {
        ...record,
        monsters: {
          state: 'known',
          items: [
            monster(source, {
              key: 'fixture:monster:ordinary',
              name: { state: 'known', value: 'Ordinary' },
              respawn: { kind: 'ordinary' },
            }),
            monster(source, {
              key: 'fixture:monster:none',
              name: { state: 'known', value: 'None' },
              respawn: { kind: 'none' },
            }),
            monster(source, {
              key: 'fixture:monster:delayed-minutes',
              name: { state: 'known', value: 'Delayed minutes' },
              respawn: { kind: 'delayed', seconds: 120 },
            }),
            monster(source, {
              key: 'fixture:monster:delayed-seconds',
              name: { state: 'known', value: 'Delayed seconds' },
              respawn: { kind: 'delayed', seconds: 45 },
            }),
            monster(source, {
              key: 'fixture:monster:mixed',
              name: { state: 'known', value: 'Mixed' },
              respawn: { kind: 'mixed' },
            }),
          ],
        },
      },
      buildId: 'cw-launch',
    });

    expect(
      Object.fromEntries(
        view.monsters.monsters.map(({ name, respawnLabel }) => [
          name,
          respawnLabel,
        ]),
      ),
    ).toEqual({
      Ordinary: undefined,
      None: 'No respawn',
      'Delayed minutes': 'Respawns after 2 min',
      'Delayed seconds': 'Respawns after 45 sec',
      Mixed: 'Mixed respawn',
    });
  });

  it('shows Boss only for a known true boss fact and omits unknown sprites', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const source = record.monsters.items[0];
    if (source === undefined) throw new Error('Expected a fixture monster.');
    const spriteId = 'a'.repeat(64);
    const view = projectMapDetail({
      record: {
        ...record,
        monsters: {
          state: 'known',
          items: [
            monster(source, {
              key: 'fixture:monster:boss',
              name: { state: 'known', value: 'Boss' },
              boss: { state: 'known', value: true },
              sprite: {
                contentId: { state: 'known', value: spriteId },
                width: 80,
                height: 96,
              },
            }),
            monster(source, {
              key: 'fixture:monster:not-boss',
              name: { state: 'known', value: 'Not boss' },
              boss: { state: 'known', value: false },
            }),
            monster(source, {
              key: 'fixture:monster:unknown-boss',
              name: { state: 'known', value: 'Unknown boss' },
              boss: { state: 'unknown' },
              sprite: { contentId: { state: 'unknown' } },
            }),
          ],
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.monsters.monsters[0]).toMatchObject({
      name: 'Boss',
      bossLabel: 'Boss',
      levelLabel: 'Lv 1',
    });
    expect(view.monsters.monsters[0]?.spriteUrl).toContain(spriteId);
    expect(view.monsters.monsters[1]?.bossLabel).toBeUndefined();
    expect(view.monsters.monsters[2]).toMatchObject({
      name: 'Unknown boss',
    });
    expect(view.monsters.monsters[2]?.bossLabel).toBeUndefined();
    expect(view.monsters.monsters[2]?.spriteUrl).toBeUndefined();
  });

  it('retains unknown Monster collection state and count', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({
      record: { ...record, monsters: { state: 'unknown', items: [] } },
      buildId: 'cw-launch',
    });

    expect(view.monsters).toEqual({
      state: 'unknown',
      count: 'unknown',
      notice: 'Monster information is unavailable.',
      monsters: [],
      totalSpawns: 0,
    });
  });

  it('projects a known-empty Monster notice without an empty summary', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({
      record: { ...record, monsters: { state: 'known', items: [] } },
      buildId: 'cw-launch',
    });

    expect(view.monsters).toEqual({
      state: 'known',
      count: 0,
      notice: 'No monsters are recorded on this map.',
      monsters: [],
      totalSpawns: 0,
    });
  });

  it('uses the unnamed label and street name when the map name is unknown', () => {
    const record = mapPageRecordFixture({ mapId: 'unnamed-stage' });
    const view = projectMapDetail({
      record: {
        ...record,
        streetName: { state: 'known', value: 'Quiet Road' },
      },
      buildId: 'cw-launch',
    });

    expect(view.name).toBe(UNNAMED_MAP_LABEL);
    expect(view.subtitle).toBe('Quiet Road');
  });

  it('leaves geography labels absent for an unplaced map', () => {
    const record = mapPageRecordFixture({ mapId: 'quiet-gallery' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });

    expect(view.regionLabel).toBeUndefined();
    expect(view.areaLabel).toBeUndefined();
  });

  it('projects region and area labels for a placed map', () => {
    const record = mapPageRecordFixture({ mapId: 'lantern-square' });
    if (record.geography === undefined || record.geography === null) {
      throw new Error('Expected the fixture Map to have geography.');
    }
    const view = projectMapDetail({
      record: {
        ...record,
        geography: {
          ...record.geography,
          areaKey: 'fixture:market',
          areaLabel: 'Lantern Market',
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.regionLabel).toBe('Lantern Hills');
    expect(view.areaLabel).toBe('Lantern Market');
  });

  it('projects known activity and non-blank description without placeholders', () => {
    const record = mapPageRecordFixture({ mapId: 'lantern-square' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });

    expect(view.activity).toBe('Market');
    expect(view.description).toBe('A gathering place beneath paper lanterns.');

    const absent = projectMapDetail({
      record: {
        ...record,
        activity: { state: 'absent', coverageKey: 'activity' },
        description: { state: 'known', value: '  ' },
      },
      buildId: 'cw-launch',
    });
    expect(absent.activity).toBeUndefined();
    expect(absent.description).toBeUndefined();
  });

  it('projects known facts in order and gives map references canonical destinations', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const returnMap = record.information.returnMap;
    if (returnMap.state !== 'known') {
      throw new Error('Expected fixture return map to be known.');
    }
    const view = projectMapDetail({
      record: {
        ...record,
        information: {
          music: { state: 'known', value: 'Floral Life' },
          returnMap,
          forcedReturnMap: { state: 'known', value: returnMap.value },
          timeLimitSeconds: { state: 'known', value: 600 },
          levelLimit: { state: 'known', value: 30 },
          hpDrain: { state: 'known', value: 25 },
          hpDrainProtectionItem: { state: 'known', value: 'Float Ring' },
          swimming: { state: 'known', value: true },
          flying: { state: 'known', value: true },
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.facts.map(({ label }) => label)).toEqual([
      'Music',
      'Return map',
      'Forced return',
      'Time limit',
      'Level limit',
      'HP drain',
      'HP drain protection',
      'Swimming',
      'Flying',
    ]);
    expect(view.facts.map(({ value }) => value)).toEqual([
      'Floral Life',
      'Lantern Square',
      'Lantern Square',
      '10 min',
      'Lv 30',
      '25 HP',
      'Float Ring',
      'Allowed',
      'Allowed',
    ]);
    expect(view.facts[1]?.destination).toEqual({
      to: '/maplestory/{-$buildId}/maps/$slugId',
      params: {
        buildId: undefined,
        slugId: `lantern-square-${returnMap.value.publicId}`,
      },
    });
    expect(view.facts[1]?.explanation).toBe(
      'Ordinary revival and generic Return Scrolls can send you to this map. Some items and activities use another destination.',
    );
  });

  it('keeps a known return map when its name is unknown', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const returnMap = record.information.returnMap;
    if (returnMap.state !== 'known') {
      throw new Error('Expected fixture return map to be known.');
    }
    const markImage = returnMap.value.markImage;
    if (markImage.state !== 'known') {
      throw new Error('Expected fixture return Map mark to be known.');
    }

    const view = projectMapDetail({
      record: {
        ...record,
        information: {
          ...record.information,
          returnMap: {
            ...returnMap,
            value: {
              ...returnMap.value,
              name: { state: 'unknown' },
            },
          },
          forcedReturnMap: { state: 'unknown' },
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.facts).toEqual([
      {
        label: 'Return map',
        value: UNNAMED_MAP_LABEL,
        explanation:
          'Ordinary revival and generic Return Scrolls can send you to this map. Some items and activities use another destination.',
        destination: {
          to: '/maplestory/{-$buildId}/maps/$slugId',
          params: {
            buildId: undefined,
            slugId: `${returnMap.value.slug}-${returnMap.value.publicId}`,
          },
        },
      },
    ]);
  });

  it('omits absent, unknown, blank, and known-false facts', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({
      record: {
        ...record,
        information: {
          music: { state: 'absent', coverageKey: 'music' },
          returnMap: { state: 'unknown' },
          forcedReturnMap: { state: 'unsupported' },
          timeLimitSeconds: { state: 'unknown' },
          levelLimit: { state: 'absent', coverageKey: 'level-limit' },
          hpDrain: { state: 'unknown' },
          hpDrainProtectionItem: { state: 'known', value: '   ' },
          swimming: { state: 'known', value: false },
          flying: { state: 'known', value: false },
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.facts).toEqual([]);
  });

  it.each([
    { seconds: 600, value: '10 min' },
    { seconds: 90, value: '90 sec' },
  ])('formats $seconds seconds as $value', ({ seconds, value }) => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({
      record: {
        ...record,
        information: {
          ...record.information,
          returnMap: { state: 'unknown' },
          timeLimitSeconds: { state: 'known', value: seconds },
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.facts).toEqual([
      {
        label: 'Time limit',
        value,
        explanation:
          'Check the activity rules for when the timer starts and what happens when it runs out.',
      },
    ]);
  });

  it('includes swimming and flying only when each is known true', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({
      record: {
        ...record,
        information: {
          ...record.information,
          returnMap: { state: 'unknown' },
          swimming: { state: 'known', value: true },
          flying: { state: 'known', value: false },
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.facts.map(({ label }) => label)).toEqual(['Swimming']);
  });
});
