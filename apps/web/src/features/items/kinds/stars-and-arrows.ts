import type { ItemKind } from './types';

export const starsAndArrows = {
  id: 'stars-and-arrows',
  group: 'use',
  slug: 'stars-and-arrows',
  label: 'Stars & Arrows',
  iconContentId:
    'f77172ea2f08e2e8586c8d2a208c3614cbf112a09796609f9b4fc5c8affb5e0e',
  matches: (row) =>
    row.itemClass === 'consume' &&
    row.types?.some(
      (type) =>
        type === 'throwing-star' || type === 'arrow' || type === 'bullet',
    ) === true,
} satisfies ItemKind;
