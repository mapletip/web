import { Image } from '@mantine/core';
import { itemIconUrl } from '@mapletip/data/items';
import type { ReactElement } from 'react';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import classes from './ItemIcon.module.css';

/**
 * Neutral local placeholder SVG data URI for items without an icon or during image load failure.
 * Styled to fit a 32x32 pixel box without network requests.
 */
export const ITEM_ICON_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='4' fill='%2325262b'/%3E%3Cpath d='M10 10h12v12H10z' fill='%23373a40'/%3E%3C/svg%3E";

export interface ItemIconProps {
  readonly icon?: string | undefined;
}

export function ItemIcon({ icon }: ItemIconProps): ReactElement {
  const src = icon
    ? itemIconUrl(MAPLEKIT_RELEASE.baseUrl, icon)
    : ITEM_ICON_PLACEHOLDER;

  return (
    <div className={classes['box']}>
      <Image
        src={src}
        fallbackSrc={ITEM_ICON_PLACEHOLDER}
        alt=""
        loading="lazy"
        w={32}
        h={32}
        fit="contain"
        className={classes['icon']}
      />
    </div>
  );
}
