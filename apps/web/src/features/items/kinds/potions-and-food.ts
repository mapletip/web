import type { ItemKind } from './types';

export const potionsAndFood = {
  id: 'potions-and-food',
  group: 'use',
  slug: 'potions-and-food',
  label: 'Potions & Food',
  iconContentId:
    '1cb0671554c0cb6eb6a95aca81a1cc52d11b5853a371741cf790463c0dccccb1',
  matches: (row) =>
    row.itemClass === 'consume' &&
    row.types?.includes('meso-pouch') !== true &&
    (row.types?.includes('potion') === true ||
      row.types?.includes('food-buff') === true),
} satisfies ItemKind;
