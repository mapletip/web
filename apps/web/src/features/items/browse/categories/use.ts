import { byFunction, byType, otherChild } from './builders';
import type { ItemCategoryScope } from './types';

export const useScope = {
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
} satisfies ItemCategoryScope<'use'>;
