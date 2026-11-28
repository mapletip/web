import { describe, expect, it } from 'vitest';

import type { ItemRow } from '../../browse/project';
import { arrows, bullets, throwingStars } from '../projectiles';

const row: ItemRow = {
  key: 'projectile',
  sourceId: 'projectile',
  itemClass: 'consume',
  name: 'Practice Projectile',
};

const categories = [throwingStars, arrows, bullets];

describe('projectile categories', () => {
  it.each([
    [throwingStars, 'throwing-star', 'Thieves'],
    [arrows, 'arrow', 'Bowmen'],
    [bullets, 'bullet', 'Pirates'],
  ] as const)(
    'assigns only its published type and describes its class',
    (category, type, className) => {
      expect(category.matches({ ...row, types: [type] })).toBe(true);
      expect(category.description).toContain(className);
      for (const other of categories.filter((entry) => entry !== category)) {
        expect(other.matches({ ...row, types: [type] })).toBe(false);
      }
      expect(category.card).toBe(throwingStars.card);
    },
  );

  it('keeps attack, stack size, and attack sorts in the shared card', () => {
    expect(throwingStars.card.value({ ...row, attack: 27 })).toEqual([
      { id: 'attack', text: '+27 attack', tone: 'accent' },
    ]);
    expect(throwingStars.card.lead({ ...row, maxStack: 2000 })).toBe(
      '2,000 per stack',
    );
    expect(throwingStars.card.sortOptions).toEqual([
      { label: 'Attack (high to low)', field: 'attack', direction: 'desc' },
      { label: 'Attack (low to high)', field: 'attack', direction: 'asc' },
    ]);
    expect(throwingStars.card).not.toHaveProperty('facets');
  });
});
