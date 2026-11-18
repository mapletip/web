import { MissingRecordError, SchemaValidationError } from '@mapletip/data';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { loadMapDetail, MAP_DETAIL_UNAVAILABLE_MESSAGE } from '../load';
import { projectMapDetail } from '../project';

import { mapPageRecordFixture } from './mapPageFixture';

const getMapPage = vi.hoisted(() => vi.fn());

vi.mock('@mapletip/data/maps', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mapletip/data/maps')>();
  return { ...actual, getMapPage };
});

describe('loadMapDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads and projects a found map page', async () => {
    const controller = new AbortController();
    const record = mapPageRecordFixture({
      mapId: 'practice-grove',
      buildId: 'gms-v83',
    });
    getMapPage.mockResolvedValue(record);

    const result = await loadMapDetail({
      buildId: 'gms-v83',
      publicId: record.publicId,
      signal: controller.signal,
    });

    expect(getMapPage).toHaveBeenCalledWith({
      baseUrl: MAPLEKIT_RELEASE.baseUrl,
      pin: MAPLEKIT_RELEASE.pin,
      buildId: 'gms-v83',
      publicId: record.publicId,
      signal: controller.signal,
    });
    expect(getMapPage).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: 'found',
      view: projectMapDetail({ record, buildId: 'gms-v83' }),
    });
  });

  it('returns not-found for an SDK missing record', async () => {
    getMapPage.mockRejectedValue(new MissingRecordError('missing0', 'Map'));

    await expect(
      loadMapDetail({ buildId: 'cw-launch', publicId: 'missing0' }),
    ).resolves.toEqual({ status: 'not-found' });
  });

  it('returns not-found for a malformed public id rejected by SDK validation', async () => {
    getMapPage.mockRejectedValue(
      new SchemaValidationError('publicId', 'invalid public id'),
    );

    await expect(
      loadMapDetail({ buildId: 'cw-launch', publicId: 'not-an-id' }),
    ).resolves.toEqual({ status: 'not-found' });
  });

  it('sanitizes other data read failures', async () => {
    getMapPage.mockRejectedValue(
      new Error('HTTP 503 at v2/maps/page-packs/secret.json'),
    );
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      loadMapDetail({ buildId: 'cw-launch', publicId: '22kodknn' }),
    ).rejects.toThrow(MAP_DETAIL_UNAVAILABLE_MESSAGE);

    log.mockRestore();
  });
});
