import type { ItemKind } from './types';

export const summoningSacks = {
  id: 'summoning-sacks',
  group: 'use',
  slug: 'summoning-sacks',
  label: 'Summoning Sacks',
  iconContentId:
    '6c254da1ae5e2f8294a162a86622807c3c45d1bcb123660e17ebdd1739174357',
  matches: (row) =>
    row.itemClass === 'consume' && row.functions?.includes('summon') === true,
} satisfies ItemKind;
