import type { ReactElement } from 'react';

import type { ItemFactDescriptor } from '../columns';
import { ItemIcon } from '../ItemIcon';
import type { ItemRow } from '../project';

import classes from './ItemBrowseCard.module.css';

export interface ItemBrowseCardProps {
  readonly record: ItemRow;
  readonly facts?: readonly ItemFactDescriptor[];
}

export function ItemBrowseCard({
  record,
  facts = [],
}: ItemBrowseCardProps): ReactElement {
  const displayName = record.name ?? 'Unnamed item';
  const visibleFacts = facts
    .map((fact) => {
      const value = fact.value(record);
      return value !== undefined
        ? { key: fact.key, title: fact.title, value }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <article className={classes['card']}>
      <div className={classes['header']}>
        <ItemIcon icon={record.icon} />
        <div className={classes['headerText']}>
          <h2 className={classes['name']}>{displayName}</h2>
          <span className={classes['sourceId']}>{record.sourceId}</span>
        </div>
      </div>

      {visibleFacts.length > 0 && (
        <dl className={classes['facts']} aria-label={`${displayName} facts`}>
          {visibleFacts.map((fact) => (
            <div key={fact.key}>
              <dt>{fact.title}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
