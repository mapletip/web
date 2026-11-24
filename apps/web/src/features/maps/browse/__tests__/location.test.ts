import { describe, expect, it } from 'vitest';

import {
  locationSlug,
  mapLocationPath,
  mapLocationTree,
  resolveMapLocation,
} from '../location';
import type { MapBrowseGeography } from '../project';

const geography: MapBrowseGeography = {
  regions: [
    {
      key: 'region:starter-isle',
      label: 'Starter Isle',
      mapCount: 3,
      areas: [
        { key: 'area:starter-isle/dawnfield', label: 'Dawnfield', mapCount: 2 },
      ],
    },
    {
      key: 'region:western-isle',
      label: 'Western Isle',
      mapCount: 5,
      areas: [
        {
          key: 'area:western-isle/meadowbrook',
          label: 'Meadowbrook',
          mapCount: 4,
        },
      ],
    },
  ],
  collections: [{ key: 'collection:event', label: 'Event maps', mapCount: 1 }],
};

describe('locationSlug', () => {
  it('takes the last segment of a published key', () => {
    expect(locationSlug('region:western-isle')).toBe('western-isle');
    expect(locationSlug('area:western-isle/meadowbrook')).toBe('meadowbrook');
    expect(locationSlug('collection:event')).toBe('event');
  });
});

describe('resolveMapLocation', () => {
  const resolve = (location: string, area?: string) =>
    resolveMapLocation({ geography, location, area });

  it('resolves a region, an area under it and a collection', () => {
    expect(resolve('western-isle')).toEqual({
      id: 'region:western-isle',
      kind: 'region',
      label: 'Western Isle',
      params: { location: 'western-isle' },
    });
    expect(resolve('western-isle', 'meadowbrook')).toMatchObject({
      id: 'area:western-isle/meadowbrook',
      kind: 'area',
      params: { location: 'western-isle', area: 'meadowbrook' },
    });
    expect(resolve('event')).toMatchObject({
      id: 'collection:event',
      kind: 'collection',
    });
  });

  it('rejects unknown slugs and areas outside their region', () => {
    expect(resolve('not-a-place')).toBeUndefined();
    expect(resolve('starter-isle', 'meadowbrook')).toBeUndefined();
    expect(resolve('event', 'meadowbrook')).toBeUndefined();
  });
});

describe('mapLocationTree', () => {
  it('lists regions then collections, areas under regions, with counts', () => {
    const tree = mapLocationTree({
      geography,
      buildId: 'gms-v83',
      counts: new Map([
        ['all', 9],
        ['region:western-isle', 5],
      ]),
    });

    expect(tree.count).toBe(9);
    expect(tree.children?.map(({ label, count }) => [label, count])).toEqual([
      ['Starter Isle', 0],
      ['Western Isle', 5],
      ['Event maps', 0],
    ]);
    expect(tree.children?.[1]?.children?.[0]).toMatchObject({
      label: 'Meadowbrook',
      href: '/maplestory/gms-v83/maps/in/western-isle/meadowbrook',
      meta: { location: 'western-isle', area: 'meadowbrook' },
    });
    expect(tree.children?.some((node) => node.icon !== undefined)).toBe(false);
  });
});

describe('mapLocationPath', () => {
  it('builds the canonical path of each location in a build', () => {
    expect(mapLocationPath({ buildId: 'cw-launch', params: {} })).toBe(
      '/maplestory/maps',
    );
    expect(
      mapLocationPath({ buildId: 'cw-launch', params: { location: 'event' } }),
    ).toBe('/maplestory/maps/in/event');
  });
});
