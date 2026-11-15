import {
  ArrowsLeftRight,
  Drop,
  Heart,
  Medal,
  PersonSimpleRun,
  Shield,
  ShieldStar,
  Sparkle,
  Sword,
  Target,
  TrendUp,
  Wind,
} from '@phosphor-icons/react';

export type MonsterFactState = 'known' | 'unknown' | 'absent' | 'unsupported';
export type UnknownFactState = Exclude<MonsterFactState, 'known'>;

/** Monster facts currently projected by Monster Browse. */
export type MonsterFactId =
  | 'name'
  | 'level'
  | 'hp'
  | 'mp'
  | 'hpRecovery'
  | 'mpRecovery'
  | 'exp'
  | 'expPer100Hp'
  | 'physicalAttack'
  | 'physicalDefense'
  | 'magicAttack'
  | 'magicDefense'
  | 'accuracy'
  | 'avoidability'
  | 'pushed'
  | 'speed'
  | 'boss'
  | 'undead'
  | 'bodyAttack';

export const UNNAMED_MONSTER_LABEL = 'Unnamed monster';

const NON_KNOWN_FACT_LABELS: Readonly<Record<UnknownFactState, string>> = {
  unknown: 'Unknown',
  absent: '-',
  unsupported: 'Unavailable',
};

export function getMonsterNonKnownLabel(state: UnknownFactState): string {
  return NON_KNOWN_FACT_LABELS[state];
}

const MONSTER_NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
const MONSTER_RATIO_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

/** Whole-number Monster facts use a fixed locale for identical SSR and hydration. */
export function formatMonsterNumber(value: number): string {
  return MONSTER_NUMBER_FORMATTER.format(value);
}

/** Avoid showing a positive training ratio as zero when it is below precision. */
function formatMonsterRatio(value: number): string {
  if (value === 0) return '0';
  if (value > 0 && value < 0.01) return '<0.01';
  return MONSTER_RATIO_FORMATTER.format(value);
}

export interface MonsterFactRow {
  readonly [key: string]: unknown;
  readonly factStates: Readonly<
    Partial<Record<MonsterFactId, UnknownFactState>>
  >;
}

/** Shared honest display formatting for Monster Browse and Monster Detail. */
export function formatMonsterFact(
  row: MonsterFactRow,
  factId: MonsterFactId,
): string {
  const value = row[factId];
  if (typeof value === 'number') {
    return factId === 'expPer100Hp'
      ? formatMonsterRatio(value)
      : formatMonsterNumber(value);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') return value;

  if (factId === 'expPer100Hp') return '-';

  const state = row.factStates[factId];
  return getMonsterNonKnownLabel(state ?? 'unknown');
}

export type MonsterDetailStatId =
  | 'level'
  | 'hp'
  | 'mp'
  | 'exp'
  | 'physicalAttack'
  | 'magicAttack'
  | 'physicalDefense'
  | 'magicDefense'
  | 'accuracy'
  | 'avoidability'
  | 'pushed'
  | 'speed';

type MonsterStatIcon = typeof Medal;

export interface MonsterStatDefinition {
  readonly id: MonsterDetailStatId;
  readonly label: string;
  /** Compact vocabulary retained by the Monster Browse table and cards. */
  readonly browseLabel: string;
  readonly explanation: string;
  readonly icon: MonsterStatIcon;
  readonly iconSize: 14 | 15 | 16;
  readonly iconColor?: string;
}

/** One shared source for Detail labels, explanations and Browse stat icons. */
export const MONSTER_STAT_DEFINITIONS = [
  {
    id: 'level',
    label: 'Level',
    browseLabel: 'Level',
    explanation: 'The monster level.',
    icon: Medal,
    iconSize: 16,
  },
  {
    id: 'hp',
    label: 'HP',
    browseLabel: 'HP',
    explanation: 'The monster’s health points.',
    icon: Heart,
    iconSize: 16,
    iconColor: '#f28f91',
  },
  {
    id: 'mp',
    label: 'MP',
    browseLabel: 'MP',
    explanation: 'The monster’s magic points.',
    icon: Drop,
    iconSize: 16,
  },
  {
    id: 'exp',
    label: 'EXP',
    browseLabel: 'EXP',
    explanation: 'Experience awarded when the monster is defeated.',
    icon: TrendUp,
    iconSize: 15,
    iconColor: '#f5bd56',
  },
  {
    id: 'physicalAttack',
    label: 'Weapon attack',
    browseLabel: 'W. ATT',
    explanation: 'Damage dealt by the monster’s physical attacks.',
    icon: Sword,
    iconSize: 16,
  },
  {
    id: 'magicAttack',
    label: 'Magic attack',
    browseLabel: 'M. ATT',
    explanation: 'Damage dealt by the monster’s magical attacks.',
    icon: Sparkle,
    iconSize: 16,
  },
  {
    id: 'physicalDefense',
    label: 'Weapon defense',
    browseLabel: 'W. DEF',
    explanation: 'The monster’s defense against physical attacks.',
    icon: Shield,
    iconSize: 16,
  },
  {
    id: 'magicDefense',
    label: 'Magic defense',
    browseLabel: 'M. DEF',
    explanation: 'The monster’s defense against magical attacks.',
    icon: ShieldStar,
    iconSize: 16,
  },
  {
    id: 'accuracy',
    label: 'Accuracy',
    browseLabel: 'ACC',
    explanation: 'The monster’s accuracy when attacking.',
    icon: Target,
    iconSize: 16,
  },
  {
    id: 'avoidability',
    label: 'Avoidability',
    browseLabel: 'AVOID',
    explanation: 'The monster’s chance to avoid an attack.',
    icon: Wind,
    iconSize: 16,
  },
  {
    id: 'pushed',
    label: 'Knockback',
    browseLabel: 'Knockback',
    explanation: 'The damage threshold at which the monster is knocked back.',
    icon: ArrowsLeftRight,
    iconSize: 14,
  },
  {
    id: 'speed',
    label: 'Speed',
    browseLabel: 'Speed',
    explanation: 'The monster’s movement speed.',
    icon: PersonSimpleRun,
    iconSize: 14,
  },
] as const satisfies readonly MonsterStatDefinition[];

export const MONSTER_STAT_BY_ID: Readonly<
  Record<MonsterDetailStatId, MonsterStatDefinition>
> = Object.fromEntries(
  MONSTER_STAT_DEFINITIONS.map((definition) => [definition.id, definition]),
) as Record<MonsterDetailStatId, MonsterStatDefinition>;
