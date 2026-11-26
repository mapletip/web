/**
 * One-shot loader shared by both Monster browse routes.
 *
 * The SDK owns the trust boundary: it verifies the pinned release, selects the
 * requested build under that build's scope, and verifies the catalog and drop
 * browse artifact. This loader adds no cache, retry or cross-build fallback.
 */
import { openRelease } from '@mapletip/data/release';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import { withLoadBoundary } from '@/features/detail/load-error';

import {
  projectMonsterBrowseRows,
  projectMonsterDropItemOptions,
  type MonsterBrowseRow,
  type MonsterDropItemOption,
} from './project';

export interface MonsterBrowseData {
  readonly rows: readonly MonsterBrowseRow[];
  readonly dropItemOptions: readonly MonsterDropItemOption[];
}

export const MONSTER_BROWSE_UNAVAILABLE_MESSAGE =
  'Monster data could not be loaded.';

export function loadMonsterBrowse(
  buildId: BuildId,
  signal?: AbortSignal,
): Promise<MonsterBrowseData> {
  return withLoadBoundary({
    failureMessage: MONSTER_BROWSE_UNAVAILABLE_MESSAGE,
    logMessage: 'Monster Browse data load failed.',
    load: async () => {
      const release = await openRelease({
        baseUrl: MAPLEKIT_RELEASE.baseUrl,
        pin: MAPLEKIT_RELEASE.pin,
        ...(signal === undefined ? {} : { signal }),
      });
      const monsterProduct = await release.openBuild(buildId);
      const operation = signal === undefined ? {} : { signal };
      const [catalog, dropBrowse] = await Promise.all([
        monsterProduct.loadCatalog(operation),
        monsterProduct.loadDropBrowse(operation),
      ]);

      if (dropBrowse.contractVersion !== '1.2') {
        throw new Error(
          `Unexpected Monster drop browse revision ${dropBrowse.contractVersion}.`,
        );
      }

      return {
        rows: projectMonsterBrowseRows(
          catalog,
          dropBrowse,
          MAPLEKIT_RELEASE.baseUrl,
        ),
        dropItemOptions: projectMonsterDropItemOptions(
          dropBrowse,
          MAPLEKIT_RELEASE.baseUrl,
        ),
      };
    },
  });
}
