/**
 * Player-facing display labels for all item-related codes.
 *
 * Raw WZ and contract keys never leak into the player interface.
 */
import type {
  ItemBrowseFunction,
  ItemBrowseScrollDeltas,
  ItemBrowseType,
  ItemBrowseUpgradeSpecial,
  ItemBrowseUpgradeTarget,
  ItemRelationshipKind,
} from './project';

export type { ItemRelationshipKind };

export const ITEM_TYPE_LABELS: Readonly<Record<ItemBrowseType, string>> = {
  'upgrade-scroll': 'Upgrade Scroll',
  arrow: 'Arrow',
  'throwing-star': 'Throwing Star',
  bullet: 'Bullet',
  chair: 'Chair',
  ore: 'Ore',
  gem: 'Gem & Jewel',
  'pet-food': 'Pet Food',
  'refined-material': 'Refined Material',
  potion: 'Potion',
  'food-buff': 'Food & Buff',
  'monster-material': 'Monster Material',
  'holiday-ornament': 'Holiday Ornament',
  furniture: 'Furniture',
  'crafting-station': 'Crafting Station',
  'meso-pouch': 'Meso Pouch',
};

export const ITEM_FUNCTION_LABELS: Readonly<
  Record<ItemBrowseFunction, string>
> = {
  upgrade: 'Upgrade',
  skill: 'Skill',
  summon: 'Summon',
  'reward-container': 'Reward Container',
  'monster-card': 'Monster Card',
  readable: 'Book & Scroll',
  pet: 'Pet',
  recovery: 'Recovery',
};

export const RELATIONSHIP_LABELS: Readonly<
  Record<ItemRelationshipKind, string>
> = {
  'cash-shop-listing': 'Cash Shop Listing',
  'found-in-container': 'Found in Container',
  'made-by-recipe': 'Made by Recipe',
  'monster-drop': 'Monster Drop',
  'needed-for-quest': 'Needed for Quest',
  'quest-reward': 'Quest Reward',
  'used-in-recipe': 'Used in Recipe',
};

export const UPGRADE_TARGET_LABELS: Readonly<
  Record<ItemBrowseUpgradeTarget, string>
> = {
  accessory: 'Accessory',
  belt: 'Belt',
  bottomwear: 'Bottomwear',
  bow: 'Bow',
  cape: 'Cape',
  claw: 'Claw',
  crossbow: 'Crossbow',
  dagger: 'Dagger',
  earrings: 'Earrings',
  'eye-accessory': 'Eye Accessory',
  'face-accessory': 'Face Accessory',
  gloves: 'Gloves',
  gun: 'Gun',
  hat: 'Hat',
  knuckle: 'Knuckle',
  'one-handed-axe': 'One-Handed Axe',
  'one-handed-blunt-weapon': 'One-Handed Blunt Weapon',
  'one-handed-sword': 'One-Handed Sword',
  'overall-armor': 'Overall Armor',
  'pet-equipment': 'Pet Equipment',
  polearm: 'Polearm',
  ring: 'Ring',
  shield: 'Shield',
  shoes: 'Shoes',
  spear: 'Spear',
  staff: 'Staff',
  topwear: 'Topwear',
  'two-handed-axe': 'Two-Handed Axe',
  'two-handed-blunt-weapon': 'Two-Handed Blunt Weapon',
  'two-handed-sword': 'Two-Handed Sword',
  wand: 'Wand',
};

export const UPGRADE_TIER_LABELS: Readonly<Record<string, string>> = {
  lesser: 'Lesser',
  intermediate: 'Intermediate',
  greater: 'Greater',
  chaos: 'Chaos',
};

export const UPGRADE_SPECIAL_LABELS: Readonly<
  Record<ItemBrowseUpgradeSpecial, string>
> = {
  'clean-slate': 'Clean Slate',
  chaos: 'Chaos',
  'anti-slip': 'Anti-Slip',
  'warm-support': 'Warm Support',
  'randomized-stats': 'Randomized Stats',
};

export const SCROLL_STAT_LABELS: Readonly<Record<string, string>> = {
  weaponAttack: 'Weapon ATT',
  magicAttack: 'Magic ATT',
  strength: 'STR',
  dexterity: 'DEX',
  intelligence: 'INT',
  luck: 'LUK',
  maxHp: 'Max HP',
  maxMp: 'Max MP',
  weaponDefense: 'Weapon DEF',
  magicDefense: 'Magic DEF',
  accuracy: 'Accuracy',
  avoidability: 'Avoidability',
  speed: 'Speed',
  jump: 'Jump',
  criticalRate: 'Critical Rate',
  criticalDamage: 'Critical Damage',
  craft: 'Craft',
  swim: 'Swim',
};

export const SCROLL_STAT_ORDER = [
  'weaponAttack',
  'magicAttack',
  'strength',
  'dexterity',
  'intelligence',
  'luck',
  'maxHp',
  'maxMp',
  'weaponDefense',
  'magicDefense',
  'accuracy',
  'avoidability',
  'speed',
  'jump',
  'criticalRate',
  'criticalDamage',
  'craft',
  'swim',
] as const satisfies readonly (keyof ItemBrowseScrollDeltas)[];
