import { Group } from '@mantine/core';
import type { ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';

import { MonsterDropDrawerControl } from '../MonsterDrops';
import { MonsterSprite } from '../MonsterSprite';
import {
  getMonsterBrowseCardFacts,
  MONSTER_BROWSE_FACT_CONFIG,
  renderMonsterBrowseFactIcon,
} from '../monster-browse-fact-config';
import {
  formatMonsterFact,
  type MonsterBrowseRow,
} from '../project';

import classes from './MonsterBrowseCard.module.css';

const trainingFacts = getMonsterBrowseCardFacts('training');
const combatFacts = getMonsterBrowseCardFacts('combat');

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
              {renderMonsterBrowseFactIcon(MONSTER_BROWSE_FACT_CONFIG.level, {
                className: classes['icon'],
                surface: 'card',
              })}
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
  readonly fact: (typeof trainingFacts)[number] | (typeof combatFacts)[number];
}): ReactElement {
  const factId = fact.card.factId;
  const displayValue =
    factId === 'hpRegen' ? '—' : formatMonsterFact(record, factId);
  const accessibleValue =
    factId === 'hpRegen' ? 'Unavailable in the current catalog' : displayValue;

  return (
    <div data-stat={factId}>
      <dt>
        {renderMonsterBrowseFactIcon(fact, {
          className: classes['icon'],
          surface: 'card',
        })}
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
