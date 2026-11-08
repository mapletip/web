import { Image } from '@mantine/core';
import type { ReactElement } from 'react';

import classes from '@/components/Thumbnail/Thumbnail.module.css';
import type { ThumbnailProps } from '@/components/Thumbnail/types';

const fallbackSrc =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E';

export function Thumbnail({
  src,
  size,
  alt = '',
}: ThumbnailProps): ReactElement {
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
