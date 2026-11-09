import { byType, otherChild } from './builders';
import type { ItemCategoryScope } from './types';

export const setupScope = {
  slug: 'setup',
  label: 'Set-up',
  itemClasses: ['setup'],
  children: [
    byType({
      slug: 'chairs',
      label: 'Chairs',
      type: 'chair',
      iconContentIds: [
        '15ceb9596a6bdc8f61f8aa1382292f3b428a30281315b83ed0499c5d0492e120', // Pink Seal Cushion
      ],
    }),
    byType({
      slug: 'event-items',
      label: 'Event Items',
      type: 'holiday-ornament',
      iconContentIds: [
        '96287ff70fcacc9d152b5e2382d3c7c274cbac08230d0c879c6d760dd8bbb5a8', // Circular Tree Ornament
      ],
    }),
    byType({
      slug: 'furniture',
      label: 'Furniture',
      type: 'furniture',
      iconContentIds: [
        '30653202898033325e7bdf8080b52b5b4025df895da27ac1e6e7b213f72e87e1', // Cherry Bed
      ],
    }),
    byType({
      slug: 'crafting-stations',
      label: 'Crafting Stations',
      type: 'crafting-station',
      iconContentIds: [
        'b7d62c62b03503e04609501b97cb8ce7349cfadec38b3e8d01d7eae524355051', // Anvil
      ],
    }),
    otherChild({
      slug: 'other-setup-items',
      label: 'Other Set-up Items',
    }),
  ],
} satisfies ItemCategoryScope<'setup'>;
