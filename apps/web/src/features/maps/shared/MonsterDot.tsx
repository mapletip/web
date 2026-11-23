import type { ReactElement } from 'react';

import classes from './MonsterDot.module.css';

export interface MonsterDotProps {
  readonly className?: string | undefined;
}

/** Non-interactive monster marker shared by map stages and location cards. */
export function MonsterDot({ className }: MonsterDotProps): ReactElement {
  return (
    <span
      className={[classes['dot'], className].filter(Boolean).join(' ')}
      aria-hidden="true"
      data-marker-visual="monster-dot"
    />
  );
}
