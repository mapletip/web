import type { MapPageRecordV1 } from '@mapletip/data/maps';

import { nonBlank } from '@/util/nonBlank';

export const UNNAMED_NPC_LABEL = 'Unnamed NPC';

export interface NpcRecordCardView {
  readonly name: string;
}

export type MapPageNpcRecord = MapPageRecordV1['npcs']['items'][number];

/** Project the NPC-owned name and fallback from a MapleKit Map page row. */
export function projectNpcRecordCard(
  record: MapPageNpcRecord,
): NpcRecordCardView {
  return {
    name:
      record.name.state === 'known'
        ? (nonBlank(record.name.value) ?? UNNAMED_NPC_LABEL)
        : UNNAMED_NPC_LABEL,
  };
}
