import type { ItemKind } from './types';

export const questItems = {
  id: 'quest-items',
  group: 'etc',
  slug: 'quest-items',
  label: 'Quest Items',
  iconContentId:
    '63df4ceb3580419b2ae1db57f001573eac4fe068edfe5aeea17c4ce734de0f7a',
  matches: (row) => row.itemClass === 'etc' && row.questFlag === true,
} satisfies ItemKind;
