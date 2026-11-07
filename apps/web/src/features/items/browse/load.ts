/**
 * One-shot loader shared by all Items browse routes.
 *
 * Reads one build's verified Item browse roster via MAPLEKIT_RELEASE exactly like
 * the Monster loader; no cache, retry or fallback.
 */
import { getItemBrowse, type ItemBrowseCoverage } from '@mapletip/data/items';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';

import { projectItemBrowseRows, type ItemRow } from './project';

export interface LoadedItemBrowse {
  readonly rows: readonly ItemRow[];
  readonly coverage: ItemBrowseCoverage;
}

export async function loadItemBrowse(
  buildId: BuildId,
  signal?: AbortSignal,
): Promise<LoadedItemBrowse> {
  const browse = await getItemBrowse({
    baseUrl: MAPLEKIT_RELEASE.baseUrl,
    pin: MAPLEKIT_RELEASE.pin,
    buildId,
    ...(signal === undefined ? {} : { signal }),
  });

  return {
    rows: projectItemBrowseRows(browse.records),
    coverage: browse.coverage,
  };
}
