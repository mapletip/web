/**
 * One-shot loader shared by both Monster browse routes.
 *
 * The SDK owns the trust boundary: it verifies the pinned release, selects the
 * requested build under that build's scope, and rejects a catalog whose declared
 * record count disagrees with its records. This loader adds no cache, retry or
 * cross-build fallback, so a typed SDK failure reaches the route's error boundary
 * instead of becoming an empty, valid-looking catalog.
 */
import { getMonsterBrowse } from '@mapletip/data/monsters';

import { projectMonsterBrowseRows, type MonsterBrowseRow } from './project';
import { releaseBaseUrl, releasePin, type MonsterBuildId } from './release';

export async function loadMonsterBrowse(
  buildId: MonsterBuildId,
  signal?: AbortSignal,
): Promise<readonly MonsterBrowseRow[]> {
  const catalog = await getMonsterBrowse({
    baseUrl: releaseBaseUrl,
    pin: releasePin,
    buildId,
    ...(signal === undefined ? {} : { signal }),
  });

  return projectMonsterBrowseRows(catalog);
}
