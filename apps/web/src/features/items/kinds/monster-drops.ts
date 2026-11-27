import type { ItemKind } from './types';

export const monsterDrops = {
  id: 'monster-drops',
  group: 'etc',
  slug: 'monster-drops',
  label: 'Monster Drops',
  iconContentId:
    '752e1848b26d249f7728fa2b290b6077872e79dea71db2d18aea20c8605889e5',
  matches: (row) =>
    row.itemClass === 'etc' && row.types?.includes('monster-material') === true,
} satisfies ItemKind;
