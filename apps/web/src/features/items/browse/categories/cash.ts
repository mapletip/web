import type { ItemCategoryScope } from './types';

export const cashScope: ItemCategoryScope = {
  slug: 'cash',
  label: 'Cash',
  itemClasses: ['cash', 'pet'],
  children: [
    {
      kind: 'positive',
      slug: 'pets',
      label: 'Pets',
      matches: (row) => row.itemClass === 'pet',
      iconContentIds: [
        '7cb4e8cd5e402cc35d7bd6d51dafb1800670816463425b50525f091accdde43e', // Pink Bunny
      ],
    },
    {
      kind: 'positive',
      slug: 'cash-items',
      label: 'Cash Items',
      matches: (row) => row.itemClass === 'cash',
      iconContentIds: [
        'e92811536cb6820a65eafaea2452b94161951361e5ed35b16035f0207d8939f0', // Super Megaphone
      ],
    },
  ],
};
