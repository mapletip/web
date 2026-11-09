/**
 * Player-facing display labels for all item-related codes.
 *
 * Raw WZ and contract keys never leak into the player interface.
 */
import type { ItemBrowseUpgradeTarget } from './project';

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
