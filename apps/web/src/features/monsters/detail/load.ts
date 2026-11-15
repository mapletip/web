/**
 * One-shot loader for a single Monster Detail page.
 *
 * Delegates release verification, build selection, and page-pack integrity to
 * the SDK's `getMonsterPage`, translating missing records into a typed
 * `not-found` outcome and sanitizing all other failures.
 */
import { MissingRecordError } from '@mapletip/data';
import { getMonsterPage } from '@mapletip/data/monsters';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';

import { isAbortError, sanitizeMonsterLoadError } from '../load-error';

import { projectMonsterDetail, type MonsterDetailView } from './project';

export const MONSTER_DETAIL_UNAVAILABLE_MESSAGE =
  'Monster details could not be loaded.';

export interface LoadMonsterDetailOptions {
  readonly buildId: BuildId;
  readonly publicId: string;
  readonly signal?: AbortSignal;
}

export type MonsterDetailLoadResult =
  | { readonly status: 'found'; readonly view: MonsterDetailView }
  | { readonly status: 'not-found' };

export function sanitizeMonsterDetailError(error: unknown): unknown {
  return sanitizeMonsterLoadError(error, MONSTER_DETAIL_UNAVAILABLE_MESSAGE);
}

/** Load and project one verified monster page record by build and public id. */
export async function loadMonsterDetail({
  buildId,
  publicId,
  signal,
}: LoadMonsterDetailOptions): Promise<MonsterDetailLoadResult> {
  try {
    const record = await getMonsterPage({
      baseUrl: MAPLEKIT_RELEASE.baseUrl,
      pin: MAPLEKIT_RELEASE.pin,
      buildId,
      publicId,
      ...(signal === undefined ? {} : { signal }),
    });
    return {
      status: 'found',
      view: projectMonsterDetail(record, buildId),
    };
  } catch (error) {
    if (error instanceof MissingRecordError) {
      return { status: 'not-found' };
    }
    if (isAbortError(error)) throw error;
    if (import.meta.env.SSR) {
      console.error('Monster Detail data load failed.', error);
    }
    throw sanitizeMonsterDetailError(error);
  }
}
