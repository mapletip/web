import { MissingRecordError } from '@mapletip/data';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import {
  MONSTER_DETAIL_UNAVAILABLE_MESSAGE,
  loadMonsterDetail,
  sanitizeMonsterDetailError,
} from '../load';
import { projectMonsterDetail } from '../project';

import { monsterPageFixture } from './monsterPageFixture';

const getMonsterPage = vi.hoisted(() => vi.fn());

vi.mock('@mapletip/data/monsters', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@mapletip/data/monsters')>();
  return {
    ...actual,
    getMonsterPage,
  };
});

describe('loadMonsterDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads and projects a found monster page', async () => {
    const controller = new AbortController();
    getMonsterPage.mockResolvedValue(
      monsterPageFixture({
        publicId: 'jp565851',
        slug: 'deepmaw',
        name: { state: 'known', value: 'Deepmaw' },
      }),
    );

    const result = await loadMonsterDetail({
      buildId: 'gms-v83',
      publicId: 'jp565851',
      signal: controller.signal,
    });

    expect(getMonsterPage).toHaveBeenCalledWith({
      baseUrl: MAPLEKIT_RELEASE.baseUrl,
      pin: MAPLEKIT_RELEASE.pin,
      buildId: 'gms-v83',
      publicId: 'jp565851',
      signal: controller.signal,
    });
    expect(result).toEqual({
      status: 'found',
      view: projectMonsterDetail(
        monsterPageFixture({
          publicId: 'jp565851',
          slug: 'deepmaw',
          name: { state: 'known', value: 'Deepmaw' },
        }),
        'gms-v83',
      ),
    });
  });

  it('returns not-found when the SDK throws MissingRecordError', async () => {
    getMonsterPage.mockRejectedValue(
      new MissingRecordError('missing0', 'monster'),
    );

    const result = await loadMonsterDetail({
      buildId: 'cw-launch',
      publicId: 'missing0',
    });

    expect(result).toEqual({ status: 'not-found' });
  });

  it('sanitizes integrity and origin errors without leaking details', async () => {
    getMonsterPage.mockRejectedValue(
      new Error(
        'HTTP 503 from https://d0.mapletip.com/v1/packs/abc.json sha256=deadbeef',
      ),
    );

    await expect(
      loadMonsterDetail({ buildId: 'cw-launch', publicId: '36z2h01p' }),
    ).rejects.toThrow(MONSTER_DETAIL_UNAVAILABLE_MESSAGE);
  });

  it('preserves AbortError and strips technical fields from other errors', () => {
    const abort = new DOMException('Aborted', 'AbortError');
    expect(sanitizeMonsterDetailError(abort)).toBe(abort);

    const sdkError = new Error('SHA-256 mismatch at v1/packs/deadbeef.json');
    const sanitized = sanitizeMonsterDetailError(sdkError);
    expect(sanitized).toBeInstanceOf(Error);
    expect((sanitized as Error).message).toBe(
      MONSTER_DETAIL_UNAVAILABLE_MESSAGE,
    );
    expect((sanitized as Error).message).not.toContain('SHA-256');
  });
});
