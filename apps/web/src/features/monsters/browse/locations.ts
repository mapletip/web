import { getMonsterLocationBrowse } from '@mapletip/data/monsters';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import {
  projectMonsterLocationCards,
  publishedMonsterLocationName,
  type MonsterLocationMapView,
} from '@/features/monsters/shared/location-cards';

import type { MonsterBrowseRow } from './project';

type MonsterLocationBrowse = Awaited<
  ReturnType<typeof getMonsterLocationBrowse>
>;

/** One reader per mounted Monster Browse build, using the app's immutable pin. */
export function createMonsterLocationReader(buildId: BuildId) {
  let request: Promise<MonsterLocationBrowse> | undefined;

  return {
    read() {
      request ??= getMonsterLocationBrowse({
        ...MAPLEKIT_RELEASE,
        buildId,
      }).catch((error: unknown) => {
        request = undefined;
        throw error;
      });
      return request;
    },
    forget(previous: Promise<MonsterLocationBrowse>) {
      if (request === previous) request = undefined;
    },
  };
}

export type MonsterLocationReader = ReturnType<
  typeof createMonsterLocationReader
>;

export interface MonsterBrowseLocationMap extends MonsterLocationMapView {
  readonly publishedName?: string;
}

export function projectBrowseLocationCards(
  browse: MonsterLocationBrowse,
  record: MonsterBrowseRow,
  buildId: BuildId,
): MonsterBrowseLocationMap[] {
  const summary = record.locations;
  const entries = browse.records[record.key]?.entries;
  if (
    summary.state === 'absent' ||
    entries === undefined ||
    entries.length !== summary.mapCount ||
    new Set(entries.map((entry) => entry.mapKey)).size !== summary.mapCount ||
    entries.reduce((count, entry) => count + entry.placementCount, 0) !==
      summary.placementCount
  ) {
    throw new Error(
      `Location browse counts disagree with the catalog for ${record.key}.`,
    );
  }

  const publishedNames = new Map(
    entries.map((entry) => [entry.mapKey, publishedMonsterLocationName(entry)]),
  );
  return projectMonsterLocationCards(entries, buildId).map((map) => {
    const publishedName = publishedNames.get(map.key);
    return publishedName === undefined ? map : { ...map, publishedName };
  });
}
