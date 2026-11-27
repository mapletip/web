import { formatBuffParts } from '../browse/buff-format';

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
    value: (row) =>
      row.buff?.effects.length
        ? formatBuffParts({ buff: row.buff }).effects
        : undefined,
    lead: (row) =>
      row.buff?.effects.length
        ? formatBuffParts({ buff: row.buff }).duration
        : undefined,
  },
} satisfies ItemKind;
