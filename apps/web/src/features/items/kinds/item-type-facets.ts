import type {
  FacetDefinition,
  QueryFieldDefinition,
} from '@mapletip/component-library';

import type { CategorizedItemRow, ItemBrowseType } from '../browse/project';

const ITEM_TYPE_LABELS: ReadonlyMap<ItemBrowseType, string> = new Map([
  ['upgrade-scroll', 'Upgrade scrolls'],
  ['arrow', 'Arrows'],
  ['throwing-star', 'Throwing stars'],
  ['bullet', 'Bullets'],
  ['chair', 'Chairs'],
  ['ore', 'Ores'],
  ['gem', 'Gems'],
  ['pet-food', 'Pet food'],
  ['refined-material', 'Refined materials'],
  ['potion', 'Potions'],
  ['food-buff', 'Food buffs'],
  ['monster-material', 'Monster materials'],
  ['holiday-ornament', 'Holiday ornaments'],
  ['furniture', 'Furniture'],
  ['crafting-station', 'Crafting stations'],
  ['meso-pouch', 'Meso pouches'],
  ['return-scroll', 'Return scrolls'],
  ['transformation', 'Transformations'],
  ['coupon', 'Coupons'],
  ['minigame', 'Minigames'],
  ['crafting-catalyst', 'Crafting catalysts'],
  ['crafting-kit', 'Crafting kits'],
]);

export function itemTypeFacet({
  rows,
}: {
  readonly rows: readonly CategorizedItemRow[];
}): readonly FacetDefinition<CategorizedItemRow>[] {
  const present = new Set(rows.flatMap((row) => row.types ?? []));
  const options = [...ITEM_TYPE_LABELS].flatMap(([value, label]) =>
    present.has(value) ? [{ value, label }] : [],
  );
  return options.length === 0
    ? []
    : [
        {
          id: 'item-type',
          field: 'itemTypes',
          label: 'Type',
          kind: 'multi-select',
          placement: 'results',
          options,
        },
      ];
}

export function itemTypeQueryField(): QueryFieldDefinition<CategorizedItemRow> {
  return {
    id: 'itemTypes',
    accessor: (row) => row.types ?? [],
    sortable: false,
  };
}
