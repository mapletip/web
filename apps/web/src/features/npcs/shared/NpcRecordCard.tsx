import { RecordCard, Thumbnail } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import type { NpcRecordCardView } from './npcRecordCardProjection';

export const NPC_RECORD_CARD_DENSITY = { base: 1, sm: 3, md: 4 } as const;

/** NPC-owned compact identity card. */
export function NpcRecordCard({
  npc,
}: {
  readonly npc: NpcRecordCardView;
}): ReactElement {
  return (
    <RecordCard
      layout="compactMediaAside"
      title={npc.name}
      media={<Thumbnail src={npc.spriteUrl} size={64} alt="" />}
      secondaryLine={npc.questCountLabel}
    />
  );
}
