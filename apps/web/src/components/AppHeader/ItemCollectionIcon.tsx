import { itemIconUrl } from '@mapletip/data/items';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import classes from './ItemCollectionIcon.module.css';

/**
 * Iconic items representing the four non-equipment inventory tabs:
 * 1. Top-left:     Roger's Apple (Use)
 * 2. Top-right:    Orange Mushroom Cap (ETC)
 * 3. Bottom-left:  The Green Relaxer (Set-up)
 * 4. Bottom-right: Gachapon Ticket (Cash)
 */
export const ALL_ITEMS_COLLECTION_ICONS = [
  {
    tab: 'use',
    contentId:
      '929926f4f77052221724ca39e8ab5324dfb736b10436e880d022019a94986d10',
  },
  {
    tab: 'etc',
    contentId:
      '752e1848b26d249f7728fa2b290b6077872e79dea71db2d18aea20c8605889e5',
  },
  {
    tab: 'setup',
    contentId:
      'e9a7ddb80bdcf7289cd3c4e2320d44d09e968b6e38c3ff65e01465ba49415e66',
  },
  {
    tab: 'cash',
    contentId:
      'ed4c3fdc0a6fecc0125f921444ce69588e3d8ebb93fb17bc5cf9fd1278b4af0a',
  },
] as const;

export interface ItemCollectionIconProps {
  readonly className?: string;
}

export function ItemCollectionIcon({
  className,
}: ItemCollectionIconProps = {}) {
  const rootClassName = className
    ? `${classes['collectionIcon']} ${className}`
    : classes['collectionIcon'];

  return (
    <span className={rootClassName} aria-hidden="true">
      {ALL_ITEMS_COLLECTION_ICONS.map(({ tab, contentId }) => (
        <img
          key={tab}
          className={classes['sprite']}
          src={itemIconUrl(MAPLEKIT_RELEASE.baseUrl, contentId)}
          alt=""
          width={15}
          height={15}
          decoding="async"
        />
      ))}
    </span>
  );
}
