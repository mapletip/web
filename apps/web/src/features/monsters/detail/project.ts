import type { MonsterPageRecordV1 } from '@mapletip/data/monsters';

import type { BuildId } from '@/config/maplekit';
import { buildRecordDetailPath } from '@/features/detail';

import {
  formatMonsterNumber,
  getMonsterNonKnownLabel,
  MONSTER_STAT_BY_ID,
  MONSTER_STAT_DEFINITIONS,
  resolveMonsterSpriteUrl,
  UNNAMED_MONSTER_LABEL,
} from '../shared';
import type { MonsterDetailStatId, UnknownFactState } from '../shared';

export interface MonsterDetailStatView {
  readonly id: MonsterDetailStatId;
  readonly label: string;
  readonly explanation: string;
  readonly value: string;
  readonly known: boolean;
}

export interface MonsterElementResponseView {
  readonly code: string;
  readonly element: string;
  readonly response: string;
}

/** Serializable, display-ready view model for the Monster Detail hero. */
export interface MonsterDetailView {
  readonly publicId: string;
  readonly slug: string;
  readonly name: string;
  readonly buildId: BuildId;
  readonly canonicalPath: string;
  readonly boss?: boolean;
  readonly undead?: boolean;
  readonly elements: readonly MonsterElementResponseView[];
  readonly stats: readonly MonsterDetailStatView[];
  readonly spriteUrl?: string;
  readonly spriteWidth?: number;
  readonly spriteHeight?: number;
}

type NumericMonsterFact =
  | { readonly state: 'known'; readonly value: number }
  | { readonly state: UnknownFactState };

const STAT_FACTS: Readonly<
  Record<
    MonsterDetailStatId,
    (record: MonsterPageRecordV1) => NumericMonsterFact
  >
> = {
  level: (record) => record.stats.level,
  hp: (record) => record.stats.hp,
  mp: (record) => record.stats.mp,
  exp: (record) => record.stats.exp,
  physicalAttack: (record) => record.stats.paDamage,
  magicAttack: (record) => record.stats.maDamage,
  physicalDefense: (record) => record.stats.pdDamage,
  magicDefense: (record) => record.stats.mdDamage,
  accuracy: (record) => record.stats.acc,
  avoidability: (record) => record.stats.eva,
  pushed: (record) => record.stats.pushed,
  speed: (record) => record.stats.speed,
};

const ELEMENT_CODE_LABELS: Readonly<Record<string, string>> = {
  D: 'Dark',
  F: 'Fire',
  H: 'Holy',
  I: 'Ice',
  L: 'Lightning',
  P: 'Physical',
  S: 'Poison',
};

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toUpperCase());
}

function projectStat(
  record: MonsterPageRecordV1,
  id: MonsterDetailStatId,
): MonsterDetailStatView {
  const definition = MONSTER_STAT_BY_ID[id];
  const fact = STAT_FACTS[id](record);
  return {
    id,
    label: definition.label,
    explanation: definition.explanation,
    known: fact.state === 'known',
    value:
      fact.state === 'known'
        ? formatMonsterNumber(fact.value)
        : getMonsterNonKnownLabel(fact.state),
  };
}

function projectElements(
  record: MonsterPageRecordV1,
): readonly MonsterElementResponseView[] {
  if (
    record.elements.state !== 'known' &&
    record.elements.state !== 'partial'
  ) {
    return [];
  }

  return record.elements.items.flatMap((entry) => {
    if (entry.resistance.state !== 'known') return [];
    return [
      {
        code: entry.code,
        element:
          entry.meaning.state === 'known'
            ? titleCase(entry.meaning.value)
            : (ELEMENT_CODE_LABELS[entry.code] ?? entry.code),
        response: titleCase(entry.resistance.value),
      },
    ];
  });
}

function positiveDimension(
  value: number | null | undefined,
): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

/**
 * Project a verified MapleKit Monster page record into the serializable hero
 * view. Non-known facts keep the same wording as Monster Browse.
 */
export function projectMonsterDetail(
  record: MonsterPageRecordV1,
  buildId: BuildId,
): MonsterDetailView {
  const name =
    record.name.state === 'known' ? record.name.value : UNNAMED_MONSTER_LABEL;
  const spriteUrl =
    record.sprite.contentId.state === 'known'
      ? resolveMonsterSpriteUrl(record.sprite.contentId.value)
      : undefined;
  const spriteWidth = positiveDimension(record.sprite.width);
  const spriteHeight = positiveDimension(record.sprite.height);

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
    ...(record.boss.state === 'known' ? { boss: record.boss.value } : {}),
    ...(record.undead.state === 'known' ? { undead: record.undead.value } : {}),
    elements: projectElements(record),
    stats: MONSTER_STAT_DEFINITIONS.map(({ id }) => projectStat(record, id)),
    ...(spriteUrl === undefined ? {} : { spriteUrl }),
    ...(spriteWidth === undefined ? {} : { spriteWidth }),
    ...(spriteHeight === undefined ? {} : { spriteHeight }),
  };
}
