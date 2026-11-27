import { numberFormat } from '../browse/number-format';

import type { ItemKind } from './types';

const PROJECTILE_TYPE_OPTIONS = [
  { value: 'throwing-star', label: 'Throwing stars' },
  { value: 'arrow', label: 'Arrows' },
  { value: 'bullet', label: 'Bullets' },
] as const;

export const starsAndArrows = {
  id: 'stars-and-arrows',
  group: 'use',
  slug: 'stars-and-arrows',
  label: 'Stars & Arrows',
  iconContentId:
    'f77172ea2f08e2e8586c8d2a208c3614cbf112a09796609f9b4fc5c8affb5e0e',
  matches: (row) =>
    row.itemClass === 'consume' &&
    PROJECTILE_TYPE_OPTIONS.some(
      (option) => row.types?.includes(option.value) === true,
    ),
  card: {
    layout: 'short',
    lead: (row) => {
      const parts = [
        ...(row.attack === undefined
          ? []
          : [`+${numberFormat.format(row.attack)} attack`]),
        ...(row.maxStack === undefined
          ? []
          : [`${numberFormat.format(row.maxStack)} per stack`]),
      ];
      return parts.length > 0 ? parts.join(' · ') : undefined;
    },
    facets: ({ rows }) => {
      const present = new Set(rows.flatMap((row) => row.types ?? []));
      const options = PROJECTILE_TYPE_OPTIONS.filter((option) =>
        present.has(option.value),
      );
      if (options.length === 0) return [];
      return [
        {
          id: 'projectile-type',
          field: 'projectileTypes',
          label: 'Type',
          kind: 'multi-select',
          placement: 'results',
          options,
        },
      ];
    },
    queryFields: () => [
      {
        id: 'projectileTypes',
        accessor: (row) =>
          (row.types ?? []).filter((type) =>
            PROJECTILE_TYPE_OPTIONS.some((option) => option.value === type),
          ),
        sortable: false,
      },
      { id: 'attack', accessor: 'attack' },
    ],
    sortOptions: [
      { label: 'Attack (high to low)', field: 'attack', direction: 'desc' },
      { label: 'Attack (low to high)', field: 'attack', direction: 'asc' },
    ],
  },
} satisfies ItemKind;
