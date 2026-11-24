import { mapNpcSpriteUrl, type StaticMapPageRecord } from '@mapletip/data/maps';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';
import { nonBlank } from '@/util/nonBlank';

export const UNNAMED_NPC_LABEL = 'Unnamed NPC';

export interface NpcRecordCardView {
  readonly name: string;
  readonly spriteUrl?: string;
  readonly questCountLabel?: string;
}

export type MapPageNpcRecord = StaticMapPageRecord['npcs']['items'][number];

/** Project the NPC-owned name and fallback from a MapleKit Map page row. */
export function projectNpcRecordCard(
  record: MapPageNpcRecord,
): NpcRecordCardView {
  // Map page 1.2 wraps the content id with the sprite's dimensions.
  const sprite =
    'contentId' in record.sprite ? record.sprite.contentId : record.sprite;
  const spriteUrl =
    sprite.state === 'known'
      ? mapNpcSpriteUrl(MAPLEKIT_RELEASE.baseUrl, sprite.value)
      : undefined;
  const questCount = 'questCount' in record ? record.questCount : undefined;
  const questCountLabel =
    questCount === undefined ||
    questCount.state === 'unknown' ||
    questCount.count === 0
      ? undefined
      : `${questCount.count.toLocaleString('en-US')}${questCount.state === 'partial' ? '+' : ''} ${questCount.state === 'known' && questCount.count === 1 ? 'quest' : 'quests'}`;

  return {
    name:
      record.name.state === 'known'
        ? (nonBlank(record.name.value) ?? UNNAMED_NPC_LABEL)
        : UNNAMED_NPC_LABEL,
    ...(spriteUrl === undefined ? {} : { spriteUrl }),
    ...(questCountLabel === undefined ? {} : { questCountLabel }),
  };
}
