/**
 * One-shot loader shared by all Items browse routes.
 *
 * Reads one build's verified Item browse roster via MAPLEKIT_RELEASE exactly like
 * the Monster loader, behind the shared load boundary; no cache, retry or
 * fallback.
 */
import { getItemBrowse, type ItemBrowseCoverage } from '@mapletip/data/items';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import { withLoadBoundary } from '@/features/detail/load-error';

import { projectItemBrowseRows, type ItemRow } from './project';

export interface LoadedItemBrowse {
  readonly rows: readonly ItemRow[];
  readonly coverage: ItemBrowseCoverage;
}

export const ITEM_BROWSE_UNAVAILABLE_MESSAGE = 'Item data could not be loaded.';

export function loadItemBrowse(
  buildId: BuildId,
  signal?: AbortSignal,
): Promise<LoadedItemBrowse> {
  return withLoadBoundary({
    failureMessage: ITEM_BROWSE_UNAVAILABLE_MESSAGE,
    logMessage: 'Items Browse data load failed.',
    load: async () => {
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
    },
  });
}
