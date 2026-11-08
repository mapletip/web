import { byType, otherChild } from './builders';
import type { ItemCategoryScope } from './types';

export const etcScope: ItemCategoryScope = {
  slug: 'etc',
  label: 'ETC',
  itemClasses: ['etc'],
  children: [
    byType({
      slug: 'ores',
      label: 'Ores',
      type: 'ore',
      iconContentIds: [
        '9bc102b58369315c30222c8c54107371efd84b875e76d5c83665c42428049cf4', // Gold Ore
      ],
    }),
    byType({
      slug: 'gems',
      label: 'Gems',
      type: 'gem',
      iconContentIds: [
        '365ff7564302e01a8ca13a94f63ff05adc0b318a9c44dc8a69506e52300b4874', // Diamond
      ],
    }),
    byType({
      slug: 'refined-ores',
      label: 'Refined Ores',
      type: 'refined-material',
      iconContentIds: [
        '75d29c88a2df6716e8452fdcd5e2de63a2cfbc587f9537ec3706b02639f5d4aa', // Steel Plate / Iron Ingot
      ],
    }),
    byType({
      slug: 'monster-drops',
      label: 'Monster Drops',
      type: 'monster-material',
      iconContentIds: [
        '752e1848b26d249f7728fa2b290b6077872e79dea71db2d18aea20c8605889e5', // Orange Mushroom Cap
        'a17e4c3ad5053c275a4f791c71f0707e2e0e6b02b056f0892e4a221df76bd57d', // Pig's Ribbon
      ],
    }),
    {
      kind: 'positive',
      slug: 'quest-items',
      label: 'Quest Items',
      matches: (row) =>
        row.questFlag === true || (row.neededForQuestCount ?? 0) > 0,
      iconContentIds: [
        '63df4ceb3580419b2ae1db57f001573eac4fe068edfe5aeea17c4ce734de0f7a', // Lucas' Letter / Maria's Letter
      ],
    },
    otherChild({
      slug: 'other-etc-items',
      label: 'Other ETC Items',
      iconContentIds: [
        '01a2f55abad4412c067f2ff4bbded0ce3793affe55817e4fc84e70c808289a43', // Ticket to Orbis (Regular)
      ],
    }),
  ],
};
