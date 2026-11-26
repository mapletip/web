import { describe, expect, it } from 'vitest';

import type { ItemRow } from '../../browse/project';
import { potionsAndFood } from '../potions-and-food';

const row: ItemRow = {
  key: 'tonic',
  sourceId: 'tonic',
  itemClass: 'consume',
  name: 'Practice Tonic',
};

describe('Potions & Food card', () => {
  it.each([
    [{ hp: 300 }, '+300 HP'],
    [{ hpPercent: 35 }, '+35% HP'],
    [{ mp: 120 }, '+120 MP'],
    [{ hp: 300, mp: 120 }, '+300 HP · +120 MP'],
    [{ hpPercent: 35, mpPercent: 20 }, '+35% HP · +20% MP'],
    [{}, undefined],
  ] as const)('formats recovery from published facts', (facts, expected) => {
    expect(potionsAndFood.card.lead({ ...row, ...facts })).toBe(expected);
  });

  it('shows buff effects and duration', () => {
    expect(
      potionsAndFood.card.lead({
        ...row,
        buff: {
          durationSeconds: 600,
          effects: [{ stat: 'weaponAttack', unit: 'flat', value: 10 }],
        },
      }),
    ).toBe('+10 weapon attack · Lasts 10 min');
  });

  it('places a combined recovery item under both pills', () => {
    const field = potionsAndFood.card.queryFields.find(
      (entry) => typeof entry !== 'string' && entry.id === 'recoveryTypes',
    );
    expect(field).toMatchObject({ id: 'recoveryTypes' });
    if (
      typeof field === 'string' ||
      field === undefined ||
      typeof field.accessor !== 'function'
    )
      return;
    expect(
      field.accessor({
        ...row,
        hp: 100,
        mp: 50,
        kind: 'potions-and-food',
        kindPath: ['all', 'use', 'potions-and-food'],
      }),
    ).toEqual(['hp', 'mp']);
  });
});
