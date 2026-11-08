import type { ReactElement } from 'react';

import type { ItemRow } from '../project';

import classes from './ItemBrowseCard.module.css';

export function ItemBrowseCard({
  record,
}: {
  readonly record: ItemRow;
}): ReactElement {
  const displayName = record.name ?? 'Unnamed item';

  return (
    <article className={classes['card']}>
      <h2 className={classes['name']}>{displayName}</h2>
    </article>
  );
}
