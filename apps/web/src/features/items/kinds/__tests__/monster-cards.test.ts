import { describe, expect, it } from 'vitest';

import type { ItemRow } from '../../browse/project';
import { monsterCards } from '../monster-cards';

const baseRow: ItemRow = {
  key: 'card',
  sourceId: 'card',
  itemClass: 'consume',
  name: 'Practice Creature Card',
  functions: ['monster-card'],
};

describe('Monster Cards card', () => {
  it('uses the short card layout and formats the buff lead', () => {
    expect(monsterCards.card.layout).toBe('short');
    expect(
      monsterCards.card.lead({
        ...baseRow,
        buff: {
          durationSeconds: 1800,
          effects: [{ stat: 'weaponAttack', unit: 'flat', value: 5 }],
        },
      }),
    ).toBe('+5 weapon attack · Lasts 30 min');
  });

  it('omits the lead when no buff effects are published', () => {
    expect(monsterCards.card.lead(baseRow)).toBeUndefined();
    expect(
      monsterCards.card.lead({
        ...baseRow,
        buff: { durationSeconds: 600, effects: [] },
      }),
    ).toBeUndefined();
  });
});
