import type { ItemKind } from './types';

export const skillBooks = {
  id: 'skill-books',
  group: 'use',
  slug: 'skill-books',
  label: 'Skill Books',
  iconContentId:
    '147e22281aa79e799cb16f38bcf9685bede7679e0132fde589b6d8e24185e10b',
  matches: (row) =>
    row.itemClass === 'consume' && row.functions?.includes('skill') === true,
} satisfies ItemKind;
