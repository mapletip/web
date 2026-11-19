import { mapNpcSpriteUrl, type MapPageRecordV1 } from '@mapletip/data/maps';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';
import { nonBlank } from '@/util/nonBlank';

export const UNNAMED_NPC_LABEL = 'Unnamed NPC';

export interface NpcRecordCardView {
  readonly name: string;
  readonly spriteUrl?: string;
}

export type MapPageNpcRecord = MapPageRecordV1['npcs']['items'][number];

/** Project the NPC-owned name and fallback from a MapleKit Map page row. */
export function projectNpcRecordCard(
  record: MapPageNpcRecord,
): NpcRecordCardView {
  const spriteUrl =
    record.sprite.state === 'known'
      ? mapNpcSpriteUrl(MAPLEKIT_RELEASE.baseUrl, record.sprite.value)
      : undefined;
  return {
    name:
      record.name.state === 'known'
        ? (nonBlank(record.name.value) ?? UNNAMED_NPC_LABEL)
        : UNNAMED_NPC_LABEL,
    ...(spriteUrl === undefined ? {} : { spriteUrl }),
  };
}
