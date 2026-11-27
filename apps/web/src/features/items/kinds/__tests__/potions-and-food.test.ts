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
    [{ hp: 300 }, [{ id: 'hp', text: '+300 HP', tone: 'warm' }]],
    [{ hpPercent: 35 }, [{ id: 'hp-percent', text: '+35% HP', tone: 'warm' }]],
    [{ mp: 120 }, [{ id: 'mp', text: '+120 MP', tone: 'cool' }]],
    [
      { hp: 300, mp: 120 },
      [
        { id: 'hp', text: '+300 HP', tone: 'warm' },
        { id: 'mp', text: '+120 MP', tone: 'cool' },
      ],
    ],
    [
      { hpPercent: 35, mpPercent: 20 },
      [
        { id: 'hp-percent', text: '+35% HP', tone: 'warm' },
        { id: 'mp-percent', text: '+20% MP', tone: 'cool' },
      ],
    ],
    [
      { hp: 300, hpPercent: 10 },
      [
        { id: 'hp', text: '+300 HP', tone: 'warm' },
        { id: 'hp-percent', text: '+10% HP', tone: 'warm' },
      ],
    ],
    [{}, undefined],
  ] as const)(
    'formats recovery headline parts and tones from published facts',
    (facts, expected) => {
      expect(potionsAndFood.card.value({ ...row, ...facts })).toEqual(expected);
      expect(potionsAndFood.card.lead({ ...row, ...facts })).toBeUndefined();
    },
  );

  it('formats buff effects with penalty tone and true minus sign, and spells out duration in the quiet line', () => {
    const buffRow: ItemRow = {
      ...row,
      buff: {
        durationSeconds: 300,
        effects: [
          { stat: 'weaponAttack', unit: 'flat', value: 15 },
          { stat: 'accuracy', unit: 'flat', value: -5 },
        ],
      },
    };
    expect(potionsAndFood.card.value(buffRow)).toEqual([
      { id: 'weaponAttack-flat-0', text: '+15 weapon attack', tone: 'accent' },
      { id: 'accuracy-flat-1', text: '−5 accuracy', tone: 'critical' },
    ]);
    expect(potionsAndFood.card.lead(buffRow)).toBe('Lasts 5 minutes');
  });

  it.each([
    [30, 'Lasts 30 seconds'],
    [1, 'Lasts 1 second'],
    [60, 'Lasts 1 minute'],
    [90, 'Lasts 1 minute 30 seconds'],
    [600, 'Lasts 10 minutes'],
    [undefined, undefined],
  ] as const)(
    'spells out buff duration %s as %s',
    (durationSeconds, expected) => {
      expect(
        potionsAndFood.card.lead({
          ...row,
          buff: {
            ...(durationSeconds === undefined ? {} : { durationSeconds }),
            effects: [{ stat: 'speed', unit: 'flat', value: 10 }],
          },
        }),
      ).toBe(expected);
    },
  );

  it('places a combined recovery item under both pills', () => {
    const field = potionsAndFood.card
      .queryFields()
      .find(
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
