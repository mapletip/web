import { Group } from '@mantine/core';
import type { ReactElement } from 'react';
import {
  ArrowsLeftRight,
  Calculator,
  Heart,
  Heartbeat,
  PersonSimpleRun,
  Shield,
  ShieldStar,
  Sparkle,
  Sword,
  Target,
  TrendUp,
  Wind,
} from '@phosphor-icons/react';

import type { BuildId } from '@/config/maplekit';

import { MonsterDropDrawerControl } from '../MonsterDrops';
import { MonsterSprite } from '../MonsterSprite';
import {
  formatMonsterFact,
  type MonsterBrowseRow,
  type MonsterFactId,
} from '../project';

import classes from './MonsterBrowseCard.module.css';

type MonsterCardFactId = MonsterFactId | 'hpRegen';

const trainingFacts: readonly {
  readonly id: MonsterFactId;
  readonly label: string;
  readonly icon: typeof Heart;
  readonly size: 14 | 15 | 16;
  readonly tone?: 'hp' | 'experience';
}[] = [
  { id: 'hp', label: 'HP', icon: Heart, size: 16, tone: 'hp' },
  { id: 'exp', label: 'EXP', icon: TrendUp, size: 15, tone: 'experience' },
  {
    id: 'expPer100Hp',
    label: 'EXP / 100 HP',
    icon: Calculator,
    size: 14,
    tone: 'experience',
  },
];

const combatFacts: readonly {
  readonly id: MonsterCardFactId;
  readonly label: string;
  readonly icon: typeof Heart;
  readonly size: 14 | 15 | 16;
}[] = [
  { id: 'physicalAttack', label: 'W. ATT', icon: Sword, size: 16 },
  { id: 'magicAttack', label: 'M. ATT', icon: Sparkle, size: 16 },
  { id: 'accuracy', label: 'ACC', icon: Target, size: 16 },
  { id: 'physicalDefense', label: 'W. DEF', icon: Shield, size: 16 },
  { id: 'magicDefense', label: 'M. DEF', icon: ShieldStar, size: 16 },
  { id: 'avoidability', label: 'AVOID', icon: Wind, size: 16 },
  { id: 'pushed', label: 'Knockback', icon: ArrowsLeftRight, size: 14 },
  { id: 'speed', label: 'Speed', icon: PersonSimpleRun, size: 14 },
  // The current Monster catalog has no HP Regen field. Keep production's
  // stat order and show an explicit unavailable marker in this slot.
  { id: 'hpRegen', label: 'HP Regen', icon: Heartbeat, size: 14 },
];

export function MonsterBrowseCard({
  record,
  buildId,
}: {
  readonly record: MonsterBrowseRow;
  readonly buildId: BuildId;
}): ReactElement {
  return (
    <article className={classes['card']}>
      <Group gap="xs" wrap="nowrap" align="flex-start">
        <div className={classes['identity']}>
          <MonsterSprite sprite={record.sprite} />
          <div className={classes['title']}>
            <h2 className={classes['name']}>{record.name}</h2>
            <span className={classes['level']}>
              Lv. {formatMonsterFact(record, 'level')}
            </span>
          </div>
        </div>
        <MonsterDropDrawerControl record={record} buildId={buildId} />
      </Group>
      <div className={classes['stats']}>
        <dl className={classes['facts']} aria-label="Training facts">
          {trainingFacts.map((fact) => (
            <MonsterFact key={fact.id} record={record} fact={fact} />
          ))}
        </dl>
        <div className={classes['divider']} aria-hidden="true" />
        <dl className={classes['facts']} aria-label="Combat facts">
          {combatFacts.map((fact) => (
            <MonsterFact key={fact.id} record={record} fact={fact} />
          ))}
        </dl>
      </div>
    </article>
  );
}

function MonsterFact({
  record,
  fact,
}: {
  readonly record: MonsterBrowseRow;
  readonly fact: {
    readonly id: MonsterCardFactId;
    readonly label: string;
    readonly icon: typeof Heart;
    readonly size: 14 | 15 | 16;
    readonly tone?: 'hp' | 'experience';
  };
}): ReactElement {
  const displayValue =
    fact.id === 'hpRegen' ? '—' : formatMonsterFact(record, fact.id);
  const accessibleValue =
    fact.id === 'hpRegen' ? 'Unavailable in the current catalog' : displayValue;
  const Icon = fact.icon;

  return (
    <div data-stat={fact.id}>
      <dt>
        <Icon
          aria-hidden="true"
          size={fact.size}
          className={
            fact.tone === 'hp'
              ? classes['hpIcon']
              : fact.tone === 'experience'
                ? classes['experienceIcon']
                : classes['icon']
          }
        />
        {fact.label}
      </dt>
      <dd
        aria-label={`${fact.label}: ${accessibleValue}`}
        title={`${fact.label}: ${accessibleValue}`}
      >
        {displayValue}
      </dd>
    </div>
  );
}
