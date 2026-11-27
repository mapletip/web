import { formatFullness } from '../browse/fullness';

import { textCard } from './text-card';
import type { ItemKind } from './types';

export const petFood = {
  id: 'pet-food',
  group: 'cash',
  slug: 'pet-food',
  label: 'Pet Food',
  iconContentId:
    '48bbbec3311d822c327cfc030c8d5a2d5f0c726a263356c40c02af0f125aac7c',
  matches: (row) => row.types?.includes('pet-food') === true,
  descriptions: true,
  card: {
    ...textCard(),
    value: (row) => {
      const text = formatFullness({ fullness: row.fullness });
      return text === undefined
        ? undefined
        : [{ id: 'fullness', text, tone: 'accent' }];
    },
  },
} satisfies ItemKind;
