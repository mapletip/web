import type { MapPageRecordV1 } from '@mapletip/data/maps';

import type { BuildId } from '@/config/maplekit';
import { buildRecordDetailPath, nonBlank } from '@/features/detail';

import { monsterDetailLinkProps } from './address';
import { formatMonsterNumber } from './monster-data';
import { resolveMonsterSpriteUrl } from './sprite';

export interface MonsterRecordCardView {
  readonly key: string;
  readonly name: string;
  readonly level?: number;
  readonly spriteUrl?: string;
  readonly bossLabel?: 'Boss';
  readonly levelLabel?: string;
  readonly destination?: NonNullable<
    ReturnType<typeof monsterDetailLinkProps>
  > & { readonly href: string };
}

export type MapPageMonsterRecord = MapPageRecordV1['monsters']['items'][number];

const UNNAMED_MONSTER_CARD_LABEL = 'Monster name unavailable';

/** Project the Monster-owned identity shown wherever a Map page lists it. */
export function projectMonsterRecordCard(
  record: MapPageMonsterRecord,
  { buildId }: { readonly buildId: BuildId },
): MonsterRecordCardView {
  const name =
    record.name.state === 'known'
      ? (nonBlank(record.name.value) ?? UNNAMED_MONSTER_CARD_LABEL)
      : UNNAMED_MONSTER_CARD_LABEL;
  const spriteUrl =
    record.sprite.contentId.state === 'known'
      ? resolveMonsterSpriteUrl(record.sprite.contentId.value)
      : undefined;
  const level = record.level.state === 'known' ? record.level.value : undefined;
  const destination = monsterDetailLinkProps(record, buildId);

  return {
    key: record.key,
    name,
    ...(level === undefined ? {} : { level }),
    ...(spriteUrl === undefined ? {} : { spriteUrl }),
    ...(record.boss.state === 'known' && record.boss.value
      ? { bossLabel: 'Boss' as const }
      : {}),
    ...(level === undefined
      ? {}
      : { levelLabel: `Lv ${formatMonsterNumber(level)}` }),
    ...(destination === undefined
      ? {}
      : {
          destination: {
            ...destination,
            href: buildRecordDetailPath(
              'monsters',
              record.slug,
              record.publicId,
              buildId,
            ),
          },
        }),
  };
}

/** Project only the Monster-owned respawn label for a host relationship slot. */
export function projectMonsterRespawnLabel(
  respawn: MapPageMonsterRecord['respawn'],
): string | undefined {
  switch (respawn.kind) {
    case 'ordinary':
      return undefined;
    case 'none':
      return 'No respawn';
    case 'delayed':
      return respawn.seconds % 60 === 0
        ? `Respawns after ${formatMonsterNumber(respawn.seconds / 60)} min`
        : `Respawns after ${formatMonsterNumber(respawn.seconds)} sec`;
    case 'mixed':
      return 'Mixed respawn';
  }
}
