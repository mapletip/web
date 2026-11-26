import type { ItemKind } from './types';

export const chairs = {
  id: 'chairs',
  group: 'setup',
  slug: 'chairs',
  label: 'Chairs',
  iconContentId:
    '15ceb9596a6bdc8f61f8aa1382292f3b428a30281315b83ed0499c5d0492e120',
  matches: (row) =>
    row.itemClass === 'setup' && row.types?.includes('chair') === true,
} satisfies ItemKind;
