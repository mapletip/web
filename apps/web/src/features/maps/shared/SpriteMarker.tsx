import type { ReactElement } from 'react';

import classes from './SpriteMarker.module.css';

export interface SpriteMarkerProps {
  readonly spriteUrl: string;
  readonly visual: 'monster-sprite' | 'npc-sprite';
  readonly className?: string | undefined;
}

/** Pixelated sprite image used by map markers across map views. */
export function SpriteMarker({
  spriteUrl,
  visual,
  className,
}: SpriteMarkerProps): ReactElement {
  return (
    <img
      className={[classes['sprite'], className].filter(Boolean).join(' ')}
      src={spriteUrl}
      alt=""
      data-marker-visual={visual}
    />
  );
}
