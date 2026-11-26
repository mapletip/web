import type { ItemKind } from './types';

export const otherUse = {
  id: 'other-use',
  group: 'use',
  slug: 'other-use',
  label: 'Other Use',
  iconContentId:
    '45f5193907b528c8221c6267724b4dd71cd4d9cef11b11c99d6c2975ad26d45f',
  matches: (row) => row.itemClass === 'consume',
} satisfies ItemKind;
