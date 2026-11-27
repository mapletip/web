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
  it('uses the short card layout and splits buff parts and spelled-out duration', () => {
    expect(monsterCards.card.layout).toBe('short');
    const buffRow: ItemRow = {
      ...baseRow,
      buff: {
        durationSeconds: 1800,
        effects: [
          { stat: 'weaponAttack', unit: 'flat', value: 5 },
          { stat: 'accuracy', unit: 'flat', value: -2 },
        ],
      },
    };
    expect(monsterCards.card.value(buffRow)).toEqual([
      { id: 'weaponAttack-flat-0', text: '+5 weapon attack', tone: 'accent' },
      { id: 'accuracy-flat-1', text: '−2 accuracy', tone: 'critical' },
    ]);
    expect(monsterCards.card.lead(buffRow)).toBe('Lasts 30 minutes');
  });

  it('omits the headline and quiet line when no buff effects are published', () => {
    expect(monsterCards.card.value(baseRow)).toBeUndefined();
    expect(monsterCards.card.lead(baseRow)).toBeUndefined();
    const emptyBuff = {
      ...baseRow,
      buff: { durationSeconds: 600, effects: [] },
    };
    expect(monsterCards.card.value(emptyBuff)).toBeUndefined();
    expect(monsterCards.card.lead(emptyBuff)).toBeUndefined();
  });
});
