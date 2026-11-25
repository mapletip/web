import { mapMinimapUrl } from '@mapletip/data/maps';
import {
  monsterLocationPointPairs,
  type getMonsterLocationBrowse,
  type StaticMonsterPageRecord,
} from '@mapletip/data/monsters';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import {
  projectMapRecordDestination,
  type MapRecordCardView,
} from '@/features/maps/shared';
import { nonBlank } from '@/util/nonBlank';

import { formatMonsterNumber } from './monster-data';

type LocationBrowse = Awaited<ReturnType<typeof getMonsterLocationBrowse>>;

type LocationEntry =
  | StaticMonsterPageRecord['locations']['entries'][number]
  | NonNullable<LocationBrowse['records'][string]>['entries'][number];

export interface MonsterLocationMapView extends MapRecordCardView {
  readonly placementCount: number;
}

export type MonsterLocationSort = 'spawns' | 'name';

export function compareMonsterLocations(
  left: MonsterLocationMapView,
  right: MonsterLocationMapView,
  sort: MonsterLocationSort = 'spawns',
): number {
  const spawnOrder = right.placementCount - left.placementCount;
  const nameOrder = left.name.localeCompare(right.name, 'en', {
    sensitivity: 'base',
    numeric: sort === 'name',
  });
  const order =
    sort === 'name' ? nameOrder || spawnOrder : spawnOrder || nameOrder;
  return order || left.key.localeCompare(right.key);
}

export function publishedMonsterLocationName(
  entry: LocationEntry,
): string | undefined {
  const name = 'mapName' in entry ? entry.mapName : entry.name;
  return name.state === 'known' ? nonBlank(name.value) : undefined;
}

export function projectMonsterLocationCards(
  entries: readonly LocationEntry[],
  buildId: BuildId,
  minimapSprite?: MapRecordCardView['minimapSprite'],
): MonsterLocationMapView[] {
  return entries
    .map((entry): MonsterLocationMapView => {
      const street = nonBlank(entry.streetName);
      const stage =
        'stage' in entry && entry.stage.state === 'known'
          ? entry.stage.value
          : undefined;
      const contentId =
        'minimap' in entry && entry.minimap.state === 'known'
          ? entry.minimap.value
          : stage?.contentId;
      const destination =
        'publicId' in entry && 'slug' in entry
          ? projectMapRecordDestination({
              publicId: entry.publicId,
              slug: entry.slug,
              buildId,
            })
          : undefined;
      const minimapStage =
        stage === undefined || !('points' in entry)
          ? undefined
          : {
              width: stage.width,
              height: stage.height,
              ...('scale' in stage && typeof stage.scale === 'number'
                ? { scale: stage.scale }
                : {}),
              spawnPoints:
                entry.points.state === 'absent'
                  ? []
                  : monsterLocationPointPairs(entry.points.packedPairs),
            };

      return {
        key: entry.mapKey,
        name: publishedMonsterLocationName(entry) ?? 'Map name unavailable',
        ...(street === undefined ? {} : { secondaryLine: street }),
        ...(contentId === undefined
          ? {}
          : { minimapUrl: mapMinimapUrl(MAPLEKIT_RELEASE.baseUrl, contentId) }),
        ...(minimapSprite === undefined ? {} : { minimapSprite }),
        ...(minimapStage === undefined ? {} : { minimapStage }),
        ...(destination === undefined ? {} : { destination }),
        footerParts: [
          {
            value: formatMonsterNumber(entry.placementCount),
            label: entry.placementCount === 1 ? 'spawn' : 'spawns',
          },
        ],
        placementCount: entry.placementCount,
      };
    })
    .sort(compareMonsterLocations);
}
