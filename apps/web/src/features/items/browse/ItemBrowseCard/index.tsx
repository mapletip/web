import type { TableColumn } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import type { ItemTableColumn } from '../columns';
import { ItemIcon } from '../ItemIcon';
import type { ItemRow } from '../project';

import classes from './ItemBrowseCard.module.css';

export interface ItemBrowseCardProps {
  readonly record: ItemRow;
  readonly columns?: readonly TableColumn<ItemRow>[];
}

export function ItemBrowseCard({
  record,
  columns = [],
}: ItemBrowseCardProps): ReactElement {
  const displayName = record.name ?? 'Unnamed item';
  const factColumns = columns.filter((col) => col.accessor !== 'name');

  return (
    <article className={classes['card']}>
      <div className={classes['header']}>
        <ItemIcon icon={record.icon} />
        <div className={classes['headerText']}>
          <h2 className={classes['name']}>{displayName}</h2>
          <span className={classes['sourceId']}>{record.sourceId}</span>
        </div>
      </div>

      {factColumns.length > 0 && (
        <dl className={classes['facts']} aria-label={`${displayName} facts`}>
          {factColumns.map((col) => {
            const itemCol = col as ItemTableColumn;
            const value = itemCol.getValue
              ? itemCol.getValue(record)
              : undefined;
            const content = value ?? 'Not recorded';
            return (
              <div key={col.accessor}>
                <dt>{col.title}</dt>
                <dd>{content}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </article>
  );
}
