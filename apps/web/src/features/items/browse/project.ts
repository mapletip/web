/**
 * App-owned projection of SDK Item browse records into flat, sortable,
 * JSON-serializable browse rows.
 *
 * Absent values are omitted (undefined means "no value"; never coerce to 0).
 */
import type {
  ItemBrowseCoverage,
  ItemBrowseRecordV2_2,
  ItemBrowseRowV2_2,
} from '@mapletip/data/items';

import { assignItemKind } from '../kinds';

type Fact = ItemBrowseRowV2_2['name'];
type Scroll = NonNullable<ItemBrowseRecordV2_2['scroll']>;
type ItemBrowseClass = ItemBrowseRecordV2_2['itemClass'];
export type ItemBrowseType = NonNullable<ItemBrowseRecordV2_2['types']>[number];
type ItemBrowseFunction = NonNullable<
  ItemBrowseRecordV2_2['functions']
>[number];
export type ItemBrowseScrollDeltas = NonNullable<Scroll['deltas']>;
export type ItemBrowseUpgradeTarget = NonNullable<Scroll['targetLabel']>;
type ItemBrowseUpgradeTier = NonNullable<Scroll['tier']>;
type ItemBrowseUpgradeSpecial = NonNullable<Scroll['specials']>[number];
type ItemRelationshipKind = keyof ItemBrowseCoverage['relationships'];

export type ItemRow = {
  readonly key: string;
  readonly sourceId: string;
  readonly itemClass: ItemBrowseClass;
  readonly name: string;
  readonly icon?: string;
  readonly types?: readonly ItemBrowseType[];
  readonly functions?: readonly ItemBrowseFunction[];
  readonly cashShopListingCount?: number;
  readonly nxPrice?: number;
  readonly monsterDropCount?: number;
  readonly neededForQuestCount?: number;
  readonly questRewardCount?: number;
  readonly usedInRecipeCount?: number;
  readonly questFlag?: boolean;
  readonly hp?: number;
  readonly mp?: number;
  readonly hpPercent?: number;
  readonly mpPercent?: number;
  readonly attack?: number;
  readonly fullness?: number;
  readonly seatHp?: number;
  readonly seatMp?: number;
  readonly success?: number;
  readonly cursed?: number;
  readonly targetLabel?: ItemBrowseUpgradeTarget;
  readonly tier?: ItemBrowseUpgradeTier;
  readonly specials?: readonly ItemBrowseUpgradeSpecial[];
  readonly stats?: Readonly<ItemBrowseScrollDeltas>;
  readonly sellPrice?: number;
  readonly maxStack?: number;
  readonly level?: number;
  readonly buff?: NonNullable<ItemBrowseRecordV2_2['buff']>;
  readonly scrollLead?: string;
};

type WritableItemRow = { -readonly [K in keyof ItemRow]: ItemRow[K] };

/** A projected row with its category, set once here and read everywhere else. */
export type CategorizedItemRow = ItemRow & {
  readonly kind: string;
  readonly kindPath: readonly [string, string, string];
  readonly scrollMembers?: readonly CategorizedItemRow[];
  readonly versions?: readonly CategorizedItemRow[];
  readonly names?: readonly string[];
  readonly scrollSort?: string;
  readonly scrollStats?: readonly (keyof ItemBrowseScrollDeltas)[];
};

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

const RELATIONSHIP_COUNT_FIELDS = [
  ['cash-shop-listing', 'cashShopListingCount'],
  ['monster-drop', 'monsterDropCount'],
  ['needed-for-quest', 'neededForQuestCount'],
  ['quest-reward', 'questRewardCount'],
  ['used-in-recipe', 'usedInRecipeCount'],
] as const satisfies readonly (readonly [
  ItemRelationshipKind,
  keyof ItemRow,
])[];

export function projectItemBrowseRows(
  records: readonly ItemBrowseRowV2_2[],
): readonly CategorizedItemRow[] {
  // Name order up front: TanStack breaks sort ties by row order, so any
  // other sort (such as Chairs' Recovery) lists equal values A–Z.
  return records
    .flatMap((record): CategorizedItemRow[] => {
      const name = extractKnownFact(record.name);
      if (name === undefined) return [];
      const row: WritableItemRow = {
        key: record.key,
        sourceId: record.sourceId,
        itemClass: record.itemClass,
        name,
      };

      setField(row, 'icon', extractKnownFact(record.icon));
      setField(row, 'types', filterNonEmptyArray(record.types));
      setField(row, 'functions', filterNonEmptyArray(record.functions));

      if (record.relationships) {
        for (const [relationshipKind, fieldKey] of RELATIONSHIP_COUNT_FIELDS) {
          setField(row, fieldKey, record.relationships[relationshipKind]);
        }
      }

      setField(row, 'questFlag', record.questFlag);
      setField(row, 'attack', record.projectileAttack);
      setField(row, 'hp', record.recovery?.hp);
      setField(row, 'mp', record.recovery?.mp);
      setField(row, 'hpPercent', record.recovery?.hpPercent);
      setField(row, 'mpPercent', record.recovery?.mpPercent);

      const petFood = record.petFood;
      setField(row, 'fullness', petFood?.fullness);

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
      setField(row, 'sellPrice', record.sellPrice);
      setField(row, 'maxStack', record.maxStack);
      setField(row, 'level', record.requirement?.level);
      setField(
        row,
        'nxPrice',
        record.cashShopSale?.state === 'on-sale'
          ? record.cashShopSale.price
          : undefined,
      );
      setField(row, 'buff', record.buff);

      const kind = assignItemKind({ row });
      if (kind === undefined) {
        throw new Error(`No category for item ${record.sourceId}.`);
      }
      const categorized: CategorizedItemRow = {
        ...row,
        kind: kind.id,
        kindPath: ['all', kind.group, kind.id],
      };
      return [categorized];
    })
    .sort((left, right) => nameCollator.compare(left.name, right.name));
}

const nameCollator = new Intl.Collator('en-US');
