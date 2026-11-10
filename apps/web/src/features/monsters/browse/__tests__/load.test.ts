import type { MonsterDropBrowseV1 } from '@mapletip/data/monsters';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { loadMonsterBrowse } from '../load';

const openRelease = vi.hoisted(() => vi.fn());
const openBuild = vi.hoisted(() => vi.fn());
const loadCatalog = vi.hoisted(() => vi.fn());
const loadDropBrowse = vi.hoisted(() => vi.fn());

vi.mock('@mapletip/data/release', () => ({ openRelease }));

function catalogFixture() {
  return {
    contractVersion: '2.1',
    format: 'mapletip.monster-catalog-2',
    recordCount: 1,
    records: [
      {
        key: 'fixture:monster:001',
        name: { state: 'known', value: 'Sentinel Snail' },
        sprite: { state: 'unknown' },
        stats: Array.from({ length: 12 }, () => ({ state: 'known', value: 1 })),
        traits: Array.from({ length: 9 }, () => ({ state: 'unknown' })),
        elements: { state: 'unknown' },
        relationships: { state: 'unknown' },
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
        itemRef: { state: 'resolved', key: 'fixture:item:red-potion' },
        itemName: { state: 'known', value: 'Red Potion' },
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

function setProduct(manifest: Record<string, unknown>) {
  openRelease.mockResolvedValue({ openBuild });
  openBuild.mockResolvedValue({ manifest, loadCatalog, loadDropBrowse });
  loadCatalog.mockResolvedValue(catalogFixture());
}

describe('loadMonsterBrowse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps old pinned catalogs usable and marks their drop data unavailable', async () => {
    setProduct({ requiredClientCapabilities: [], dropBrowse: null });
    const controller = new AbortController();

    const browse = await loadMonsterBrowse('cw-launch', controller.signal);

    expect(openRelease).toHaveBeenCalledWith({
      baseUrl: MAPLEKIT_RELEASE.baseUrl,
      pin: MAPLEKIT_RELEASE.pin,
      signal: controller.signal,
    });
    expect(openBuild).toHaveBeenCalledWith('cw-launch');
    expect(loadCatalog).toHaveBeenCalledWith({ signal: controller.signal });
    expect(loadDropBrowse).not.toHaveBeenCalled();
    expect(browse.rows).toHaveLength(1);
    expect(browse.rows[0]?.drops.native).toEqual({ state: 'unavailable' });
    expect(browse.dropBrowseAvailable).toBe(false);
    expect(browse.dropItemOptions).toEqual([]);
  });

  it('loads the manifest-advertised drop browse through the same product client', async () => {
    setProduct({
      requiredClientCapabilities: ['monster-drop-browse-v1'],
      dropBrowse: { path: 'drop-browse.json' },
    });
    loadDropBrowse.mockResolvedValue(dropBrowseFixture());
    const controller = new AbortController();

    const browse = await loadMonsterBrowse('cw-launch', controller.signal);

    expect(openRelease).toHaveBeenCalledTimes(1);
    expect(openBuild).toHaveBeenCalledTimes(1);
    expect(loadCatalog).toHaveBeenCalledWith({ signal: controller.signal });
    expect(loadDropBrowse).toHaveBeenCalledWith({ signal: controller.signal });
    expect(browse.dropBrowseAvailable).toBe(true);
    expect(browse.dropItemOptions).toEqual([
      { value: 'fixture:item:red-potion', label: 'Red Potion' },
    ]);
    expect(browse.rows[0]?.drops.entries[0]?.itemName).toBe('Red Potion');
    expect(browse.rows[0]?.drops.itemKeys).toEqual(['fixture:item:red-potion']);
  });

  it('lets SDK errors propagate when a manifest only partly advertises drops', async () => {
    setProduct({
      requiredClientCapabilities: [],
      dropBrowse: { path: 'drops.json' },
    });
    const failure = Object.assign(new Error('unsupported capability'), {
      code: 'UNSUPPORTED_CAPABILITY',
    });
    loadDropBrowse.mockRejectedValue(failure);

    await expect(loadMonsterBrowse('cw-launch')).rejects.toBe(failure);
  });

  it('propagates catalog verification failures', async () => {
    setProduct({ requiredClientCapabilities: [], dropBrowse: null });
    const failure = Object.assign(new Error('integrity'), {
      code: 'INTEGRITY_ERROR',
    });
    loadCatalog.mockRejectedValue(failure);

    await expect(loadMonsterBrowse('cw-launch')).rejects.toBe(failure);
  });
});
