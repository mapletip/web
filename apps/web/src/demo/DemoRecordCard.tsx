import type { ReactElement } from 'react';

import classes from './DemoRecordCard.module.css';
import type { DemoRecord } from './records';

const summaryFields: readonly {
  readonly accessor: keyof DemoRecord;
  readonly label: string;
}[] = [
  { accessor: 'category', label: 'Category' },
  { accessor: 'region', label: 'Region' },
  { accessor: 'rarity', label: 'Rarity' },
  { accessor: 'level', label: 'Level' },
  { accessor: 'attack', label: 'Attack' },
  { accessor: 'tradeable', label: 'Tradeable' },
];

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return 'Unknown';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  return 'Unknown';
}

export function DemoRecordCard({
  record,
}: {
  readonly record: DemoRecord;
}): ReactElement {
  return (
    <article className={classes['card']}>
      <a className={classes['heading']} href={record.href}>
        <span className={classes['identity']}>
          <span className={classes['name']}>{record.name}</span>
          <span className={classes['category']}>{record.category}</span>
        </span>
      </a>
      <dl className={classes['facts']} aria-label={`${record.name} facts`}>
        {summaryFields.map(({ accessor, label }) => {
          const value = record[accessor];
          const displayValue = formatFieldValue(value);
          return (
            <div key={accessor}>
              <dt>{label}</dt>
              <dd title={`${label}: ${displayValue}`}>{displayValue}</dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
