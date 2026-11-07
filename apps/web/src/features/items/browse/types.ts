/**
 * Data contracts and presentation types for Items Browse.
 */
import type { ItemBrowseRecord } from '@mapletip/data/items';

export type ItemBrowseClass = ItemBrowseRecord['itemClass'];
export type ItemBrowseType = NonNullable<ItemBrowseRecord['types']>[number];
export type ItemBrowseFunction = NonNullable<
  ItemBrowseRecord['functions']
>[number];
export type ItemBrowseScrollDeltas = NonNullable<
  NonNullable<ItemBrowseRecord['scroll']>['deltas']
>;
export type ItemBrowseUpgradeTarget = NonNullable<
  NonNullable<ItemBrowseRecord['scroll']>['targetLabel']
>;
export type ItemBrowseUpgradeTier = NonNullable<
  NonNullable<ItemBrowseRecord['scroll']>['tier']
>;
export type ItemBrowseUpgradeSpecial = NonNullable<
  NonNullable<ItemBrowseRecord['scroll']>['specials']
>[number];

export type ItemRelationshipKind =
  | 'cash-shop-listing'
  | 'found-in-container'
  | 'made-by-recipe'
  | 'monster-drop'
  | 'needed-for-quest'
  | 'quest-reward'
  | 'used-in-recipe';

export type ItemFactState = 'known' | 'unknown' | 'absent' | 'unsupported';

export interface ItemRow extends Record<string, unknown> {
  readonly key: string;
  readonly sourceId: string;
  readonly name?: string;
  readonly nameState?: ItemFactState;
  readonly icon?: string;
  readonly itemClass: ItemBrowseClass;
  readonly types?: readonly ItemBrowseType[];
  readonly functions?: readonly ItemBrowseFunction[];
  readonly rel?: readonly ItemRelationshipKind[];
  readonly cashShopListingCount?: number;
  readonly foundInContainerCount?: number;
  readonly madeByRecipeCount?: number;
  readonly monsterDropCount?: number;
  readonly neededForQuestCount?: number;
  readonly questRewardCount?: number;
  readonly usedInRecipeCount?: number;
  readonly questFlag?: boolean;
  readonly family?: string;
  readonly hp?: number;
  readonly mp?: number;
  readonly hpPercent?: number;
  readonly mpPercent?: number;
  readonly attack?: number;
  readonly closeness?: number;
  readonly fullness?: number;
  readonly tameness?: number;
  readonly petTargets?: readonly string[];
  readonly unresolvedPetTargets?: readonly string[];
  readonly seatHp?: number;
  readonly seatMp?: number;
  readonly success?: number;
  readonly cursed?: number;
  readonly targetLabel?: ItemBrowseUpgradeTarget;
  readonly tier?: ItemBrowseUpgradeTier;
  readonly specials?: readonly ItemBrowseUpgradeSpecial[];
  readonly stats?: Readonly<ItemBrowseScrollDeltas>;
  readonly statKeys?: readonly string[];
  readonly statRank?: number;
  readonly directTargetCount?: number;
}

export const SCROLL_STAT_PRIORITY: readonly (keyof ItemBrowseScrollDeltas)[] = [
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
] as const;
