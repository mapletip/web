/**
 * App-owned projection of SDK Item browse records into flat, sortable,
 * JSON-serializable browse rows.
 *
 * Absent values are omitted (undefined means "no value"; never coerce to 0).
 */
import type { ItemBrowseRecord, ItemBrowseRow } from '@mapletip/data/items';

type Fact = ItemBrowseRow['name'];
type Scroll = NonNullable<ItemBrowseRecord['scroll']>;
export type ItemBrowseClass = ItemBrowseRecord['itemClass'];
export type ItemBrowseType = NonNullable<ItemBrowseRecord['types']>[number];
export type ItemBrowseFunction = NonNullable<
  ItemBrowseRecord['functions']
>[number];
export type ItemBrowseScrollDeltas = NonNullable<Scroll['deltas']>;
export type ItemBrowseUpgradeTarget = NonNullable<Scroll['targetLabel']>;
export type ItemBrowseUpgradeTier = NonNullable<Scroll['tier']>;
export type ItemBrowseUpgradeSpecial = NonNullable<Scroll['specials']>[number];
export type ItemRelationshipKind = keyof NonNullable<
  ItemBrowseRecord['relationships']
>;

export interface ItemPetTarget {
  readonly key: string;
  readonly name?: string;
}

export type ItemRow = {
  readonly key: string;
  readonly sourceId: string;
  readonly itemClass: ItemBrowseClass;
  readonly name?: string;
  readonly icon?: string;
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
  readonly petTargets?: readonly ItemPetTarget[];
  readonly unresolvedPetTargets?: readonly string[];
  readonly seatHp?: number;
  readonly seatMp?: number;
  readonly success?: number;
  readonly cursed?: number;
  readonly targetLabel?: ItemBrowseUpgradeTarget;
  readonly tier?: ItemBrowseUpgradeTier;
  readonly specials?: readonly ItemBrowseUpgradeSpecial[];
  readonly stats?: Readonly<ItemBrowseScrollDeltas>;
  readonly directTargetCount?: number;
};

type WritableItemRow = { -readonly [K in keyof ItemRow]: ItemRow[K] };

function setField<K extends keyof ItemRow>(
  row: WritableItemRow,
  key: K,
  value: ItemRow[K] | null | undefined,
): void {
  if (value != null) {
    row[key] = value;
  }
}

function extractKnownFact(fact: Fact): string | undefined {
  if (fact.state === 'known') {
    return fact.value;
  }
  return undefined;
}

function filterNonEmptyArray<T>(
  array: readonly T[] | undefined,
): readonly T[] | undefined {
  if (array && array.length > 0) {
    return array;
  }
  return undefined;
}

function resolvePetTargets(
  targets: readonly string[] | undefined,
  petNamesByKey: ReadonlyMap<string, string>,
): readonly ItemPetTarget[] | undefined {
  if (!targets || targets.length === 0) {
    return undefined;
  }

  const distinctKeys = Array.from(new Set(targets));
  return distinctKeys.map((targetKey) => {
    const knownName = petNamesByKey.get(targetKey);
    if (knownName !== undefined) {
      return { key: targetKey, name: knownName };
    }
    return { key: targetKey };
  });
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
  const petNamesByKey = new Map<string, string>();
  for (const record of records) {
    if (record.name.state === 'known') {
      petNamesByKey.set(record.key, record.name.value);
    }
  }

  return records.map((record) => {
    const row: WritableItemRow = {
      key: record.key,
      sourceId: record.sourceId,
      itemClass: record.itemClass,
    };

    setField(row, 'name', extractKnownFact(record.name));
    setField(row, 'icon', extractKnownFact(record.icon));
    setField(row, 'types', filterNonEmptyArray(record.types));
    setField(row, 'functions', filterNonEmptyArray(record.functions));

    if (record.relationships) {
      for (const [relationshipKind, fieldKey] of RELATIONSHIP_COUNT_FIELDS) {
        setField(row, fieldKey, record.relationships[relationshipKind]);
      }
    }

    setField(row, 'questFlag', record.questFlag);
    setField(row, 'family', record.family || undefined);
    setField(row, 'attack', record.projectileAttack);
    setField(row, 'hp', record.recovery?.hp);
    setField(row, 'mp', record.recovery?.mp);
    setField(row, 'hpPercent', record.recovery?.hpPercent);
    setField(row, 'mpPercent', record.recovery?.mpPercent);

    const petFood = record.petFood;
    setField(row, 'closeness', petFood?.closeness);
    setField(row, 'fullness', petFood?.fullness);
    setField(row, 'tameness', petFood?.tameness);
    setField(
      row,
      'petTargets',
      resolvePetTargets(petFood?.targets, petNamesByKey),
    );
    setField(
      row,
      'unresolvedPetTargets',
      filterNonEmptyArray(petFood?.unresolvedTargets),
    );

    setField(row, 'seatHp', record.seatingRecovery?.hp);
    setField(row, 'seatMp', record.seatingRecovery?.mp);

    const scroll = record.scroll;
    setField(row, 'success', scroll?.success);
    setField(row, 'cursed', scroll?.cursed);
    setField(row, 'targetLabel', scroll?.targetLabel);
    setField(row, 'tier', scroll?.tier);
    setField(row, 'specials', filterNonEmptyArray(scroll?.specials));
    setField(
      row,
      'stats',
      scroll?.deltas && Object.keys(scroll.deltas).length > 0
        ? scroll.deltas
        : undefined,
    );
    setField(row, 'directTargetCount', scroll?.targets?.length || undefined);

    return row;
  });
}
