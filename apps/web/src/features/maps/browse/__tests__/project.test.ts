import type { MapBrowse, MapBrowseRowV1 } from '@mapletip/data/maps';
import { describe, expect, it } from 'vitest';

import { projectMapBrowse } from '../project';

const scope = { family_id: 'classic-world', build_id: 'cw-launch' };
const absent = { state: 'absent', coverageKey: 'fixture' } as const;

function row(
  overrides: Partial<MapBrowseRowV1> & Pick<MapBrowseRowV1, 'key'>,
): MapBrowseRowV1 {
  return {
    publicId: `${overrides.key}id`.slice(0, 8).padEnd(8, '0'),
    slug: overrides.key,
    name: { state: 'unknown' },
    streetName: { state: 'unknown' },
    activity: absent,
    minimap: absent,
    monsterCount: { state: 'unknown' },
    spawnPointCount: { state: 'unknown' },
    npcCount: { state: 'unknown' },
    ...overrides,
  };
}

function browse(
  rows: readonly MapBrowseRowV1[],
  placements: MapBrowse['geography']['placements'] = [],
): MapBrowse {
  return {
    rows: {
      format: 'mapletip.map-browse',
      contractVersion: '1.0',
      scope,
      records: [...rows],
    },
    roster: {
      format: 'mapletip.map-browse-roster',
      contractVersion: '1.0',
      scope,
      monsters: [
        {
          key: 'monster-a',
          name: { state: 'known', value: 'Pebble Crawler' },
          level: { state: 'known', value: 1 },
          sprite: { state: 'known', value: 'a'.repeat(64) },
        },
        {
          key: 'monster-b',
          name: { state: 'unknown' },
          level: { state: 'unsupported' },
          sprite: absent,
        },
      ],
      npcs: [
        {
          key: 'npc-a',
          name: { state: 'known', value: 'Way Keeper' },
          sprite: { state: 'unknown' },
        },
      ],
      records: {
        town: {
          monsters: [
            { monster: 0, spawnPointCount: 4 },
            { monster: 1, spawnPointCount: 1 },
          ],
          npcs: [0],
        },
      },
    },
    geography: {
      format: 'mapletip.map-geography',
      contractVersion: '1.0',
      scope,
      regions: [
        {
          key: 'region:western-isle',
          label: 'Western Isle',
          mapCount: 2,
          areas: [
            {
              key: 'area:western-isle/meadowbrook',
              label: 'Meadowbrook',
              mapCount: 1,
            },
          ],
        },
      ],
      collections: [
        { key: 'collection:event', label: 'Event maps', mapCount: 1 },
      ],
      placements,
    },
  };
}

function placement(mapKey: string, classification: string) {
  return {
    mapKey,
    classification,
    rationale: 'Fixture.',
    reviewId: mapKey,
    reviewedStreetName: '',
    sourceMapId: mapKey,
    status: 'verified' as const,
  };
}

describe('projectMapBrowse', () => {
  it('keeps known facts and omits every other fact state', () => {
    const data = projectMapBrowse(
      browse([
        row({
          key: 'town',
          name: { state: 'known', value: 'Meadowbrook' },
          streetName: { state: 'known', value: 'Western Road' },
          activity: { state: 'known', value: 'Market' },
          minimap: { state: 'known', value: 'b'.repeat(64) },
          monsterCount: { state: 'known', value: 2 },
          spawnPointCount: { state: 'known', value: 5 },
          npcCount: { state: 'known', value: 1 },
          geography: {
            regionKey: 'region:western-isle',
            regionLabel: 'Western Isle',
            areaKey: 'area:western-isle/meadowbrook',
            areaLabel: 'Meadowbrook',
            provenance: 'source-map-mark',
          },
        }),
        row({
          key: 'blank',
          streetName: absent,
          minimap: { state: 'unsupported' },
        }),
      ]),
    );

    expect(data.rows[0]).toEqual({
      publicId: 'townid00',
      slug: 'town',
      name: 'Meadowbrook',
      streetName: 'Western Road',
      regionKey: 'region:western-isle',
      areaKey: 'area:western-isle/meadowbrook',
      activity: 'Market',
      minimapId: 'b'.repeat(64),
      monsterCount: 2,
      spawnPointCount: 5,
      npcCount: 1,
      monsters: [
        [0, 4],
        [1, 1],
      ],
      npcs: [0],
    });
    expect(data.rows[1]).toEqual({
      publicId: 'blankid0',
      slug: 'blank',
      monsters: [],
      npcs: [],
    });
    expect(data.monsters).toEqual([
      {
        key: 'monster-a',
        name: 'Pebble Crawler',
        level: 1,
        spriteId: 'a'.repeat(64),
      },
      { key: 'monster-b' },
    ]);
    expect(data.npcs).toEqual([{ key: 'npc-a', name: 'Way Keeper' }]);
  });

  it('types activities from reviewed placements and ignores review-only kinds', () => {
    const data = projectMapBrowse(
      browse(
        ['pq', 'jq', 'job', 'quest', 'instance', 'plain', 'hidden'].map((key) =>
          row({ key }),
        ),
        [
          placement('pq', 'party-quest'),
          placement('jq', 'jump-quest'),
          placement('job', 'job-advancement-test'),
          placement('quest', 'quest-instance'),
          placement('instance', 'instance'),
          placement('plain', 'ordinary-place'),
          placement('hidden', 'open-world-hidden-map'),
        ],
      ),
    );

    expect(data.rows.map((entry) => entry.activityType)).toEqual([
      'Party quest',
      'Jump quest',
      'Job advancement test',
      'Quest map',
      'Instance',
      undefined,
      undefined,
    ]);
  });

  it('keeps the location lists without placements', () => {
    const { geography } = projectMapBrowse(browse([]));

    expect(geography).toEqual({
      regions: [
        {
          key: 'region:western-isle',
          label: 'Western Isle',
          mapCount: 2,
          areas: [
            {
              key: 'area:western-isle/meadowbrook',
              label: 'Meadowbrook',
              mapCount: 1,
            },
          ],
        },
      ],
      collections: [
        { key: 'collection:event', label: 'Event maps', mapCount: 1 },
      ],
    });
  });
});
