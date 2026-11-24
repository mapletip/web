import type { MonsterDropBrowseV1 } from '@mapletip/data/monsters';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { loadMonsterBrowse, MONSTER_BROWSE_UNAVAILABLE_MESSAGE } from '../load';

const openRelease = vi.hoisted(() => vi.fn());
const openBuild = vi.hoisted(() => vi.fn());
const loadCatalog = vi.hoisted(() => vi.fn());
const loadDropBrowse = vi.hoisted(() => vi.fn());

vi.mock('@mapletip/data/release', () => ({ openRelease }));

function catalogFixture() {
  return {
    contractVersion: '2.2',
    format: 'mapletip.monster-catalog-2',
    recordCount: 1,
    browseCoverage: {
      historicalDrops: 'supported',
      locationScope: 'client-placements',
    },
    records: [
      {
        key: 'fixture:monster:001',
        name: { state: 'known', value: 'Sentinel Shellback' },
        sprite: { state: 'unknown' },
        stats: Array.from({ length: 12 }, () => ({ state: 'known', value: 1 })),
        traits: Array.from({ length: 9 }, () => ({ state: 'unknown' })),
        elements: { state: 'unknown' },
        relationships: { state: 'unknown' },
        drops: { native: { state: 'unknown' } },
        locations: { state: 'absent' },
      },
    ],
    scope: { build_id: 'cw-launch', family_id: 'classic-world' },
  };
}

function dropBrowseFixture(): MonsterDropBrowseV1 {
  return {
    format: 'mapletip.monster-drop-browse',
    contractVersion: '1.0',
    scope: { build_id: 'cw-launch', family_id: 'classic-world' },
    items: [
      {
        itemRef: { state: 'resolved', key: 'fixture:item:crimson-tonic' },
        itemName: { state: 'known', value: 'Crimson Tonic' },
        itemClass: { state: 'known', value: 'etc' },
        category: { kind: 'item-class', value: 'etc' },
      },
    ],
    records: {
      'fixture:monster:001': {
        entries: [{ assertionKind: 'native', item: 0 }],
      },
    },
  };
}

function setProduct() {
  openRelease.mockResolvedValue({ openBuild });
  openBuild.mockResolvedValue({ loadCatalog, loadDropBrowse });
  loadCatalog.mockResolvedValue(catalogFixture());
}

describe('loadMonsterBrowse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads catalog and drops from one opened build product', async () => {
    setProduct();
    loadDropBrowse.mockResolvedValue(dropBrowseFixture());
    const controller = new AbortController();

    const browse = await loadMonsterBrowse('cw-launch', controller.signal);

    expect(openRelease).toHaveBeenCalledWith({
      baseUrl: MAPLEKIT_RELEASE.baseUrl,
      pin: MAPLEKIT_RELEASE.pin,
      signal: controller.signal,
    });
    expect(openBuild).toHaveBeenCalledWith('cw-launch');
    expect(loadCatalog).toHaveBeenCalledWith({ signal: controller.signal });
    expect(loadDropBrowse).toHaveBeenCalledWith({ signal: controller.signal });
    expect(browse.rows).toHaveLength(1);
    expect(browse.dropItemOptions).toEqual([
      { value: 'fixture:item:crimson-tonic', label: 'Crimson Tonic' },
    ]);
    expect(browse.rows[0]?.drops.entries[0]?.itemName).toBe('Crimson Tonic');
    expect(browse.rows[0]?.drops.itemKeys).toEqual([
      'fixture:item:crimson-tonic',
    ]);
  });

  it('sanitizes SDK drop artifact errors before the router can serialize them', async () => {
    setProduct();
    const failure = Object.assign(new Error('unsupported capability'), {
      code: 'UNSUPPORTED_CAPABILITY',
    });
    loadDropBrowse.mockRejectedValue(failure);

    await expect(loadMonsterBrowse('cw-launch')).rejects.toThrow(
      MONSTER_BROWSE_UNAVAILABLE_MESSAGE,
    );
  });

  it('sanitizes catalog verification failures', async () => {
    setProduct();
    const failure = Object.assign(new Error('integrity'), {
      code: 'INTEGRITY_ERROR',
    });
    loadCatalog.mockRejectedValue(failure);

    await expect(loadMonsterBrowse('cw-launch')).rejects.toThrow(
      MONSTER_BROWSE_UNAVAILABLE_MESSAGE,
    );
  });
});
