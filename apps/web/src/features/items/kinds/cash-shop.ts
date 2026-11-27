import type { ItemKind } from './types';

export const cashShop = {
  id: 'cash-shop',
  group: 'cash',
  slug: 'cash-shop',
  label: 'Cash Shop',
  iconContentId:
    'e92811536cb6820a65eafaea2452b94161951361e5ed35b16035f0207d8939f0',
  matches: (row) => row.itemClass === 'cash',
} satisfies ItemKind;
