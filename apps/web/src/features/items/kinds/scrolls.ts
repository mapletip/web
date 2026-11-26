import type { ItemKind } from './types';

export const scrolls = {
  id: 'scrolls',
  group: 'use',
  slug: 'scrolls',
  label: 'Scrolls',
  iconContentId:
    '3a453e4e40b44d9358f9348abdda896b64ecc046a52e5b07a2388bdbd7dc8601',
  matches: (row) =>
    row.itemClass === 'consume' &&
    row.types?.includes('upgrade-scroll') === true,
} satisfies ItemKind;
