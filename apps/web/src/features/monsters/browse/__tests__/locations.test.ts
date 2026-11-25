import {
  getMonsterLocationBrowse,
  type MonsterLocationBrowseV1_4,
} from '@mapletip/data/monsters';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';
import { projectMonsterLocationCards } from '@/features/monsters/shared/location-cards';

import {
  createMonsterLocationReader,
  projectBrowseLocationCards,
} from '../locations';
import type { MonsterBrowseRow } from '../project';

vi.mock(import('@mapletip/data/monsters'), async (original) => ({
  ...(await original()),
  getMonsterLocationBrowse: vi.fn(),
}));

const monsterKey = 'fixture:monster:golem';
const summary = {
  state: 'unresolved',
  mapCount: 2,
  placementCount: 8,
} as const;
const artifact: MonsterLocationBrowseV1_4 = {
  contractVersion: '1.4',
  format: 'mapletip.monster-location-browse',
  scope: { family_id: 'gms', build_id: 'gms-v83' },
  records: {
    [monsterKey]: {
      entries: [
        {
          mapKey: 'fixture:map:01',
          mapSourceId: '01',
          mapName: { state: 'unknown' },
          publicId: '00000001',
          slug: 'map',
          placementCount: 2,
          stage: { state: 'unknown' },
          points: { state: 'absent', packedPairs: [] },
        },
        {
          mapKey: 'fixture:map:02',
          mapSourceId: '02',
          mapName: { state: 'known', value: 'Practice Grounds' },
          publicId: '00000002',
          slug: 'practice-grounds',
          streetName: 'Lantern Hills',
          placementCount: 6,
          stage: {
            state: 'known',
            value: {
              contentId: 'a'.repeat(64),
              width: 90,
              height: 60,
              scale: 1,
            },
          },
          points: { state: 'partial', packedPairs: [4, 7] },
        },
      ],
    },
  },
};
const readSdk = vi.mocked(getMonsterLocationBrowse);

describe('Monster Browse location data', () => {
  beforeEach(() => readSdk.mockReset());

  it('shares an in-flight and successful read within a visit and isolates builds', async () => {
    let resolveFirst!: (value: MonsterLocationBrowseV1_4) => void;
    const pending = new Promise<MonsterLocationBrowseV1_4>((resolve) => {
      resolveFirst = resolve;
    });
    readSdk.mockReturnValueOnce(pending).mockResolvedValue(artifact);
    const classicWorld = createMonsterLocationReader('cw-launch');
    const gms = createMonsterLocationReader('gms-v83');
    expect(readSdk).not.toHaveBeenCalled();
    const first = classicWorld.read();
    expect(classicWorld.read()).toBe(first);

    const alternate = gms.read();
    await expect(alternate).resolves.toBe(artifact);
    resolveFirst(artifact);
    await expect(first).resolves.toBe(artifact);
    expect(classicWorld.read()).toBe(first);
    expect(gms.read()).toBe(alternate);
    expect(readSdk.mock.calls).toEqual([
      [{ ...MAPLEKIT_RELEASE, buildId: 'cw-launch' }],
      [{ ...MAPLEKIT_RELEASE, buildId: 'gms-v83' }],
    ]);
  });

  it('retries failed reads and can discard an inconsistent result on explicit retry', async () => {
    readSdk
      .mockRejectedValueOnce(new Error('missing'))
      .mockResolvedValue(artifact);
    const reader = createMonsterLocationReader('gms-v83');
    await expect(reader.read()).rejects.toThrow('missing');
    const previous = reader.read();
    await expect(previous).resolves.toBe(artifact);
    reader.forget(previous);
    expect(reader.read()).not.toBe(previous);
    expect(readSdk).toHaveBeenCalledTimes(3);
  });

  it('uses catalog coverage and projects resolved maps with their full counts and published points', () => {
    const record: MonsterBrowseRow = {
      key: monsterKey,
      name: 'Practice Golem',
      locations: summary,
      drops: { entries: [], itemKeys: [] },
      factStates: {},
    };
    const maps = projectBrowseLocationCards(artifact, record, 'gms-v83');
    expect(maps.map((map) => map.name)).toEqual([
      'Practice Grounds',
      'Map name unavailable',
    ]);
    expect(maps[0]).toMatchObject({
      secondaryLine: 'Lantern Hills',
      placementCount: 6,
      minimapStage: { spawnPoints: [{ x: 4, y: 7 }] },
      destination: {
        href: '/maplestory/gms-v83/maps/practice-grounds-00000002',
      },
    });
    expect(maps[1]).not.toHaveProperty('minimapUrl');
    expect(() =>
      projectBrowseLocationCards(
        { ...artifact, records: {} },
        record,
        'gms-v83',
      ),
    ).toThrow(/counts disagree/u);
    expect(() =>
      projectBrowseLocationCards(
        artifact,
        {
          ...record,
          locations: { ...summary, placementCount: 7 },
        },
        'gms-v83',
      ),
    ).toThrow(/counts disagree/u);
  });

  it('keeps maps without a published address as plain cards and breaks spawn ties by name and key', () => {
    const entries = [
      { mapKey: 'map:3', mapName: { state: 'known', value: 'Birch' } },
      { mapKey: 'map:2', mapName: { state: 'known', value: 'Alder' } },
      { mapKey: 'map:1', mapName: { state: 'known', value: 'Alder' } },
    ] as const;
    const maps = projectMonsterLocationCards(
      entries.map((entry) => ({
        ...entry,
        mapSourceId: entry.mapKey,
        placementCount: 1,
      })),
      'cw-launch',
    );
    expect(maps.map((map) => map.key)).toEqual(['map:1', 'map:2', 'map:3']);
    expect(maps.every((map) => map.destination === undefined)).toBe(true);
  });
});
