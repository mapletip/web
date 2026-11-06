import type { ReactElement } from 'react';

import {
  formatMonsterFact,
  type MonsterBrowseRow,
  type MonsterFactId,
} from '../project';

import classes from './MonsterBrowseCard.module.css';

const summaryFacts: readonly {
  readonly id: MonsterFactId;
  readonly label: string;
}[] = [
  { id: 'level', label: 'Level' },
  { id: 'hp', label: 'HP' },
  { id: 'exp', label: 'EXP' },
  { id: 'expPer100Hp', label: 'EXP / 100 HP' },
  { id: 'boss', label: 'Boss' },
  { id: 'undead', label: 'Undead' },
  { id: 'bodyAttack', label: 'Body attack' },
];

export function MonsterBrowseCard({
  record,
}: {
  readonly record: MonsterBrowseRow;
}): ReactElement {
  return (
    <article className={classes['card']}>
      <h2 className={classes['name']}>{record.name}</h2>
      <dl className={classes['facts']} aria-label={`${record.name} facts`}>
        {summaryFacts.map(({ id, label }) => {
          const displayValue = formatMonsterFact(record, id);
          return (
            <div key={id}>
              <dt>{label}</dt>
              <dd title={`${label}: ${displayValue}`}>{displayValue}</dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
