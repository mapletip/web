/**
 * App-owned projection of SDK Item browse records into flat, sortable,
 * JSON-serializable browse rows.
 *
 * Absent values are omitted (undefined means "no value"; never coerce to 0).
 */
import type { ItemBrowseRecord, ItemBrowseRow } from '@mapletip/data/items';

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

export interface ItemRow extends Record<string, unknown> {
  readonly key: string;
  readonly sourceId: string;
  readonly name?: string;
  readonly icon?: string;
  readonly itemClass: ItemBrowseClass;
  readonly types?: readonly ItemBrowseType[];
  readonly functions?: readonly ItemBrowseFunction[];
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
  readonly statRank?: number;
  readonly directTargetCount?: number;
}

export const UNNAMED_ITEM_LABEL = 'Unnamed item';

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

function computeStatRank(
  deltas?: ItemBrowseScrollDeltas | null,
): number | undefined {
  if (!deltas) return undefined;
  for (const [i, statKey] of SCROLL_STAT_PRIORITY.entries()) {
    const val = deltas[statKey];
    if (typeof val === 'number') {
      return (i + 1) * 10000 - val;
    }
  }
  return undefined;
}

const RELATIONSHIP_COUNT_FIELDS = [
  ['cash-shop-listing', 'cashShopListingCount'],
  ['found-in-container', 'foundInContainerCount'],
  ['made-by-recipe', 'madeByRecipeCount'],
  ['monster-drop', 'monsterDropCount'],
  ['needed-for-quest', 'neededForQuestCount'],
  ['quest-reward', 'questRewardCount'],
  ['used-in-recipe', 'usedInRecipeCount'],
] as const satisfies readonly (readonly [
  ItemRelationshipKind,
  keyof ItemRow,
])[];

export function projectItemBrowseRows(
  records: readonly ItemBrowseRow[],
): readonly ItemRow[] {
  const namesByKey = new Map<string, string>();
  for (const record of records) {
    namesByKey.set(
      record.key,
      record.name.state === 'known' ? record.name.value : UNNAMED_ITEM_LABEL,
    );
  }

  return records.map((record) => {
    const row: Record<string, unknown> = {
      key: record.key,
      sourceId: record.sourceId,
      itemClass: record.itemClass,
    };

    if (record.name.state === 'known') {
      row['name'] = record.name.value;
    }
    if (record.icon.state === 'known') {
      row['icon'] = record.icon.value;
    }
    if (record.types && record.types.length > 0) {
      row['types'] = record.types;
    }
    if (record.functions && record.functions.length > 0) {
      row['functions'] = record.functions;
    }

    if (record.relationships) {
      for (const [kind, field] of RELATIONSHIP_COUNT_FIELDS) {
        const count = record.relationships[kind];
        if (typeof count === 'number') {
          row[field] = count;
        }
      }
    }

    if (record.questFlag === true) {
      row['questFlag'] = true;
    }
    if (typeof record.family === 'string' && record.family.length > 0) {
      row['family'] = record.family;
    }
    if (typeof record.projectileAttack === 'number') {
      row['attack'] = record.projectileAttack;
    }

    if (record.recovery) {
      if (typeof record.recovery.hp === 'number')
        row['hp'] = record.recovery.hp;
      if (typeof record.recovery.mp === 'number')
        row['mp'] = record.recovery.mp;
      if (typeof record.recovery.hpPercent === 'number') {
        row['hpPercent'] = record.recovery.hpPercent;
      }
      if (typeof record.recovery.mpPercent === 'number') {
        row['mpPercent'] = record.recovery.mpPercent;
      }
    }

    if (record.petFood) {
      if (typeof record.petFood.closeness === 'number') {
        row['closeness'] = record.petFood.closeness;
      }
      if (typeof record.petFood.fullness === 'number') {
        row['fullness'] = record.petFood.fullness;
      }
      if (typeof record.petFood.tameness === 'number') {
        row['tameness'] = record.petFood.tameness;
      }
      if (record.petFood.targets && record.petFood.targets.length > 0) {
        const resolved = record.petFood.targets.map(
          (targetKey) => namesByKey.get(targetKey) ?? UNNAMED_ITEM_LABEL,
        );
        row['petTargets'] = Array.from(new Set(resolved));
      }
      if (
        record.petFood.unresolvedTargets &&
        record.petFood.unresolvedTargets.length > 0
      ) {
        row['unresolvedPetTargets'] = record.petFood.unresolvedTargets;
      }
    }

    if (record.seatingRecovery) {
      if (typeof record.seatingRecovery.hp === 'number') {
        row['seatHp'] = record.seatingRecovery.hp;
      }
      if (typeof record.seatingRecovery.mp === 'number') {
        row['seatMp'] = record.seatingRecovery.mp;
      }
    }

    if (record.scroll) {
      if (typeof record.scroll.success === 'number') {
        row['success'] = record.scroll.success;
      }
      if (typeof record.scroll.cursed === 'number') {
        row['cursed'] = record.scroll.cursed;
      }
      if (record.scroll.targetLabel != null) {
        row['targetLabel'] = record.scroll.targetLabel;
      }
      if (record.scroll.tier != null) {
        row['tier'] = record.scroll.tier;
      }
      if (record.scroll.specials && record.scroll.specials.length > 0) {
        row['specials'] = record.scroll.specials;
      }
      const deltas = record.scroll.deltas;
      if (deltas && Object.keys(deltas).length > 0) {
        row['stats'] = deltas;
      }
      const statRank = computeStatRank(deltas);
      if (statRank !== undefined) {
        row['statRank'] = statRank;
      }
      if (record.scroll.targets && record.scroll.targets.length > 0) {
        row['directTargetCount'] = record.scroll.targets.length;
      }
    }

    return row as ItemRow;
  });
}
