import { describe, expect, it } from 'vitest';

import { ALL_MAPS_LOCATION, type MapLocationNode } from '../location';
import {
  mapBrowseCardView,
  PLAIN_CARD_CONTEXT,
  UNNAMED_MAP,
  type MapBrowseCardContext,
} from '../MapBrowseCard';
import type { MapBrowseRecord } from '../records';

const location = ALL_MAPS_LOCATION;
const place = (kind: MapLocationNode['kind']): MapLocationNode => ({
  id: kind,
  kind,
  label: kind,
  params: {},
});

function record(
  overrides: Partial<MapBrowseRecord> = {},
  { unnamed = false }: { readonly unnamed?: boolean } = {},
): MapBrowseRecord {
  return {
    publicId: 'abcd1234',
    slug: 'meadowbrook-hunting-field',
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

const view = (
  overrides: Partial<MapBrowseRecord> = {},
  at: MapLocationNode = location,
  context: MapBrowseCardContext = PLAIN_CARD_CONTEXT,
) =>
  mapBrowseCardView({
    record: record(overrides),
    buildId: 'cw-launch',
    location: at,
    context,
  });
const footer = (
  overrides: Partial<MapBrowseRecord>,
  context: Partial<MapBrowseCardContext>,
) =>
  view(overrides, location, {
    ...PLAIN_CARD_CONTEXT,
    ...context,
  }).footerParts.map((part) =>
    'entity' in part
      ? [
          part.entity.count === undefined ? '' : `${part.entity.count}×`,
          part.entity.iconUrl === undefined ? '' : '[sprite]',
          part.entity.name,
        ]
          .filter((text) => text !== '')
          .join(' ')
      : `${part.value} ${part.label}`,
  );

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

  it('leaves out the location the page heading already names', () => {
    const placed = {
      regionLabel: 'Western Isle',
      areaLabel: 'Meadowbrook',
      collectionLabel: 'Event maps',
    };

    expect(view(placed, place('region')).secondaryLine).toBe(
      'Meadowbrook · Event maps',
    );
    expect(view(placed, place('area')).secondaryLine).toBe('Event maps');
    expect(view(placed, place('collection')).secondaryLine).toBe(
      'Western Isle · Meadowbrook',
    );
  });

  it('titles an unnamed map and identifies it by street name', () => {
    const card = mapBrowseCardView({
      record: record(
        { streetName: 'Stonepeak Hall', regionLabel: 'Northreach' },
        { unnamed: true },
      ),
      buildId: 'cw-launch',
      location,
      context: PLAIN_CARD_CONTEXT,
    });

    expect(card.name).toBe(UNNAMED_MAP);
    expect(card.secondaryLine).toBe('Stonepeak Hall · Northreach');
  });

  it('adds the activity to the location line only when the name does not say it', () => {
    expect(
      view({
        name: 'First Leg <1st Stage>',
        areaLabel: 'Brickton',
        activity: 'Brickton Relay (First Leg)',
      }).secondaryLine,
    ).toBe('Brickton · Brickton Relay (First Leg)');
    expect(
      view({ name: 'The Brickton Relay Market', activity: 'brickton relay' })
        .secondaryLine,
    ).toBeUndefined();
  });

  it('shows no figures unless a filter or sort asks for one', () => {
    const counted = {
      lowestMonsterLevel: 22,
      highestMonsterLevel: 24,
      monsterCount: 2,
      spawnPointCount: 1260,
      npcCount: 1,
    };

    expect(footer(counted, {})).toEqual([]);
    expect(footer(counted, { levels: true })).toEqual(['Lv. 22–24 monsters']);
    expect(
      footer(
        { lowestMonsterLevel: 15, highestMonsterLevel: 15 },
        { levels: true },
      ),
    ).toEqual(['Lv. 15 monsters']);
    expect(footer({}, { levels: true })).toEqual([]);
    expect(footer(counted, { spawns: true })).toEqual(['1,260 spawns']);
    expect(footer({ spawnPointCount: 0 }, { spawns: true })).toEqual([]);
  });

  it('shows each filtered monster and NPC as a chip, monsters with their count', () => {
    const inhabited = {
      lowestMonsterLevel: 22,
      highestMonsterLevel: 24,
      monsters: [
        {
          entry: {
            publicId: 'm1',
            name: 'Thorncap',
            spriteId: 'a'.repeat(64),
          },
          spawnPointCount: 15,
        },
        { entry: { publicId: 'm2', name: 'Ashcap' }, spawnPointCount: 11 },
      ],
      npcs: [{ entry: { key: 'n1', name: 'Way Keeper' } }],
    };

    expect(
      footer(inhabited, {
        monsters: new Set(['m1', 'm2']),
        npcs: new Set(['n1']),
        levels: true,
      }),
    ).toEqual(['15× [sprite] Thorncap', '11× Ashcap', 'Way Keeper']);
    expect(footer(inhabited, { monsters: new Set(['m1']) })).toEqual([
      '15× [sprite] Thorncap',
    ]);
  });

  it('links to Map Detail in the same build and marks a missing minimap', () => {
    const card = mapBrowseCardView({
      record: record(),
      buildId: 'gms-v83',
      location,
      context: PLAIN_CARD_CONTEXT,
    });

    expect(card.destination).toEqual({
      href: '/maplestory/gms-v83/maps/meadowbrook-hunting-field-abcd1234',
    });
    expect(card.minimapUnavailableLabel).toBe('Minimap unavailable');
    expect(card.minimapPreview).toBe(false);
  });
});
