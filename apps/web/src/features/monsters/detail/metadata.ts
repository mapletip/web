import { BUILDS, type BuildId } from '@/config/maplekit';
import {
  buildCollectionPath,
  buildDetailHead,
  buildRecordDetailPath,
  canonicalBuildParam,
  type DetailBreadcrumb,
  type DetailHeadPayload,
} from '@/features/detail';

import type { MonsterDetailView } from './project';

export interface MonsterDetailMetadataOptions {
  readonly view: Pick<
    MonsterDetailView,
    'name' | 'slug' | 'publicId' | 'canonicalPath'
  >;
  readonly buildId: BuildId;
  readonly noIndex?: boolean;
}

/**
 * Shared breadcrumb trail for Monster Detail metadata (JSON-LD) and UI.
 */
export function monsterDetailBreadcrumbs({
  view,
  buildId,
}: Pick<
  MonsterDetailMetadataOptions,
  'view' | 'buildId'
>): readonly DetailBreadcrumb[] {
  return [
    { label: 'Home', path: '/', linkProps: { to: '/' } },
    {
      label: 'Monsters',
      path: buildCollectionPath('monsters', buildId),
      linkProps: {
        to: '/maplestory/{-$buildId}/monsters',
        params: { buildId: canonicalBuildParam(buildId) },
      },
    },
    {
      label: view.name,
      path:
        view.canonicalPath ||
        buildRecordDetailPath('monsters', view.slug, view.publicId, buildId),
    },
  ];
}

/** Build head metadata, canonical link, and breadcrumb JSON-LD for a monster. */
export function monsterDetailMetadata({
  view,
  buildId,
  noIndex = false,
}: MonsterDetailMetadataOptions): DetailHeadPayload {
  const buildLabel = BUILDS[buildId].label;
  const canonicalPath =
    view.canonicalPath ||
    buildRecordDetailPath('monsters', view.slug, view.publicId, buildId);
  const breadcrumbs = monsterDetailBreadcrumbs({ view, buildId });

  return buildDetailHead({
    title: `${view.name} – MapleStory ${buildLabel} Monster – MapleTip`,
    description: `${view.name} in MapleStory ${buildLabel}. View monster stats, spawn locations, drops, and quests on MapleTip.`,
    canonicalPath,
    ogType: 'website',
    noIndex,
    breadcrumbs,
  });
}
