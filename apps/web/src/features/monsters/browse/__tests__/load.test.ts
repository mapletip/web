import { describe, expect, it, vi } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { loadMonsterBrowse } from '../load';

const getMonsterBrowse = vi.hoisted(() =>
  vi.fn<(options: unknown) => Promise<unknown>>(),
);

vi.mock('@mapletip/data/monsters', () => ({ getMonsterBrowse }));

function catalogFixture() {
  return {
    contractVersion: '2.0',
    format: 'mapletip.monster-catalog-2',
    recordCount: 0,
    records: [],
    scope: { build_id: 'cw-launch', family_id: 'classic-world' },
  };
}

describe('loadMonsterBrowse', () => {
  it('calls the SDK with the shared release configuration and signal', async () => {
    getMonsterBrowse.mockResolvedValue(catalogFixture());
    const controller = new AbortController();

    await loadMonsterBrowse('gms-v83', controller.signal);

    expect(getMonsterBrowse).toHaveBeenCalledTimes(1);
    expect(getMonsterBrowse).toHaveBeenCalledWith({
      baseUrl: MAPLEKIT_RELEASE.baseUrl,
      pin: MAPLEKIT_RELEASE.pin,
      buildId: 'gms-v83',
      signal: controller.signal,
    });
  });

  it('propagates a typed SDK failure instead of returning rows', async () => {
    const failure = Object.assign(new Error('integrity'), {
      code: 'INTEGRITY_ERROR',
    });
    getMonsterBrowse.mockRejectedValue(failure);

    await expect(loadMonsterBrowse('cw-launch')).rejects.toBe(failure);
  });
});
