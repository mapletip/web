import type { ReactElement } from 'react';

import classes from '@/components/FacetedBrowser/__stories__/FacetedBrowserRecordCard.module.css';
import { formatDemoNumber } from '@/fixtures/records';
import type { DemoRecord } from '@/fixtures/records';

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return 'Unknown';
  if (typeof value === 'number') return formatDemoNumber(value);
  if (typeof value === 'string') return value;
  return 'Unknown';
}

const summaryFields: readonly {
  readonly accessor: keyof DemoRecord;
  readonly label: string;
}[] = [
  { accessor: 'group', label: 'Category' },
  { accessor: 'region', label: 'Region' },
  { accessor: 'value1', label: 'Value 1' },
  { accessor: 'value4', label: 'Value 4' },
  { accessor: 'value10', label: 'Value 10' },
] as const;

export function FacetedBrowserRecordCard({
  record,
}: {
  readonly record: DemoRecord;
}): ReactElement {
  return (
    <article className={classes['card']}>
      <a className={classes['heading']} href={record.href}>
        {record.image ? (
          <img
            className={classes['image']}
            src={record.image}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span
            className={classes['imageFallback']}
            role="img"
            aria-label="Image unavailable"
          >
            N/A
          </span>
        )}
        <span className={classes['identity']}>
          <span className={classes['name']}>{record.name}</span>
          <span className={classes['group']}>{record.group}</span>
        </span>
      </a>
      <dl className={classes['facts']} aria-label={`${record.name} facts`}>
        {summaryFields.map(({ accessor, label }) => {
          const value = record[accessor];
          const displayValue = formatFieldValue(value);
          return (
            <div key={accessor}>
              <dt>{label}</dt>
              <dd
                aria-label={`${label}: ${displayValue}`}
                title={`${label}: ${displayValue}`}
              >
                {value === null ? 'N/A' : displayValue}
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
