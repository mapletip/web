/**
 * App-owned projection of SDK Item browse records into flat, sortable,
 * JSON-serializable browse rows.
 *
 * Absent values are omitted (undefined means "no value"; never coerce to 0).
 */
import type { ItemBrowseRecord, ItemBrowseRow } from '@mapletip/data/items';

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
};

type WritableItemRow = { -readonly [K in keyof ItemRow]: ItemRow[K] };

function put<K extends keyof ItemRow>(
  row: WritableItemRow,
  key: K,
  val: ItemRow[K] | null | undefined,
): void {
  if (val != null) row[key] = val;
}

export const UNNAMED_ITEM_LABEL = 'Unnamed item';

// prettier-ignore
export const SCROLL_STAT_PRIORITY = [
  'weaponAttack', 'magicAttack', 'strength', 'dexterity', 'intelligence', 'luck',
  'maxHp', 'maxMp', 'weaponDefense', 'magicDefense', 'accuracy', 'avoidability',
  'speed', 'jump', 'criticalRate', 'criticalDamage', 'craft', 'swim',
] as const satisfies readonly (keyof ItemBrowseScrollDeltas)[];

function computeStatRank(
  deltas?: ItemBrowseScrollDeltas | null,
): number | undefined {
  if (!deltas) return undefined;
  for (const [i, key] of SCROLL_STAT_PRIORITY.entries()) {
    const val = deltas[key];
    if (typeof val === 'number') return (i + 1) * 10000 - val;
  }
  return undefined;
}

// prettier-ignore
const RELATIONSHIP_COUNT_FIELDS = [
  ['cash-shop-listing', 'cashShopListingCount'], ['found-in-container', 'foundInContainerCount'],
  ['made-by-recipe', 'madeByRecipeCount'], ['monster-drop', 'monsterDropCount'],
  ['needed-for-quest', 'neededForQuestCount'], ['quest-reward', 'questRewardCount'],
  ['used-in-recipe', 'usedInRecipeCount'],
] as const;

const knownVal = (f: { state: string; value?: string }) =>
  f.state === 'known' ? f.value : undefined;
const nonEmpty = <T>(arr?: readonly T[]) => (arr?.length ? arr : undefined);
const resolveTargets = (
  targets?: readonly string[],
  names?: Map<string, string>,
) =>
  targets?.length
    ? Array.from(
        new Set(targets.map((t) => names?.get(t) ?? UNNAMED_ITEM_LABEL)),
      )
    : undefined;

export function projectItemBrowseRows(
  records: readonly ItemBrowseRow[],
): readonly ItemRow[] {
  const names = new Map(
    records.map((r) => [
      r.key,
      r.name.state === 'known' ? r.name.value : UNNAMED_ITEM_LABEL,
    ]),
  );

  return records.map((record) => {
    const row: WritableItemRow = {
      key: record.key,
      sourceId: record.sourceId,
      itemClass: record.itemClass,
    };

    put(row, 'name', knownVal(record.name));
    put(row, 'icon', knownVal(record.icon));
    put(row, 'types', nonEmpty(record.types));
    put(row, 'functions', nonEmpty(record.functions));

    for (const [kind, field] of RELATIONSHIP_COUNT_FIELDS) {
      put(row, field, record.relationships?.[kind]);
    }

    put(row, 'questFlag', record.questFlag === true ? true : undefined);
    put(row, 'family', record.family || undefined);
    put(row, 'attack', record.projectileAttack);
    put(row, 'hp', record.recovery?.hp);
    put(row, 'mp', record.recovery?.mp);
    put(row, 'hpPercent', record.recovery?.hpPercent);
    put(row, 'mpPercent', record.recovery?.mpPercent);

    const pf = record.petFood;
    put(row, 'closeness', pf?.closeness);
    put(row, 'fullness', pf?.fullness);
    put(row, 'tameness', pf?.tameness);
    put(row, 'petTargets', resolveTargets(pf?.targets, names));
    put(row, 'unresolvedPetTargets', nonEmpty(pf?.unresolvedTargets));

    put(row, 'seatHp', record.seatingRecovery?.hp);
    put(row, 'seatMp', record.seatingRecovery?.mp);

    const sc = record.scroll;
    put(row, 'success', sc?.success);
    put(row, 'cursed', sc?.cursed);
    put(row, 'targetLabel', sc?.targetLabel);
    put(row, 'tier', sc?.tier);
    put(row, 'specials', nonEmpty(sc?.specials));
    put(
      row,
      'stats',
      sc?.deltas && Object.keys(sc.deltas).length ? sc.deltas : undefined,
    );
    put(row, 'statRank', computeStatRank(sc?.deltas));
    put(row, 'directTargetCount', sc?.targets?.length || undefined);

    return row;
  });
}
