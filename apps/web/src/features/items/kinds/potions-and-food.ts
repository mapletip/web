import type { FacetDefinition } from '@mapletip/component-library';

import { BUFF_STAT_LABELS, formatBuffParts } from '../browse/buff-format';
import type { CategorizedItemRow, ItemRow } from '../browse/project';
import { recoveryParts } from '../browse/recovery-format';

import type { ItemKind } from './types';

function recoveryTypes(row: ItemRow): string[] {
  return [
    ...(row.hp !== undefined || row.hpPercent !== undefined ? ['hp'] : []),
    ...(row.mp !== undefined || row.mpPercent !== undefined ? ['mp'] : []),
    ...(row.buff?.effects.length ? ['buff'] : []),
  ];
}

/** Buffs filter with one option per stat the category's items raise. */
function buffStatFilter(
  rows: readonly ItemRow[],
): FacetDefinition<CategorizedItemRow>[] {
  const stats = new Set(
    rows.flatMap((row) => row.buff?.effects.map((effect) => effect.stat) ?? []),
  );
  if (stats.size === 0) return [];
  return [
    {
      id: 'buff-stats',
      field: 'buffStats',
      label: 'Buff stat',
      kind: 'multi-select',
      options: Object.entries(BUFF_STAT_LABELS)
        .filter(([stat]) => stats.has(stat as keyof typeof BUFF_STAT_LABELS))
        .map(([value, label]) => ({
          value,
          label: label.charAt(0).toUpperCase() + label.slice(1),
        })),
    },
  ];
}

export const potionsAndFood = {
  id: 'potions-and-food',
  group: 'use',
  slug: 'potions-and-food',
  label: 'Potions & Food',
  iconContentId:
    '1cb0671554c0cb6eb6a95aca81a1cc52d11b5853a371741cf790463c0dccccb1',
  matches: (row) =>
    row.itemClass === 'consume' &&
    row.types?.includes('meso-pouch') !== true &&
    (row.types?.includes('potion') === true ||
      row.types?.includes('food-buff') === true),
  card: {
    layout: 'short',
    value: (row) => {
      const parts = [
        ...recoveryParts({
          hp: row.hp,
          hpPercent: row.hpPercent,
          mp: row.mp,
          mpPercent: row.mpPercent,
        }),
        ...(row.buff?.effects.length
          ? formatBuffParts({ buff: row.buff }).effects
          : []),
      ];
      return parts.length > 0 ? parts : undefined;
    },
    lead: (row) =>
      row.buff?.effects.length
        ? formatBuffParts({ buff: row.buff }).duration
        : undefined,
    facets: ({ rows }) => [
      {
        id: 'recovery-type',
        field: 'recoveryTypes',
        label: 'Effect',
        kind: 'multi-select',
        placement: 'results',
        options: [
          { value: 'hp', label: 'Restores HP' },
          { value: 'mp', label: 'Restores MP' },
          { value: 'buff', label: 'Buffs' },
        ],
      },
      ...buffStatFilter(rows),
    ],
    queryFields: () => [
      { id: 'recoveryTypes', accessor: recoveryTypes, sortable: false },
      {
        id: 'buffStats',
        accessor: (row) => row.buff?.effects.map((effect) => effect.stat) ?? [],
        sortable: false,
      },
      { id: 'hp', accessor: 'hp' },
      { id: 'mp', accessor: 'mp' },
      { id: 'sellPrice', accessor: 'sellPrice' },
    ],
    sortOptions: [
      { label: 'HP (low to high)', field: 'hp', direction: 'asc' },
      { label: 'HP (high to low)', field: 'hp', direction: 'desc' },
      { label: 'MP (low to high)', field: 'mp', direction: 'asc' },
      { label: 'MP (high to low)', field: 'mp', direction: 'desc' },
      {
        label: 'Sell price (low to high)',
        field: 'sellPrice',
        direction: 'asc',
      },
      {
        label: 'Sell price (high to low)',
        field: 'sellPrice',
        direction: 'desc',
      },
    ],
  },
} satisfies ItemKind;
