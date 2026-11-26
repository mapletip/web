import { formatBuff } from '../browse/buff-format';

import type { ItemKind } from './types';

export const monsterCards = {
  id: 'monster-cards',
  group: 'use',
  slug: 'monster-cards',
  label: 'Monster Cards',
  iconContentId:
    'a8ecbc24e9b7659ec44e8281bd630a7280a35580d5aac3e0ada70ab6718b1735',
  matches: (row) =>
    row.itemClass === 'consume' &&
    row.functions?.includes('monster-card') === true,
  card: {
    layout: 'short',
    lead: (row) =>
      row.buff?.effects.length ? formatBuff({ buff: row.buff }) : undefined,
  },
} satisfies ItemKind;
