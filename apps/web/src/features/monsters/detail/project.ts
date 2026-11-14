import type { MonsterPageRecordV1 } from '@mapletip/data/monsters';

import type { BuildId } from '@/config/maplekit';
import { buildRecordDetailPath } from '@/features/detail';

import { UNNAMED_MONSTER_LABEL } from '../browse/project';

/** Identity-level view model for the Monster Detail page skeleton. */
export interface MonsterDetailView {
  readonly publicId: string;
  readonly slug: string;
  readonly name: string;
  readonly buildId: BuildId;
  readonly canonicalPath: string;
}

/**
 * Project one verified MapleKit monster page record into the serializable
 * identity view required by the detail page skeleton.
 */
export function projectMonsterDetail(
  record: MonsterPageRecordV1,
  buildId: BuildId,
): MonsterDetailView {
  const name =
    record.name.state === 'known' ? record.name.value : UNNAMED_MONSTER_LABEL;

  return {
    publicId: record.publicId,
    slug: record.slug,
    name,
    buildId,
    canonicalPath: buildRecordDetailPath(
      'monsters',
      record.slug,
      record.publicId,
      buildId,
    ),
  };
}
