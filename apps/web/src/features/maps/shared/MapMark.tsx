import { Thumbnail } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import classes from './MapMark.module.css';

export interface MapMarkProps {
  readonly src: string;
  /** Edge length in pixels. */
  readonly size: number;
}

/**
 * A map's or area's in-game mark. Mark images carry a transparent margin, so
 * the image is cropped and scaled to fill its box. Decorative: the name
 * beside it says what it marks.
 */
export function MapMark({ src, size }: MapMarkProps): ReactElement {
  return (
    <span className={classes['mark']}>
      <Thumbnail src={src} size={size} alt="" />
    </span>
  );
}
