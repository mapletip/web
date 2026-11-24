/**
 * Map Browse location addresses, shared by the location rail and Map Detail
 * breadcrumbs. A location's slug is the last segment of its published key
 * (`region:western-isle` → `western-isle`,
 * `area:western-isle/meadowbrook` → `meadowbrook`, `collection:event` → `event`).
 */
import type { BuildId } from '@/config/maplekit';
import { buildCollectionPath } from '@/features/detail';

export const MAPS_ROUTE = '/maplestory/{-$buildId}/maps' as const;
export const MAP_LOCATION_ROUTE =
  '/maplestory/{-$buildId}/maps/in/$location/{-$area}' as const;

/** Route params of a location page; none for All maps. */
export interface MapLocationParams {
  readonly location?: string;
  readonly area?: string;
}

export function locationSlug(key: string): string {
  return key.slice(key.search(/[^:/]*$/u));
}

/** Route params of a region, or of an area under its region. */
export function mapLocationParams({
  regionKey,
  areaKey,
}: {
  readonly regionKey: string;
  readonly areaKey?: string | undefined;
}): MapLocationParams {
  const location = locationSlug(regionKey);
  return areaKey === undefined
    ? { location }
    : { location, area: locationSlug(areaKey) };
}

/** Site path of a location page in a build. */
export function mapLocationPath({
  buildId,
  params,
}: {
  readonly buildId: BuildId;
  readonly params: MapLocationParams;
}): string {
  const maps = buildCollectionPath('maps', buildId);
  if (params.location === undefined) return maps;
  return params.area === undefined
    ? `${maps}/in/${params.location}`
    : `${maps}/in/${params.location}/${params.area}`;
}
