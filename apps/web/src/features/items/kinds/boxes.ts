import type { ItemKind } from './types';

export const boxes = {
  id: 'boxes',
  group: 'use',
  slug: 'boxes',
  label: 'Boxes',
  iconContentId:
    'cc78d2418978f78394df682664352ee29cb05c6eab276916eea5bb829fe4a595',
  matches: (row) =>
    row.itemClass === 'consume' &&
    row.functions?.includes('reward-container') === true,
} satisfies ItemKind;
