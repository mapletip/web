/**
 * One-shot loader shared by the Map Browse routes: one verified `getMapBrowse`
 * read projected on the server, behind the shared load boundary.
 */
import {
  UnsupportedCapabilityError,
  UnsupportedProductError,
} from '@mapletip/data';
import { getMapBrowse } from '@mapletip/data/maps';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import { withLoadBoundary } from '@/features/detail/load-error';

import { projectMapBrowse, type MapBrowseData } from './project';

export const MAP_BROWSE_UNAVAILABLE_MESSAGE = 'Map data could not be loaded.';

export type MapBrowseLoadResult =
  | { readonly status: 'available'; readonly data: MapBrowseData }
  | { readonly status: 'unavailable' };

export function loadMapBrowse(
  buildId: BuildId,
  signal?: AbortSignal,
): Promise<MapBrowseLoadResult> {
  return withLoadBoundary({
    failureMessage: MAP_BROWSE_UNAVAILABLE_MESSAGE,
    logMessage: 'Map Browse data load failed.',
    load: async () => {
      try {
        const browse = await getMapBrowse({
          baseUrl: MAPLEKIT_RELEASE.baseUrl,
          pin: MAPLEKIT_RELEASE.pin,
          buildId,
          ...(signal === undefined ? {} : { signal }),
        });
        return { status: 'available', data: projectMapBrowse(browse) };
      } catch (error) {
        // A release without Map Browse for the build is a page state, not a failure.
        if (
          error instanceof UnsupportedCapabilityError ||
          error instanceof UnsupportedProductError
        ) {
          return { status: 'unavailable' };
        }
        throw error;
      }
    },
  });
}
