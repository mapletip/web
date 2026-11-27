import { Image } from '@mantine/core';
import type { CSSProperties, ReactElement } from 'react';

import classes from '@/components/Thumbnail/Thumbnail.module.css';
import type { ThumbnailProps } from '@/components/Thumbnail/types';

const fallbackSrc =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E';

export function Thumbnail({
  src,
  size,
  magnify,
  alt = '',
}: ThumbnailProps): ReactElement {
  if (magnify !== undefined) {
    const style = {
      '--thumbnail-size': `${size}px`,
      '--thumbnail-inner-size': `${size / magnify}px`,
      '--thumbnail-magnify': magnify,
    } as CSSProperties;

    return (
      <span className={classes['magnifiedBox']} style={style}>
        <Image
          className={`${classes['thumbnail']} ${classes['magnifiedImage']}`}
          src={src}
          fallbackSrc={fallbackSrc}
          fit="scale-down"
          loading="lazy"
          alt={alt}
        />
      </span>
    );
  }

  return (
    <Image
      className={classes['thumbnail']}
      src={src}
      fallbackSrc={fallbackSrc}
      w={size}
      h={size}
      fit="scale-down"
      loading="lazy"
      alt={alt}
    />
  );
}
