import { numberFormat } from '../browse/number-format';

import type { ItemKind } from './types';

const projectileCard = {
  layout: 'short',
  value: (row) =>
    row.attack === undefined
      ? undefined
      : [
          {
            id: 'attack',
            text: `+${numberFormat.format(row.attack)} attack`,
            tone: 'accent',
          },
        ],
  lead: (row) =>
    row.maxStack === undefined
      ? undefined
      : `${numberFormat.format(row.maxStack)} per stack`,
  queryFields: () => [{ id: 'attack', accessor: 'attack' }],
  sortOptions: [
    { label: 'Attack (high to low)', field: 'attack', direction: 'desc' },
    { label: 'Attack (low to high)', field: 'attack', direction: 'asc' },
  ],
} satisfies NonNullable<ItemKind['card']>;

export const throwingStars = {
  id: 'throwing-star',
  group: 'use',
  slug: 'throwing-stars',
  label: 'Throwing Stars',
  description: 'Used by Thieves with a claw.',
  iconContentId:
    'f77172ea2f08e2e8586c8d2a208c3614cbf112a09796609f9b4fc5c8affb5e0e',
  matches: (row) =>
    row.itemClass === 'consume' &&
    row.types?.includes('throwing-star') === true,
  card: projectileCard,
} satisfies ItemKind;

export const arrows = {
  id: 'arrow',
  group: 'use',
  slug: 'arrows',
  label: 'Arrows',
  description: 'Used by Bowmen. Bows and crossbows each take their own arrows.',
  iconContentId:
    '752f72ebcb3fc70ea7ec797e483280480a569ab2b7cf98330710adb097f51e98',
  matches: (row) =>
    row.itemClass === 'consume' && row.types?.includes('arrow') === true,
  card: projectileCard,
} satisfies ItemKind;

export const bullets = {
  id: 'bullet',
  group: 'use',
  slug: 'bullets',
  label: 'Bullets',
  description: 'Used by Pirates with a gun.',
  iconContentId:
    'b220c978f7d9a1afbaca42e4e49fbaa682b02abe412e11711ddec6116e6ede4a',
  matches: (row) =>
    row.itemClass === 'consume' && row.types?.includes('bullet') === true,
  card: projectileCard,
} satisfies ItemKind;
