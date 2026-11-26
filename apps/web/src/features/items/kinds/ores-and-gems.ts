import type { ItemKind } from './types';

export const oresAndGems = {
  id: 'ores-and-gems',
  group: 'etc',
  slug: 'ores-and-gems',
  label: 'Ores & Gems',
  iconContentId:
    '9bc102b58369315c30222c8c54107371efd84b875e76d5c83665c42428049cf4',
  matches: (row) =>
    row.itemClass === 'etc' &&
    row.types?.some(
      (type) => type === 'ore' || type === 'gem' || type === 'refined-material',
    ) === true,
} satisfies ItemKind;
