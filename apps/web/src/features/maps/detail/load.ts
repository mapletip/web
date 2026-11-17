/**
 * One-shot loader for a single Map Detail page.
 *
 * Missing records and invalid public ids are not-found outcomes. Other SDK and
 * origin failures are sanitized before they cross the route boundary.
 */
import { MissingRecordError } from '@mapletip/data';
import { getMapPage } from '@mapletip/data/maps';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import { isAbortError, sanitizeLoadError } from '@/features/detail/load-error';

import { projectMapDetail, type MapDetailView } from './project';

export const MAP_DETAIL_UNAVAILABLE_MESSAGE =
  'Map details could not be loaded.';

export interface LoadMapDetailOptions {
  readonly buildId: BuildId;
  readonly publicId: string;
  readonly signal?: AbortSignal;
}

export type MapDetailLoadResult =
  | { readonly status: 'found'; readonly view: MapDetailView }
  | { readonly status: 'not-found' };

/** Load and project one verified Map page record by build and public id. */
export async function loadMapDetail({
  buildId,
  publicId,
  signal,
}: LoadMapDetailOptions): Promise<MapDetailLoadResult> {
  try {
    const record = await getMapPage({
      baseUrl: MAPLEKIT_RELEASE.baseUrl,
      pin: MAPLEKIT_RELEASE.pin,
      buildId,
      publicId,
      ...(signal === undefined ? {} : { signal }),
    });
    return {
      status: 'found',
      view: projectMapDetail({ record, buildId }),
    };
  } catch (error) {
    if (error instanceof MissingRecordError) return { status: 'not-found' };
    if (isAbortError(error)) throw error;
    if (import.meta.env.SSR) {
      console.error('Map Detail data load failed.', error);
    }
    throw sanitizeLoadError(error, MAP_DETAIL_UNAVAILABLE_MESSAGE);
  }
}
