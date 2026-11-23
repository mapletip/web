import { describe, expect, it } from 'vitest';

import { mapBrowseCardView, UNNAMED_MAP } from '../MapBrowseCard';
import type { MapBrowseRecord } from '../records';

function record(
  overrides: Partial<MapBrowseRecord> = {},
  { unnamed = false }: { readonly unnamed?: boolean } = {},
): MapBrowseRecord {
  return {
    publicId: 'abcd1234',
    slug: 'meadowbrook-hunting-ground',
    ...(unnamed ? {} : { name: 'Meadowbrook Hunting Field' }),
    locationKeys: ['all'],
    monsters: [],
    npcs: [],
    monster: [],
    npc: [],
    level: [],
    hasMonsters: false,
    hasNpcs: false,
    ...overrides,
  };
}

const view = (overrides: Partial<MapBrowseRecord> = {}) =>
  mapBrowseCardView({ record: record(overrides), buildId: 'cw-launch' });

describe('mapBrowseCardView', () => {
  it('shows region and area, or the collection, and nothing when unplaced', () => {
    expect(
      view({ regionLabel: 'Western Isle', areaLabel: 'Meadowbrook' })
        .secondaryLine,
    ).toBe('Western Isle · Meadowbrook');
    expect(view({ collectionLabel: 'Event maps' }).secondaryLine).toBe(
      'Event maps',
    );
    expect(view().secondaryLine).toBeUndefined();
  });

  it('titles an unnamed map and identifies it by street name', () => {
    const card = mapBrowseCardView({
      record: record(
        { streetName: 'Stonepeak Hall', regionLabel: 'Northreach' },
        { unnamed: true },
      ),
      buildId: 'cw-launch',
    });

    expect(card.name).toBe(UNNAMED_MAP);
    expect(card.secondaryLine).toBe('Stonepeak Hall · Northreach');
  });

  it('shows the activity only when the name does not already say it', () => {
    expect(
      view({
        name: 'First Leg <1st Stage>',
        activity: 'Brickton Relay (First Leg)',
      }).activityLine,
    ).toBe('Brickton Relay (First Leg)');
    expect(
      view({ name: 'The Brickton Relay Market', activity: 'brickton relay' })
        .activityLine,
    ).toBeUndefined();
    expect(view().activityLine).toBeUndefined();
  });

  it('summarizes level range and known non-zero counts', () => {
    const parts = (overrides: Partial<MapBrowseRecord>) =>
      view(overrides).footerParts.map(({ value, label }) =>
        label === '' ? value : `${value} ${label}`,
      );

    expect(
      parts({
        lowestMonsterLevel: 22,
        highestMonsterLevel: 28,
        monsterCount: 3,
        spawnPointCount: 26,
        npcCount: 2,
      }),
    ).toEqual(['Lv. 22–28', '3 monsters', '26 spawn points', '2 NPCs']);
    expect(parts({ lowestMonsterLevel: 15, highestMonsterLevel: 15 })).toEqual([
      'Lv. 15',
    ]);
    expect(parts({ monsterCount: 0, spawnPointCount: 0, npcCount: 1 })).toEqual(
      ['1 NPC'],
    );
    expect(parts({})).toEqual([]);
  });

  it('names the filtered inhabitants with spawn points', () => {
    const card = mapBrowseCardView({
      record: record({
        monsters: [
          { entry: { key: 'm1', name: 'Thorncap' }, spawnPointCount: 12 },
          { entry: { key: 'm2', name: 'Pebble Crawler' }, spawnPointCount: 1 },
        ],
        npcs: [{ entry: { key: 'n1', name: 'Way Keeper' } }],
      }),
      buildId: 'cw-launch',
      highlight: { monsters: new Set(['m1']), npcs: new Set(['n1']) },
    });

    expect(card.highlightLine).toBe('Thorncap (12 spawn points) · Guide');
  });

  it('links to Map Detail in the same build and marks a missing minimap', () => {
    const card = mapBrowseCardView({ record: record(), buildId: 'gms-v83' });

    expect(card.destination).toEqual({
      href: '/maplestory/gms-v83/maps/meadowbrook-hunting-ground-abcd1234',
    });
    expect(card.minimapUnavailableLabel).toBe('Minimap unavailable');
  });
});
