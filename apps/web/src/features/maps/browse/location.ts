/**
 * Locations of Map Browse: All maps, regions with their areas, and
 * collections, resolved from the build's geography.
 */
import type { DrillDownNode } from '@mapletip/component-library';

import type { BuildId } from '@/config/maplekit';
import {
  locationSlug,
  mapLocationPath,
  type MapLocationParams,
} from '@/features/maps/shared';

import type { MapBrowseGeography, MapBrowseLocation } from './project';
import { ALL_MAPS } from './records';

export interface MapLocationNode {
  /** Navigation node id: the geography key, or "all". */
  readonly id: string;
  readonly kind: 'all' | 'region' | 'area' | 'collection';
  readonly label: string;
  readonly params: MapLocationParams;
}

export const ALL_MAPS_LOCATION: MapLocationNode = {
  id: ALL_MAPS,
  kind: 'all',
  label: 'All maps',
  params: {},
};

function node(
  kind: MapLocationNode['kind'],
  location: MapBrowseLocation,
  params: MapLocationParams,
): MapLocationNode {
  return { id: location.key, kind, label: location.label, params };
}

/**
 * Resolve location route params against the build's geography: a region
 * first, then a collection; an area only under the region that contains it.
 */
export function resolveMapLocation({
  geography,
  location,
  area,
}: {
  readonly geography: MapBrowseGeography;
  readonly location: string;
  readonly area?: string | undefined;
}): MapLocationNode | undefined {
  const region = geography.regions.find(
    ({ key }) => locationSlug(key) === location,
  );
  if (region !== undefined) {
    if (area === undefined) return node('region', region, { location });
    const match = region.areas.find(({ key }) => locationSlug(key) === area);
    return match === undefined
      ? undefined
      : node('area', match, { location, area });
  }
  if (area !== undefined) return undefined;
  const collection = geography.collections.find(
    ({ key }) => locationSlug(key) === location,
  );
  return collection === undefined
    ? undefined
    : node('collection', collection, { location });
}

/**
 * The location rail: All maps, then regions in model order with their areas,
 * then collections. Each node's `meta` is its route params; `count` is
 * filled from filter-aware navigation counts.
 */
export function mapLocationTree({
  geography,
  buildId,
  counts,
}: {
  readonly geography: MapBrowseGeography;
  readonly buildId: BuildId;
  readonly counts?: ReadonlyMap<string, number> | undefined;
}): DrillDownNode<MapLocationParams> {
  const treeNode = (
    location: MapLocationNode,
    children?: readonly DrillDownNode<MapLocationParams>[],
  ): DrillDownNode<MapLocationParams> => ({
    id: location.id,
    label: location.label,
    href: mapLocationPath({ buildId, params: location.params }),
    meta: location.params,
    ...(counts === undefined ? {} : { count: counts.get(location.id) ?? 0 }),
    ...(children === undefined ? {} : { children }),
  });

  return treeNode(ALL_MAPS_LOCATION, [
    ...geography.regions.map((region) => {
      const location = locationSlug(region.key);
      return treeNode(
        node('region', region, { location }),
        region.areas.map((area) =>
          treeNode(
            node('area', area, { location, area: locationSlug(area.key) }),
          ),
        ),
      );
    }),
    ...geography.collections.map((collection) =>
      treeNode(
        node('collection', collection, {
          location: locationSlug(collection.key),
        }),
      ),
    ),
  ]);
}
