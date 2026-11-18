import { describe, expect, it } from 'vitest';

import { projectMapDetail, UNNAMED_MAP_LABEL } from '../project';

import { mapPageRecordFixture } from './mapPageFixture';

type MapPageMonster = ReturnType<
  typeof mapPageRecordFixture
>['monsters']['items'][number];

function monster(
  source: MapPageMonster,
  overrides: Partial<MapPageMonster>,
): MapPageMonster {
  return { ...source, ...overrides };
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

  it('omits known empty Connections from the projected view', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });

    const knownEmpty = projectMapDetail({
      record: { ...record, connections: { state: 'known', items: [] } },
      buildId: 'cw-launch',
    });
    const absent = projectMapDetail({
      record: { ...record, connections: { state: 'absent', items: [] } },
      buildId: 'cw-launch',
    });

    expect(knownEmpty.connections).toBeUndefined();
    expect(absent.connections).toBeUndefined();
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
      params: {
        buildId: 'gms-v83',
        slugId: 'hunting-ground-2-a0000001',
      },
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
    expect(unnamed?.footerParts).toEqual([
      { value: '2', label: 'monsters' },
      { value: '0', label: 'NPCs' },
    ]);
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
      spriteWidth: 80,
      spriteHeight: 96,
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
      slugId: `lantern-square-${returnMap.value.publicId}`,
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
          slugId: `${returnMap.value.slug}-${returnMap.value.publicId}`,
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
