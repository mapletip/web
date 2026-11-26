import type { ItemKind } from './types';

export const pets = {
  id: 'pets',
  group: 'cash',
  slug: 'pets',
  label: 'Pets',
  iconContentId:
    '7cb4e8cd5e402cc35d7bd6d51dafb1800670816463425b50525f091accdde43e',
  matches: (row) => row.itemClass === 'pet',
} satisfies ItemKind;
