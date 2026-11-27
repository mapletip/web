import type { ItemKind } from './types';

export const ornaments = {
  id: 'ornaments',
  group: 'setup',
  slug: 'ornaments',
  label: 'Ornaments',
  iconContentId:
    '96287ff70fcacc9d152b5e2382d3c7c274cbac08230d0c879c6d760dd8bbb5a8',
  matches: (row) =>
    row.itemClass === 'setup' &&
    row.types?.includes('holiday-ornament') === true,
} satisfies ItemKind;
