import { BUILDS, type BuildId } from '@/config/maplekit';
import {
  buildCollectionPath,
  buildDetailHead,
  type DetailBreadcrumb,
  type DetailHeadPayload,
} from '@/features/detail';

import type { MapDetailView } from './project';

export interface MapDetailMetadataOptions {
  readonly view: Pick<
    MapDetailView,
    'name' | 'canonicalPath' | 'regionLabel' | 'areaLabel'
  >;
  readonly buildId: BuildId;
  readonly noIndex?: boolean;
}

/** Shared breadcrumb trail for Map Detail metadata and page content. */
export function mapDetailBreadcrumbs({
  view,
  buildId,
}: MapDetailMetadataOptions): readonly DetailBreadcrumb[] {
  const areaMatchesMap =
    view.areaLabel?.trim().toLocaleLowerCase('en') ===
    view.name.trim().toLocaleLowerCase('en');

  return [
    { label: 'Home', path: '/', linkProps: { to: '/' } },
    { label: 'Maps', path: buildCollectionPath('maps', buildId) },
    ...(view.regionLabel === undefined ? [] : [{ label: view.regionLabel }]),
    ...(view.areaLabel === undefined || areaMatchesMap
      ? []
      : [{ label: view.areaLabel }]),
    { label: view.name, path: view.canonicalPath },
  ];
}

/** Build title, description, canonical link, and breadcrumb JSON-LD for a Map. */
export function mapDetailMetadata({
  view,
  buildId,
  noIndex = false,
}: MapDetailMetadataOptions): DetailHeadPayload {
  const buildLabel = BUILDS[buildId].label;
  return buildDetailHead({
    title: `${view.name} - MapleStory Map, Monster Spawns & NPCs | ${buildLabel}`,
    description: `Map details for ${view.name} in ${buildLabel}, with recorded spawn and connection information where available.`,
    canonicalPath: view.canonicalPath,
    ogType: 'website',
    noIndex,
    breadcrumbs: mapDetailBreadcrumbs({ view, buildId }),
  });
}
