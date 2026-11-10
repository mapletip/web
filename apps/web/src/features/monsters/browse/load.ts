/**
 * One-shot loader shared by both Monster browse routes.
 *
 * The SDK owns the trust boundary: it verifies the pinned release, selects the
 * requested build under that build's scope, and verifies the catalog and drop
 * browse artifact. This loader adds no cache, retry or cross-build fallback.
 */
import type { MonsterDropBrowseV1 } from '@mapletip/data/monsters';
import { openRelease } from '@mapletip/data/release';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';

import {
  projectMonsterBrowseRows,
  projectMonsterDropItemOptions,
  type MonsterBrowseRow,
  type MonsterDropItemOption,
} from './project';

export interface MonsterBrowseData {
  readonly rows: readonly MonsterBrowseRow[];
  readonly dropBrowseAvailable: boolean;
  readonly dropItemOptions: readonly MonsterDropItemOption[];
}

export async function loadMonsterBrowse(
  buildId: BuildId,
  signal?: AbortSignal,
): Promise<MonsterBrowseData> {
  const release = await openRelease({
    baseUrl: MAPLEKIT_RELEASE.baseUrl,
    pin: MAPLEKIT_RELEASE.pin,
    ...(signal === undefined ? {} : { signal }),
  });
  const monsterProduct = await release.openBuild(buildId);
  const supportsDropBrowse = (
    monsterProduct.manifest.requiredClientCapabilities ?? []
  ).includes('monster-drop-browse-v1');
  const hasDropBrowseDescriptor =
    monsterProduct.manifest.dropBrowse !== undefined &&
    monsterProduct.manifest.dropBrowse !== null;

  // Older immutable releases have neither the capability nor artifact. Keep
  // their catalog usable and label Drops unavailable. If only one half of the
  // manifest contract exists, let the SDK report its typed unsupported error.
  const dropBrowsePromise: Promise<MonsterDropBrowseV1 | undefined> =
    !supportsDropBrowse && !hasDropBrowseDescriptor
      ? Promise.resolve(undefined)
      : monsterProduct.loadDropBrowse(signal === undefined ? {} : { signal });
  const operation = signal === undefined ? {} : { signal };
  const [catalog, dropBrowse] = await Promise.all([
    monsterProduct.loadCatalog(operation),
    dropBrowsePromise,
  ]);

  return {
    rows: projectMonsterBrowseRows(catalog, dropBrowse),
    dropBrowseAvailable: dropBrowse !== undefined,
    dropItemOptions: projectMonsterDropItemOptions(dropBrowse),
  };
}
