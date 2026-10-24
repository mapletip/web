import type { ReactElement } from 'react';

import type { SpikeMonster } from '../ag-grid/fixtures';

import classes from './MonsterTable.module.css';

const numberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

/** Domain cell, engine-neutral: unknown is a visible "—" named "Unknown"; zero stays "0". */
export function StatValue({
  value,
}: {
  readonly value: number | null;
}): ReactElement {
  if (value === null) {
    return (
      <span className={classes['unknown']}>
        <span aria-hidden="true">—</span>
        <span className={classes['srOnly']}>Unknown</span>
      </span>
    );
  }
  return <>{numberFormat.format(value)}</>;
}

/** Domain cell, engine-neutral: sprite (or "?" placeholder), real link, optional trait. */
export function Identity({
  record,
}: {
  readonly record: SpikeMonster;
}): ReactElement {
  return (
    <span className={classes['identity']}>
      {record.sprite ? (
        <img
          className={classes['sprite']}
          src={record.sprite}
          alt=""
          width={28}
          height={28}
        />
      ) : (
        <span className={classes['missingSprite']} aria-hidden="true">
          ?
        </span>
      )}
      <span className={classes['identityText']}>
        <a className={classes['link']} href={record.href}>
          {record.name}
        </a>
        {record.boss ? <span className={classes['trait']}>Boss</span> : null}
      </span>
    </span>
  );
}

export function valueOf(
  record: SpikeMonster,
  id: keyof SpikeMonster,
): number | null {
  const value = record[id];
  return typeof value === 'number' ? value : null;
}
