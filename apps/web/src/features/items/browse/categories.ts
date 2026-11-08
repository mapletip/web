/**
 * The single category registry for MapleStory Items Browse.
 *
 * Within a scope, every item belongs to EXACTLY ONE child.
 * Positive children form an ordered list where order defines precedence:
 * an item is assigned to the FIRST positive child whose predicate matches.
 * If no positive child matches, it falls through to the scope's Other child
 * (if present).
 *
 * Scopes are disjoint by itemClass. Membership is always scope AND assignment.
 */
import type {
  ItemBrowseClass,
  ItemBrowseFunction,
  ItemBrowseType,
  ItemRow,
} from './project';

export const ITEM_SCOPE_SLUGS = ['all', 'use', 'etc', 'setup', 'cash'] as const;
export type ItemScopeSlug = (typeof ITEM_SCOPE_SLUGS)[number];

export interface ItemPositiveChild {
  readonly kind: 'positive';
  readonly slug: string;
  readonly label: string;
  readonly matches: (row: ItemRow) => boolean;
  readonly iconContentIds?: readonly string[];
}

export interface ItemOtherChild {
  readonly kind: 'other';
  readonly slug: string;
  readonly label: string;
  readonly iconContentIds?: readonly string[];
}

export type ItemCategoryChild = ItemPositiveChild | ItemOtherChild;

export interface ItemCategoryScope {
  readonly slug: ItemScopeSlug;
  readonly label: string;
  readonly itemClasses: readonly ItemBrowseClass[];
  readonly children: readonly ItemCategoryChild[];
}

interface ByTypeOptions {
  readonly slug: string;
  readonly label: string;
  readonly type: ItemBrowseType;
  readonly iconContentIds?: readonly string[];
}

interface ByFunctionOptions {
  readonly slug: string;
  readonly label: string;
  readonly fn: ItemBrowseFunction;
  readonly iconContentIds?: readonly string[];
}

interface OtherChildOptions {
  readonly slug: string;
  readonly label: string;
  readonly iconContentIds?: readonly string[];
}

const byType = ({
  slug,
  label,
  type,
  iconContentIds,
}: ByTypeOptions): ItemPositiveChild => ({
  kind: 'positive',
  slug,
  label,
  matches: (row) => row.types?.includes(type) ?? false,
  ...(iconContentIds ? { iconContentIds } : {}),
});

const byFunction = ({
  slug,
  label,
  fn,
  iconContentIds,
}: ByFunctionOptions): ItemPositiveChild => ({
  kind: 'positive',
  slug,
  label,
  matches: (row) => row.functions?.includes(fn) ?? false,
  ...(iconContentIds ? { iconContentIds } : {}),
});

const otherChild = ({
  slug,
  label,
  iconContentIds,
}: OtherChildOptions): ItemOtherChild => ({
  kind: 'other',
  slug,
  label,
  ...(iconContentIds ? { iconContentIds } : {}),
});

export const ITEM_SCOPES: Readonly<Record<ItemScopeSlug, ItemCategoryScope>> = {
  all: {
    slug: 'all',
    label: 'All Items',
    itemClasses: ['consume', 'etc', 'setup', 'cash', 'pet'],
    children: [],
  },
  use: {
    slug: 'use',
    label: 'Use',
    itemClasses: ['consume'],
    children: [
      byType({
        slug: 'scrolls',
        label: 'Scrolls',
        type: 'upgrade-scroll',
        iconContentIds: [
          '3a453e4e40b44d9358f9348abdda896b64ecc046a52e5b07a2388bdbd7dc8601', // Scroll for Helmet for DEF 100%
        ],
      }),
      byFunction({
        slug: 'recovery',
        label: 'Recovery',
        fn: 'recovery',
        iconContentIds: [
          '07c090345b4e437b6204eb7e234119d7709846f6b263712c7df5121add2bdc71', // Elixir
          '5aae760b2488feb48104655227f9faf80f84691197b940ab44775f8f2a0c3965', // Power Elixir
        ],
      }),
      {
        kind: 'positive',
        slug: 'buffs',
        label: 'Buffs',
        matches: (row) =>
          Boolean(
            row.types?.includes('potion') || row.types?.includes('food-buff'),
          ),
        iconContentIds: [
          '1cb0671554c0cb6eb6a95aca81a1cc52d11b5853a371741cf790463c0dccccb1', // Drake's Blood
        ],
      },
      byType({
        slug: 'throwing-stars',
        label: 'Throwing Stars',
        type: 'throwing-star',
        iconContentIds: [
          'f77172ea2f08e2e8586c8d2a208c3614cbf112a09796609f9b4fc5c8affb5e0e', // Subi Throwing-Stars
        ],
      }),
      byType({
        slug: 'arrows',
        label: 'Arrows',
        type: 'arrow',
        iconContentIds: [
          '752f72ebcb3fc70ea7ec797e483280480a569ab2b7cf98330710adb097f51e98', // Arrow for Bow
        ],
      }),
      byType({
        slug: 'bullets',
        label: 'Bullets',
        type: 'bullet',
        iconContentIds: [
          'b220c978f7d9a1afbaca42e4e49fbaa682b02abe412e11711ddec6116e6ede4a', // Bullet
        ],
      }),
      byType({
        slug: 'pet-food',
        label: 'Pet Food',
        type: 'pet-food',
        iconContentIds: [
          '48bbbec3311d822c327cfc030c8d5a2d5f0c726a263356c40c02af0f125aac7c', // Pet Food
        ],
      }),
      byFunction({
        slug: 'summoning-sacks',
        label: 'Summoning Sacks',
        fn: 'summon',
        iconContentIds: [
          '6c254da1ae5e2f8294a162a86622807c3c45d1bcb123660e17ebdd1739174357', // Black Sack
        ],
      }),
      byFunction({
        slug: 'boxes',
        label: 'Boxes',
        fn: 'reward-container',
        iconContentIds: [
          'cc78d2418978f78394df682664352ee29cb05c6eab276916eea5bb829fe4a595', // Mysterious Box
        ],
      }),
      byFunction({
        slug: 'monster-cards',
        label: 'Monster Cards',
        fn: 'monster-card',
        iconContentIds: [
          'a8ecbc24e9b7659ec44e8281bd630a7280a35580d5aac3e0ada70ab6718b1735', // Blue Snail Card
        ],
      }),
      byFunction({
        slug: 'mastery-books',
        label: 'Mastery Books',
        fn: 'skill',
        iconContentIds: [
          '147e22281aa79e799cb16f38bcf9685bede7679e0132fde589b6d8e24185e10b', // [Mastery Book] Sharp Eyes
        ],
      }),
      byType({
        slug: 'meso-pouches',
        label: 'Meso Pouches',
        type: 'meso-pouch',
        iconContentIds: [
          '1a1202deec7cf17c8aec33e32c120f44e2cb7d2a1c9c4951ba9aa9f8093fcd24', // Mysterious Meso Pouch
        ],
      }),
      otherChild({
        slug: 'other-use-items',
        label: 'Other Use Items',
        iconContentIds: [
          '45f5193907b528c8221c6267724b4dd71cd4d9cef11b11c99d6c2975ad26d45f', // Lie Detector Test
        ],
      }),
    ],
  },
  etc: {
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
  },
  setup: {
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
  },
  cash: {
    slug: 'cash',
    label: 'Cash',
    itemClasses: ['cash', 'pet'],
    children: [
      {
        kind: 'positive',
        slug: 'pets',
        label: 'Pets',
        matches: (row) => row.itemClass === 'pet',
        iconContentIds: [
          '7cb4e8cd5e402cc35d7bd6d51dafb1800670816463425b50525f091accdde43e', // Pink Bunny
        ],
      },
      {
        kind: 'positive',
        slug: 'cash-items',
        label: 'Cash Items',
        matches: (row) => row.itemClass === 'cash',
        iconContentIds: [
          'e92811536cb6820a65eafaea2452b94161951361e5ed35b16035f0207d8939f0', // Super Megaphone
        ],
      },
    ],
  },
};
