import {
  UnsupportedCapabilityError,
  UnsupportedProductError,
} from '@mapletip/data';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadMapBrowse, MAP_BROWSE_UNAVAILABLE_MESSAGE } from '../load';

const getMapBrowse = vi.hoisted(() => vi.fn());

vi.mock('@mapletip/data/maps', () => ({ getMapBrowse }));

describe('loadMapBrowse', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    new UnsupportedCapabilityError('no map-browse-v1'),
    new UnsupportedProductError('maps for build'),
  ])('reports a release without Map Browse as unavailable', async (error) => {
    getMapBrowse.mockRejectedValue(error);

    await expect(loadMapBrowse('gms-v83')).resolves.toEqual({
      status: 'unavailable',
    });
  });

  it('exposes no SDK diagnostics when the read fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getMapBrowse.mockRejectedValue(
      Object.assign(new Error('SHA-256 mismatch at v2/maps/browse/x.json'), {
        code: 'INTEGRITY_ERROR',
      }),
    );

    const failure: unknown = await loadMapBrowse('cw-launch').catch(
      (error: unknown) => error,
    );

    expect(failure).toMatchObject({ message: MAP_BROWSE_UNAVAILABLE_MESSAGE });
    expect(failure).not.toHaveProperty('code');
  });
});
