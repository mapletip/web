import { VisuallyHidden } from '@mantine/core';
import type { ReactElement } from 'react';

import classes from './cells.module.css';
import type { SampleMonster } from './fixtures';

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
        <VisuallyHidden>Unknown</VisuallyHidden>
      </span>
    );
  }
  return <>{numberFormat.format(value)}</>;
}

/** Domain cell, engine-neutral: sprite (or "?" placeholder), real link, optional trait. */
export function Identity({
  record,
}: {
  readonly record: SampleMonster;
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
  record: SampleMonster,
  id: keyof SampleMonster,
): number | null {
  const value = record[id];
  return typeof value === 'number' ? value : null;
}
