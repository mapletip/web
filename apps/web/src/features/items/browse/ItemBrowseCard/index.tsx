import { Thumbnail } from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';
import type { ReactElement } from 'react';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import type { ItemFactDescriptor } from '../columns';
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
  const iconSrc = record.icon
    ? itemIconUrl(MAPLEKIT_RELEASE.baseUrl, record.icon)
    : undefined;
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
        <Thumbnail src={iconSrc} size={32} />
        <div className={classes['headerText']}>
          <h2 className={classes['name']}>{displayName}</h2>
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
