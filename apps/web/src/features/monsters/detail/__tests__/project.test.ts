import { itemIconUrl } from '@mapletip/data/items';
import type {
  MonsterPageRecordV1,
  MonsterPageRecordV1_2,
} from '@mapletip/data/monsters';
import { describe, expect, it } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { UNNAMED_MONSTER_LABEL } from '../../shared';
import { projectMonsterDetail } from '../project';

import { monsterPageFixture } from './monsterPageFixture';

type MonsterPageDrop = MonsterPageRecordV1['drops']['entries'][number];
type MonsterPageLocation = MonsterPageRecordV1['locations']['entries'][number];
type MonsterPageLocationWithPoints =
  MonsterPageRecordV1_2['locations']['entries'][number];
type MonsterPageQuest = MonsterPageRecordV1['quests']['entries'][number];

function pageDrop(
  name: MonsterPageDrop['name'],
  category: MonsterPageDrop['category'],
  overrides: Partial<MonsterPageDrop> = {},
): MonsterPageDrop {
  return {
    itemRef: { state: 'resolved', key: 'fixture:item:record' },
    name,
    category,
    icon: { state: 'unknown' },
    assertion: { kind: 'native' },
    ...overrides,
  };
}

function pageLocation(
  mapKey: string,
  name: MonsterPageLocation['name'],
  placementCount: number,
  overrides: Partial<MonsterPageLocation> = {},
): MonsterPageLocation {
  return {
    mapKey,
    name,
    placementCount,
    minimap: { state: 'absent', coverageKey: 'fixture:minimap' },
    ...overrides,
  };
}

function pageQuest(
  overrides: Partial<MonsterPageQuest> = {},
): MonsterPageQuest {
  return {
    questKey: 'fixture:quest:001',
    name: { state: 'known', value: 'Practice Hunt' },
    minLevel: { state: 'known', value: 10 },
    jobCodes: { state: 'known', items: [100] },
    repeatable: { state: 'known', value: false },
    killCount: { state: 'known', value: 30 },
    ...overrides,
  };
}

function addressableMonsterPageFixture(): MonsterPageRecordV1_2 {
  return {
    ...monsterPageFixture(),
    contractVersion: '1.2',
    scope: { build_id: 'gms-v83', family_id: 'gms' },
    locations: {
      summary: { state: 'known', mapCount: 1, placementCount: 3 },
      entries: [
        {
          mapKey: 'fixture:map:addressed',
          mapSourceId: 'gms-v83:fixture:map:addressed',
          mapName: { state: 'known', value: 'Addressed Meadow' },
          publicId: '22kodknn',
          slug: 'addressed-meadow',
          placementCount: 3,
          stage: {
            state: 'absent',
            coverageKey: 'fixture:map:addressed:stage',
          },
          points: { state: 'absent', packedPairs: [] },
        },
      ],
    },
  } as unknown as MonsterPageRecordV1_2;
}

function locationWithPoints({
  mapKey,
  placementCount,
  packedPairs,
  pointsState,
  stageKnown = true,
}: {
  readonly mapKey: string;
  readonly placementCount: number;
  readonly packedPairs: number[];
  readonly pointsState: 'known' | 'partial' | 'absent';
  readonly stageKnown?: boolean;
}): MonsterPageLocationWithPoints {
  return {
    mapKey,
    mapSourceId: mapKey,
    mapName: { state: 'known', value: 'Practice Meadow' },
    publicId: '22kodknn',
    slug: 'practice-meadow',
    placementCount,
    stage: stageKnown
      ? {
          state: 'known',
          value: {
            contentId: 'a'.repeat(64),
            width: 900,
            height: 600,
          },
        }
      : { state: 'absent', coverageKey: `${mapKey}:stage` },
    points: { state: pointsState, packedPairs },
  };
}

function monsterPageWithPointLocations(
  entries: readonly MonsterPageLocationWithPoints[],
): MonsterPageRecordV1_2 {
  const fixture = addressableMonsterPageFixture();
  return {
    ...fixture,
    locations: {
      summary: {
        state: 'known',
        mapCount: entries.length,
        placementCount: entries.reduce(
          (total, entry) => total + entry.placementCount,
          0,
        ),
      },
      entries: [...entries],
    },
  };
}

/** The location count's sprite: its address and alt text come from the fixture. */
const ANY_SPRITE: unknown = {
  url: expect.any(String) as unknown,
  alt: expect.any(String) as unknown,
};

describe('projectMonsterDetail', () => {
  it('projects identity fields and unprefixed canonical path for default build', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        publicId: '36z2h01p',
        slug: 'sentinel-snail',
        name: { state: 'known', value: 'Sentinel Snail' },
      }),
      'cw-launch',
    );

    expect(view).toMatchObject({
      publicId: '36z2h01p',
      slug: 'sentinel-snail',
      name: 'Sentinel Snail',
      buildId: 'cw-launch',
      canonicalPath: '/maplestory/monsters/sentinel-snail-36z2h01p',
      spriteUrl: `https://d0.mapletip.com/media/images/aa/${'a'.repeat(64)}.png`,
      spriteWidth: 32,
      spriteHeight: 48,
    });
    expect(view.stats.map(({ label }) => label)).toEqual([
      'Level',
      'HP',
      'MP',
      'EXP',
      'Weapon attack',
      'Magic attack',
      'Weapon defense',
      'Magic defense',
      'Accuracy',
      'Avoidability',
      'Knockback',
      'Speed',
    ]);
  });

  it('projects prefixed canonical path for alternate builds', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        publicId: 'jp565851',
        slug: 'pianus',
        name: { state: 'known', value: 'Pianus' },
        scope: { build_id: 'gms-v83', family_id: 'gms' },
      }),
      'gms-v83',
    );

    expect(view.buildId).toBe('gms-v83');
    expect(view.canonicalPath).toBe(
      '/maplestory/gms-v83/monsters/pianus-jp565851',
    );
  });

  it('links location cards with page addresses and leaves older entries unlinked', () => {
    const linked = projectMonsterDetail(
      addressableMonsterPageFixture(),
      'gms-v83',
    );
    const linkedMaps = linked.locations;
    if (linkedMaps.state !== 'present') {
      throw new Error('Expected the addressable location to be present.');
    }
    expect(linkedMaps.maps[0]).toMatchObject({
      name: 'Addressed Meadow',
      destination: {
        href: '/maplestory/gms-v83/maps/addressed-meadow-22kodknn',
      },
    });

    const legacy = projectMonsterDetail(
      monsterPageFixture({
        locations: {
          summary: { state: 'known', mapCount: 1, placementCount: 2 },
          entries: [
            pageLocation(
              'fixture:map:legacy',
              { state: 'known', value: 'Legacy Meadow' },
              2,
            ),
          ],
        },
      }),
      'cw-launch',
    );
    const legacyMaps = legacy.locations;
    if (legacyMaps.state !== 'present') {
      throw new Error('Expected the legacy location to be present.');
    }
    expect(legacyMaps.maps[0]).not.toHaveProperty('destination');
  });

  it('falls back to UNNAMED_MONSTER_LABEL when name is non-known', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        name: { state: 'absent', coverageKey: 'monster:name' },
      }),
      'cw-launch',
    );

    expect(view.name).toBe(UNNAMED_MONSTER_LABEL);
  });

  it('projects known, non-known, negative, and large stat values in order', () => {
    const fixture = monsterPageFixture();
    const view = projectMonsterDetail(
      monsterPageFixture({
        stats: {
          ...fixture.stats,
          level: { state: 'known', value: 5 },
          hp: { state: 'known', value: 23_000_000 },
          mp: { state: 'unknown' },
          exp: { state: 'absent', coverageKey: 'fixture:exp' },
          paDamage: { state: 'unsupported' },
          maDamage: { state: 'known', value: -65 },
          pdDamage: { state: 'known', value: 2_147_483_647 },
        },
      }),
      'cw-launch',
    );

    expect(view.stats.map(({ value }) => value)).toEqual([
      '5',
      '23,000,000',
      'Unknown',
      '-',
      'Unavailable',
      '-65',
      '2,147,483,647',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
    ]);
    expect(view.stats.map(({ known }) => known)).toEqual([
      true,
      true,
      false,
      false,
      false,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('projects only known element responses and known true traits', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        boss: { state: 'known', value: true },
        undead: { state: 'unknown' },
        elements: {
          state: 'partial',
          items: [
            {
              code: 'S',
              effect: 2,
              meaning: { state: 'known', value: 'Poison' },
              multiplier: { state: 'known', value: 0 },
              resistance: { state: 'known', value: 'Immune' },
            },
            {
              code: 'H',
              effect: 1,
              meaning: { state: 'known', value: 'Holy' },
              multiplier: { state: 'known', value: 1.5 },
              resistance: { state: 'known', value: 'Weak' },
            },
            {
              code: 'F',
              effect: 0,
              meaning: { state: 'known', value: 'Fire' },
              multiplier: { state: 'unknown' },
              resistance: { state: 'unknown' },
            },
          ],
        },
      }),
      'cw-launch',
    );

    expect(view.boss).toBe(true);
    expect(view.undead).toBeUndefined();
    expect(view.elements).toEqual([
      { code: 'S', element: 'Poison', response: 'Immune' },
      { code: 'H', element: 'Holy', response: 'Weak' },
    ]);
  });

  it('groups every drop in contract order and counts rendered entries', () => {
    const entries = [
      pageDrop(
        { state: 'known', value: 'Second Charm' },
        { kind: 'item-class', value: 'etc' },
      ),
      pageDrop(
        { state: 'known', value: 'Practice Cap' },
        { kind: 'equip-slot', code: 'cap' },
      ),
      pageDrop(
        { state: 'known', value: 'Practice Tonic' },
        { kind: 'item-class', value: 'consume' },
      ),
      pageDrop(
        { state: 'known', value: 'First Charm' },
        { kind: 'item-class', value: 'etc' },
      ),
      pageDrop(
        { state: 'known', value: 'Paper Kite' },
        { kind: 'item-class', value: 'setup' },
      ),
      pageDrop(
        { state: 'known', value: 'Pixel Pin' },
        { kind: 'item-class', value: 'cash' },
      ),
      pageDrop(
        { state: 'known', value: 'Toy Mite' },
        { kind: 'item-class', value: 'pet' },
      ),
      pageDrop(
        { state: 'known', value: 'Unknown Type Token' },
        { kind: 'unknown' },
      ),
    ];
    const view = projectMonsterDetail(
      monsterPageFixture({
        drops: { entries, summary: { native: { state: 'unknown' } } },
      }),
      'cw-launch',
    );

    expect(view.drops).toMatchObject({
      state: 'present',
      count: 8,
      groups: [
        { id: 'equipment', label: 'Equipment', count: 1 },
        { id: 'usable', label: 'Usable', count: 1 },
        { id: 'etc', label: 'ETC', count: 2 },
        { id: 'setup', label: 'Setup', count: 1 },
        { id: 'cash', label: 'Cash', count: 1 },
        { id: 'pets', label: 'Pets', count: 1 },
        { id: 'unknown', label: 'Unknown type', count: 1 },
      ],
    });
    if (view.drops.state !== 'present') {
      throw new Error('Expected projected drops.');
    }
    expect(view.drops.groups[2]?.entries.map(({ name }) => name)).toEqual([
      'Second Charm',
      'First Charm',
    ]);
    expect(view.drops.groups[6]?.entries[0]?.name).toBe('Unknown Type Token');
  });

  it('retains unresolved item rows, honest fallback names, icons and source builds', () => {
    const iconId = 'b'.repeat(64);
    const view = projectMonsterDetail(
      monsterPageFixture({
        drops: {
          entries: [
            pageDrop(
              { state: 'unknown' },
              { kind: 'unknown' },
              {
                itemRef: { state: 'unresolved' },
                icon: { state: 'known', value: iconId },
                assertion: {
                  kind: 'historical-overlay',
                  confidence: 'maybe',
                  sourceBuild: 'gms-v83',
                },
              },
            ),
          ],
          summary: { native: { state: 'unsupported' } },
        },
      }),
      'cw-launch',
    );

    expect(view.drops).toMatchObject({
      state: 'present',
      count: 1,
      groups: [
        {
          id: 'unknown',
          entries: [
            {
              name: 'Item name unavailable',
              iconUrl: itemIconUrl(MAPLEKIT_RELEASE.baseUrl, iconId),
              assertionKind: 'historical-overlay',
              sourceBuild: 'gms-v83',
            },
          ],
        },
      ],
    });
  });

  it('distinguishes no recorded drops from unavailable collection evidence', () => {
    const absent = projectMonsterDetail(
      monsterPageFixture({
        drops: {
          entries: [],
          summary: {
            native: { state: 'absent' },
            historical: { state: 'absent' },
          },
        },
      }),
      'cw-launch',
    );
    const noObservedRows = projectMonsterDetail(
      monsterPageFixture({
        drops: {
          entries: [],
          summary: {
            native: { state: 'known', count: 0, lowerBound: true },
            historical: { state: 'absent' },
          },
        },
      }),
      'cw-launch',
    );
    const unknown = projectMonsterDetail(monsterPageFixture(), 'cw-launch');
    const unsupported = projectMonsterDetail(
      monsterPageFixture({
        drops: {
          entries: [],
          summary: { native: { state: 'unsupported' } },
        },
      }),
      'cw-launch',
    );

    expect(absent.drops).toEqual({ state: 'no-recorded', count: 0 });
    expect(noObservedRows.drops).toEqual({ state: 'no-recorded', count: 0 });
    expect(unknown.drops).toEqual({
      state: 'unavailable',
      count: 'unknown',
    });
    expect(unsupported.drops).toEqual({
      state: 'unavailable',
      count: 'unknown',
    });
  });

  it('orders locations by placement count then name, preserves duplicate map keys, and projects streets and minimaps', () => {
    const minimapId = 'c'.repeat(64);
    const view = projectMonsterDetail(
      monsterPageFixture({
        locations: {
          summary: { state: 'known', mapCount: 4, placementCount: 40 },
          entries: [
            pageLocation('fixture:map:unnamed', { state: 'unknown' }, 10, {
              streetName: 'Harbor Road',
              geography: {
                regionKey: 'fixture:south',
                regionLabel: 'South Practice Region',
                provenance: 'reviewed-overlay',
                status: 'verified',
              },
            }),
            pageLocation(
              'fixture:map:duplicate-b',
              { state: 'known', value: 'Twin Glade' },
              5,
              {
                geography: {
                  regionKey: 'fixture:south',
                  regionLabel: 'South Practice Region',
                  provenance: 'reviewed-overlay',
                  status: 'verified',
                },
              },
            ),
            pageLocation(
              'fixture:map:top',
              { state: 'known', value: 'High Meadow' },
              20,
              {
                streetName: 'West Path',
                geography: {
                  regionKey: 'fixture:north',
                  regionLabel: 'North Practice Region',
                  provenance: 'reviewed-overlay',
                  status: 'verified',
                },
                minimap: { state: 'known', value: minimapId },
              },
            ),
            pageLocation(
              'fixture:map:duplicate-a',
              { state: 'known', value: 'Twin Glade' },
              5,
              {
                geography: {
                  regionKey: 'fixture:south',
                  regionLabel: 'South Practice Region',
                  provenance: 'reviewed-overlay',
                  status: 'verified',
                },
              },
            ),
          ],
        },
      }),
      'cw-launch',
    );

    expect(view.locations).toEqual({
      state: 'present',
      count: 4,
      maps: [
        {
          key: 'fixture:map:top',
          name: 'High Meadow',
          secondaryLine: 'West Path',
          minimapUrl: `https://d0.mapletip.com/media/images/cc/${minimapId}.png`,
          minimapSprite: {
            url: `https://d0.mapletip.com/media/images/aa/${'a'.repeat(64)}.png`,
            width: 32,
            height: 48,
          },
          footerParts: [
            {
              value: '20×',
              label: '',
              sprite: ANY_SPRITE,
            },
          ],
          placementCount: 20,
        },
        {
          key: 'fixture:map:unnamed',
          name: 'Map name unavailable',
          secondaryLine: 'Harbor Road',
          minimapSprite: {
            url: `https://d0.mapletip.com/media/images/aa/${'a'.repeat(64)}.png`,
            width: 32,
            height: 48,
          },
          footerParts: [
            {
              value: '10×',
              label: '',
              sprite: ANY_SPRITE,
            },
          ],
          placementCount: 10,
        },
        {
          key: 'fixture:map:duplicate-a',
          name: 'Twin Glade',
          minimapSprite: {
            url: `https://d0.mapletip.com/media/images/aa/${'a'.repeat(64)}.png`,
            width: 32,
            height: 48,
          },
          footerParts: [
            {
              value: '5×',
              label: '',
              sprite: ANY_SPRITE,
            },
          ],
          placementCount: 5,
        },
        {
          key: 'fixture:map:duplicate-b',
          name: 'Twin Glade',
          minimapSprite: {
            url: `https://d0.mapletip.com/media/images/aa/${'a'.repeat(64)}.png`,
            width: 32,
            height: 48,
          },
          footerParts: [
            {
              value: '5×',
              label: '',
              sprite: ANY_SPRITE,
            },
          ],
          placementCount: 5,
        },
      ],
    });
  });

  it('projects known location stage size and spawn points in source order', () => {
    const view = projectMonsterDetail(
      monsterPageWithPointLocations([
        locationWithPoints({
          mapKey: 'fixture:map:known',
          placementCount: 3,
          pointsState: 'known',
          packedPairs: [122, 125, 130, 125, 144, 180],
        }),
      ]),
      'cw-launch',
    );

    expect(view.locations).toMatchObject({
      state: 'present',
      maps: [
        {
          minimapSprite: {
            url: `https://d0.mapletip.com/media/images/aa/${'a'.repeat(64)}.png`,
            width: 32,
            height: 48,
          },
          minimapStage: {
            width: 900,
            height: 600,
            spawnPoints: [
              { x: 122, y: 125 },
              { x: 130, y: 125 },
              { x: 144, y: 180 },
            ],
          },
        },
      ],
    });
    const locations = view.locations;
    if (locations.state !== 'present') throw new Error('Expected locations.');
    expect(locations.maps[0]).not.toHaveProperty('packedPairs');
  });

  it('projects location sprites from the dimensioned mock page shape', () => {
    const record = monsterPageWithPointLocations([
      locationWithPoints({
        mapKey: 'fixture:map:mock-sprite-shape',
        placementCount: 1,
        pointsState: 'known',
        packedPairs: [100, 100],
      }),
    ]);
    const mockPageRecord = {
      ...record,
      sprite: {
        contentId: { state: 'known' as const, value: 'a'.repeat(64) },
        width: 40,
        height: 40,
      },
    };

    const view = projectMonsterDetail(mockPageRecord, 'cw-launch');

    expect(view.locations).toMatchObject({
      state: 'present',
      maps: [
        {
          minimapSprite: {
            url: `https://d0.mapletip.com/media/images/aa/${'a'.repeat(64)}.png`,
            width: 40,
            height: 40,
          },
        },
      ],
    });
  });

  it('omits location sprites unless the URL and both dimensions are known', () => {
    const record = monsterPageWithPointLocations([
      locationWithPoints({
        mapKey: 'fixture:map:sprite-availability',
        placementCount: 1,
        pointsState: 'known',
        packedPairs: [100, 100],
      }),
    ]);
    const incompleteSprites: readonly MonsterPageRecordV1_2['sprite'][] = [
      { ...record.sprite, contentId: { state: 'unknown' } },
      { ...record.sprite, width: 0 },
      { ...record.sprite, height: 0 },
    ];

    for (const sprite of incompleteSprites) {
      const view = projectMonsterDetail({ ...record, sprite }, 'cw-launch');
      if (view.locations.state !== 'present') {
        throw new Error('Expected locations.');
      }
      expect(view.locations.maps[0]).not.toHaveProperty('minimapSprite');
    }
  });

  it('keeps partial points while preserving the complete spawn count', () => {
    const view = projectMonsterDetail(
      monsterPageWithPointLocations([
        locationWithPoints({
          mapKey: 'fixture:map:partial',
          placementCount: 17,
          pointsState: 'partial',
          packedPairs: Array.from({ length: 16 }, (_, index) => [
            index * 10,
            index * 5,
          ]).flat(),
        }),
      ]),
      'cw-launch',
    );

    expect(view.locations).toMatchObject({
      state: 'present',
      maps: [
        {
          placementCount: 17,
          footerParts: [
            {
              value: '17×',
              label: '',
              sprite: ANY_SPRITE,
            },
          ],
        },
      ],
    });
    const locations = view.locations;
    if (locations.state !== 'present') throw new Error('Expected locations.');
    expect(locations.maps[0]?.minimapStage?.spawnPoints).toHaveLength(16);
  });

  it('projects absent points as an empty list and omits the stage when no image exists', () => {
    const view = projectMonsterDetail(
      monsterPageWithPointLocations([
        locationWithPoints({
          mapKey: 'fixture:map:empty',
          placementCount: 2,
          pointsState: 'absent',
          packedPairs: [],
        }),
        locationWithPoints({
          mapKey: 'fixture:map:no-stage',
          placementCount: 1,
          pointsState: 'absent',
          packedPairs: [],
          stageKnown: false,
        }),
      ]),
      'cw-launch',
    );

    const locations = view.locations;
    if (locations.state !== 'present') throw new Error('Expected locations.');
    expect(locations.maps[0]?.minimapStage).toEqual({
      width: 900,
      height: 600,
      spawnPoints: [],
    });
    expect(locations.maps[0]?.placementCount).toBe(2);
    expect(locations.maps[1]).not.toHaveProperty('minimapStage');
    expect(locations.maps[1]).not.toHaveProperty('minimapUrl');
  });

  it('excludes region labels from the location tagline and uses singular spawn wording', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        locations: {
          summary: { state: 'known', mapCount: 1, placementCount: 1 },
          entries: [
            pageLocation(
              'fixture:map:quiet',
              { state: 'known', value: 'Quiet Clearing' },
              1,
              {
                streetName: 'Forest Edge',
                geography: {
                  regionKey: 'fixture:forest',
                  regionLabel: 'Practice Forest',
                  provenance: 'source-region-allowlist',
                },
              },
            ),
          ],
        },
      }),
      'cw-launch',
    );

    expect(view.locations).toMatchObject({
      state: 'present',
      count: 1,
      maps: [
        {
          name: 'Quiet Clearing',
          secondaryLine: 'Forest Edge',
          footerParts: [
            {
              value: '1×',
              label: '',
              sprite: ANY_SPRITE,
            },
          ],
          placementCount: 1,
        },
      ],
    });
  });

  it('projects absent and unresolved location collection states separately', () => {
    const absent = projectMonsterDetail(
      monsterPageFixture({
        locations: { summary: { state: 'absent' }, entries: [] },
      }),
      'cw-launch',
    );
    const unresolved = projectMonsterDetail(
      monsterPageFixture({
        locations: {
          summary: { state: 'unresolved', mapCount: 2, placementCount: 7 },
          entries: [],
        },
      }),
      'cw-launch',
    );

    expect(absent.locations).toEqual({ state: 'no-locations', count: 0 });
    expect(unresolved.locations).toEqual({
      state: 'unavailable',
      count: 'unknown',
    });
  });

  it('projects known quest facts and subtracts this monster from a shared group', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        quests: {
          state: 'known',
          entries: [
            pageQuest({
              jobCodes: { state: 'known', items: [100, 110] },
              countGroupSize: { state: 'known', value: 3 },
              repeatable: { state: 'known', value: true },
            }),
          ],
        },
      }),
      'cw-launch',
    );

    expect(view.quests).toEqual({
      state: 'present',
      count: 1,
      entries: [
        {
          key: 'fixture:quest:001',
          name: 'Practice Hunt',
          minimumLevelLabel: 'Lv. 10+',
          jobSummary: 'Warrior +1',
          defeatLabel: 'Defeat ×30',
          repeatable: true,
          sharedCountNote: 'Shared with 2 other monsters',
        },
      ],
    });
  });

  it('formats complete and incomplete job summaries without inventing eligibility', () => {
    const complete = projectMonsterDetail(
      monsterPageFixture({
        quests: {
          state: 'known',
          entries: [
            pageQuest({
              jobCodes: { state: 'absent', coverageKey: 'all-jobs' },
            }),
          ],
        },
      }),
      'cw-launch',
    );
    const partial = projectMonsterDetail(
      monsterPageFixture({
        quests: {
          state: 'known',
          entries: [
            pageQuest({ jobCodes: { state: 'partial', items: [100] } }),
          ],
        },
      }),
      'cw-launch',
    );

    expect(complete.quests).toMatchObject({
      state: 'present',
      entries: [{ jobSummary: 'Any job' }],
    });
    expect(partial.quests).toMatchObject({
      state: 'present',
      entries: [{ jobSummary: 'Warrior +?' }],
    });
  });

  it('keeps quest absence and unresolved information distinct and does not invent facts', () => {
    const absent = projectMonsterDetail(
      monsterPageFixture({
        quests: { state: 'absent', entries: [] },
      }),
      'cw-launch',
    );
    const unresolved = projectMonsterDetail(
      monsterPageFixture({ quests: { state: 'unknown', entries: [] } }),
      'cw-launch',
    );
    const unknownCount = projectMonsterDetail(
      monsterPageFixture({
        quests: {
          state: 'known',
          entries: [
            pageQuest({
              name: { state: 'unknown' },
              minLevel: { state: 'absent', coverageKey: 'fixture:min-level' },
              jobCodes: { state: 'unknown' },
              repeatable: { state: 'unknown' },
              killCount: { state: 'unknown' },
            }),
          ],
        },
      }),
      'cw-launch',
    );

    expect(absent.quests).toEqual({ state: 'no-quests', count: 0 });
    expect(unresolved.quests).toEqual({
      state: 'unavailable',
      count: 'unknown',
    });
    expect(unknownCount.quests).toMatchObject({
      state: 'present',
      entries: [
        {
          name: 'Quest name unavailable',
          defeatLabel: 'Defeat',
          repeatable: false,
        },
      ],
    });
    if (unknownCount.quests.state !== 'present') {
      throw new Error('Expected the known quest entry to be projected.');
    }
    expect(unknownCount.quests.entries[0]?.sharedCountNote).toBeUndefined();
  });

  it('projects summoned items with placeholder values and omits an empty list', () => {
    const absent = projectMonsterDetail(
      monsterPageFixture({ summonedByItems: [] }),
      'cw-launch',
    );
    const present = projectMonsterDetail(
      monsterPageFixture({
        summonedByItems: [
          {
            itemRef: { state: 'resolved', key: 'fixture:item:seed' },
            name: { state: 'known', value: 'Practice Seed' },
            icon: { state: 'known', value: 'b'.repeat(64) },
          },
          {
            itemRef: { state: 'unresolved' },
            name: { state: 'unknown' },
            icon: { state: 'unknown' },
          },
        ],
      }),
      'cw-launch',
    );

    expect(absent.summonedBy).toEqual({ state: 'absent', count: 0 });
    expect(present.summonedBy).toEqual({
      state: 'present',
      count: 2,
      entries: [
        {
          key: 'fixture:item:seed',
          name: 'Practice Seed',
          iconUrl: `https://d0.mapletip.com/media/images/bb/${'b'.repeat(64)}.png`,
        },
        { key: 'summoned-item-1', name: 'Item name unavailable' },
      ],
    });
  });
});
