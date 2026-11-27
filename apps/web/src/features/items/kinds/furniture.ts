import type { ItemKind } from './types';

export const furniture = {
  id: 'furniture',
  group: 'setup',
  slug: 'furniture',
  label: 'Furniture',
  iconContentId:
    '30653202898033325e7bdf8080b52b5b4025df895da27ac1e6e7b213f72e87e1',
  matches: (row) =>
    row.itemClass === 'setup' &&
    (row.types?.includes('furniture') === true ||
      row.types?.includes('crafting-station') === true),
} satisfies ItemKind;
