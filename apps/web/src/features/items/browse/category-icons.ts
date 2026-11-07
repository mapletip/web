/**
 * Preference list of source IDs for representative item icons per category child.
 *
 * Each populated category maps to an ordered preference list of 1–3 source IDs.
 * Empty categories or miscellaneous "Other" categories without a representative
 * item map to an empty list ([]).
 */
import type { ItemCategoryChildId } from './categories';

export const CATEGORY_ICONS: Readonly<
  Record<ItemCategoryChildId, readonly string[]>
> = {
  // Use
  'use/upgrade-scrolls': ['02040000', '02040001'],
  'use/recovery': ['02000000', '02000002', '02000001'],
  'use/throwing-stars': ['02070000', '02070006', '02070005'],
  'use/arrows': ['02060000', '02061000', '02060001'],
  'use/bullets': ['02330000', '02330001', '02330002'],
  'use/pet-food': ['02120000'],
  'use/summoning-items': ['02100000', '02100007'],
  'use/reward-containers': ['02022428', '02022336'],
  'use/potions': ['02000003', '02000001', '02000006'],
  'use/food-buffs': ['02022002', '02012000', '02020006'],
  'use/monster-cards': ['02380001', '02380007', '02380005'],
  'use/skill-items': ['02290053', '02290084', '02280010'],
  'use/meso-pouches': ['02028000', '02028001'],
  'use/other-use-items': ['02030000', '02030004'],

  // ETC
  'etc/quest-items': ['04031039', '04031040', '04031041'],
  'etc/crafting': ['04020000', '04020007'],
  'etc/ores': ['04010006', '04010001', '04010000'],
  'etc/gems': ['04020107', '04021007'],
  'etc/refined-materials': ['04010101', '04011001'],
  'etc/monster-materials': ['04000009'],
  'etc/other-etc-items': [],

  // Set-up
  'setup/chairs': ['03010000', '03010008', '03010007'],
  'setup/holiday-ornaments': ['03992024', '03992021', '03992026'],
  'setup/furniture': ['03000005', '03000006'],
  'setup/crafting-stations': ['03030000', '03030001'],
  'setup/other-setup-items': [],

  // Cash/Pet
  'cash/pets': ['5000000', '5000001', '5000002'],
  'cash/cash-items': ['05120002', '05010000', '05010002'],
};
