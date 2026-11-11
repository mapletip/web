/**
 * App-owned projection of a drop-summary Monster catalog into flat, sortable,
 * JSON-serializable browse rows.
 *
 * The mapping is deliberately explicit: contract-2 tuples are positional, so
 * every projected slot is named here by an index constant that mirrors the
 * published contract order. The contract's sprite fact stays separate from
 * displayable facts because only its known content ID affects the thumbnail.
 */
import { hasMonsterBrowseSummaries } from '@mapletip/data/monsters';
import type {
  MonsterCatalogV2_2,
  MonsterCatalogV2_3,
  MonsterDropBrowseV1,
  StaticMonsterCatalog,
} from '@mapletip/data/monsters';

type MonsterCatalogRecord =
  MonsterCatalogV2_2['records'][number] | MonsterCatalogV2_3['records'][number];

export type MonsterFactState = 'known' | 'unknown' | 'absent' | 'unsupported';
export type UnknownFactState = Exclude<MonsterFactState, 'known'>;

export interface MonsterDropEntry {
  readonly itemKey?: string;
  readonly itemRefState: string;
  readonly itemName: string;
  readonly itemCategory?: string;
  readonly assertionKind: 'native' | 'historical-overlay';
  readonly sourceBuild?: string;
}

export interface MonsterDropItemOption {
  readonly value: string;
  readonly label: string;
}

export interface MonsterDropFacts {
  readonly entries: readonly MonsterDropEntry[];
  /** Resolved stable item keys for the shared array facet. */
  readonly itemKeys: readonly string[];
}

/** Known Monster fields projected from the catalog, whether or not a surface
 * displays them. */
export type MonsterFactId =
  | 'name'
  | 'level'
  | 'hp'
  | 'mp'
  | 'exp'
  // Derived training ratio, not a catalog fact: see `expPer100Hp` below.
  | 'expPer100Hp'
  | 'physicalAttack'
  | 'physicalDefense'
  | 'magicAttack'
  | 'magicDefense'
  | 'accuracy'
  | 'avoidability'
  | 'pushed'
  | 'speed'
  | 'boss'
  | 'undead'
  | 'bodyAttack';

export interface MonsterBrowseRow extends Record<string, unknown> {
  /** SDK stable public key — the record identity, never the display name. */
  readonly key: string;
  /** Display name when known, otherwise an honest fallback label. */
  readonly name: string;
  /** Content ID for the representative sprite, present only when known. */
  readonly sprite?: string;
  // Numeric facts: present ONLY when the canonical state is `known`.
  readonly level?: number;
  readonly hp?: number;
  readonly mp?: number;
  readonly exp?: number;
  /**
   * Derived `EXP / HP × 100` training ratio, present only when both inputs are
   * known and HP is positive. The catalog carries no such field, so it never has
   * a source state of its own: whenever it cannot be computed it is `unknown`.
   */
  readonly expPer100Hp?: number;
  readonly physicalAttack?: number;
  readonly physicalDefense?: number;
  readonly magicAttack?: number;
  readonly magicDefense?: number;
  readonly accuracy?: number;
  readonly avoidability?: number;
  readonly pushed?: number;
  readonly speed?: number;
  // Boolean facts: present ONLY when `known`. `false` is a real value.
  readonly boss?: boolean;
  readonly undead?: boolean;
  readonly bodyAttack?: boolean;
  readonly drops: MonsterDropFacts;
  /**
   * Canonical state for every projected fact whose state is NOT `known`.
   * A missing key means `known`. This is what keeps `unknown`, `absent` and
   * `unsupported` from collapsing into one another.
   */
  readonly factStates: Readonly<
    Partial<Record<MonsterFactId, UnknownFactState>>
  >;
}

/**
 * `record.stats` — contract-ordered 12-tuple of `CatalogFact<number>`.
 *
 * Deliberately NOT projected from `record.traits`:
 * - traits[3] `firstAttack`: authoritative, but numerically meaningless for a
 *   browse comparison.
 * - traits[4] `hideLevel`: `unknown` for 100% of the `gms-v83` records.
 * - traits[5] `hideName`: `unknown` for 100% of the `cw-launch` records.
 * - traits[6] `summonType`, traits[7] `category`, traits[8] `mobTypeRaw`: raw
 *   source codes the contract does not canonicalise (`category` is `unknown`
 *   for every `gms-v83` record, `mobTypeRaw` for half of them).
 * - `record.elements` / `record.relationships`: their collection state is never
 *   `known` in this release, so any derived count would present incomplete data
 *   as complete.
 */
const STAT = {
  level: 0,
  hp: 1,
  mp: 2,
  exp: 3,
  physicalAttack: 4,
  physicalDefense: 5,
  magicAttack: 6,
  magicDefense: 7,
  accuracy: 8,
  avoidability: 9,
  pushed: 10,
  speed: 11,
} as const;

/** `record.traits` — contract-ordered 9-tuple; only the first three are booleans. */
const TRAIT = {
  boss: 0,
  undead: 1,
  bodyAttack: 2,
} as const;

export const UNNAMED_MONSTER_LABEL = 'Unnamed monster';

const UNKNOWN_FACT_LABELS: Readonly<Record<UnknownFactState, string>> = {
  unknown: 'Unknown',
  absent: 'Not recorded',
  unsupported: 'Unavailable',
};

/**
 * Read one fact, recording any non-`known` state instead of inventing a value.
 * `undefined` therefore always means "no authoritative value", never `0`/`false`.
 */
function readFact<T>(
  fact:
    | { readonly state: 'known'; readonly value: T }
    | { readonly state: UnknownFactState },
  id: MonsterFactId,
  factStates: Partial<Record<MonsterFactId, UnknownFactState>>,
): T | undefined {
  if (fact.state === 'known') return fact.value;
  factStates[id] = fact.state;
  return undefined;
}

function projectRecord(
  record: MonsterCatalogRecord,
  dropBrowse: MonsterDropBrowseV1,
): MonsterBrowseRow {
  const factStates: Partial<Record<MonsterFactId, UnknownFactState>> = {};

  const name = readFact<string>(record.name, 'name', factStates);
  const sprite =
    record.sprite.state === 'known' ? record.sprite.value : undefined;
  const level = readFact<number>(record.stats[STAT.level], 'level', factStates);
  const hp = readFact<number>(record.stats[STAT.hp], 'hp', factStates);
  const mp = readFact<number>(record.stats[STAT.mp], 'mp', factStates);
  const exp = readFact<number>(record.stats[STAT.exp], 'exp', factStates);
  // A training ratio the contract does not carry: derived from the two facts it
  // does. Both inputs must be known and HP positive, so an unknown input never
  // becomes a fabricated ratio and a known zero HP never divides by zero.
  const expPer100Hp =
    hp !== undefined && exp !== undefined && hp > 0
      ? (exp / hp) * 100
      : undefined;
  if (expPer100Hp === undefined) {
    // The ratio has no source state to preserve, so `unknown` is the whole truth
    // here — including when HP is a known zero (there is no finite ratio).
    factStates.expPer100Hp = 'unknown';
  }
  const physicalAttack = readFact<number>(
    record.stats[STAT.physicalAttack],
    'physicalAttack',
    factStates,
  );
  const physicalDefense = readFact<number>(
    record.stats[STAT.physicalDefense],
    'physicalDefense',
    factStates,
  );
  const magicAttack = readFact<number>(
    record.stats[STAT.magicAttack],
    'magicAttack',
    factStates,
  );
  const magicDefense = readFact<number>(
    record.stats[STAT.magicDefense],
    'magicDefense',
    factStates,
  );
  const accuracy = readFact<number>(
    record.stats[STAT.accuracy],
    'accuracy',
    factStates,
  );
  const avoidability = readFact<number>(
    record.stats[STAT.avoidability],
    'avoidability',
    factStates,
  );
  const pushed = readFact<number>(
    record.stats[STAT.pushed],
    'pushed',
    factStates,
  );
  const speed = readFact<number>(record.stats[STAT.speed], 'speed', factStates);

  const boss = readFact<boolean>(record.traits[TRAIT.boss], 'boss', factStates);
  const undead = readFact<boolean>(
    record.traits[TRAIT.undead],
    'undead',
    factStates,
  );
  const bodyAttack = readFact<boolean>(
    record.traits[TRAIT.bodyAttack],
    'bodyAttack',
    factStates,
  );

  const dropEntries = projectDropEntries(dropBrowse, record.key);

  return {
    key: record.key,
    name: name ?? UNNAMED_MONSTER_LABEL,
    factStates,
    drops: {
      entries: dropEntries,
      itemKeys: Array.from(
        new Set(
          dropEntries.flatMap((entry) =>
            entry.itemKey === undefined ? [] : [entry.itemKey],
          ),
        ),
      ),
    },
    ...(sprite === undefined ? {} : { sprite }),
    ...(level === undefined ? {} : { level }),
    ...(hp === undefined ? {} : { hp }),
    ...(mp === undefined ? {} : { mp }),
    ...(exp === undefined ? {} : { exp }),
    ...(expPer100Hp === undefined ? {} : { expPer100Hp }),
    ...(physicalAttack === undefined ? {} : { physicalAttack }),
    ...(physicalDefense === undefined ? {} : { physicalDefense }),
    ...(magicAttack === undefined ? {} : { magicAttack }),
    ...(magicDefense === undefined ? {} : { magicDefense }),
    ...(accuracy === undefined ? {} : { accuracy }),
    ...(avoidability === undefined ? {} : { avoidability }),
    ...(pushed === undefined ? {} : { pushed }),
    ...(speed === undefined ? {} : { speed }),
    ...(boss === undefined ? {} : { boss }),
    ...(undead === undefined ? {} : { undead }),
    ...(bodyAttack === undefined ? {} : { bodyAttack }),
  };
}

/**
 * Project EVERY record in the catalog — no slicing, filtering or sampling.
 *
 * The SDK already rejects a catalog whose declared record count disagrees with
 * its records, so this only guards the contract this projection understands.
 */
export function projectMonsterBrowseRows(
  catalog: StaticMonsterCatalog,
  dropBrowse: MonsterDropBrowseV1,
): readonly MonsterBrowseRow[] {
  if (!hasMonsterBrowseSummaries(catalog)) {
    throw new Error(
      'Monster browse requires a Monster catalog with drop summaries.',
    );
  }

  return catalog.records.map((record) => projectRecord(record, dropBrowse));
}

function projectDropEntries(
  dropBrowse: MonsterDropBrowseV1,
  monsterKey: string,
): readonly MonsterDropEntry[] {
  const record = dropBrowse.records[monsterKey];
  if (record === undefined) return [];

  return record.entries.map((entry) => {
    const item = dropBrowse.items[entry.item];
    if (item === undefined) {
      throw new Error(
        `Monster drop browse entry for ${monsterKey} references missing item index ${entry.item}.`,
      );
    }
    const itemKey =
      item.itemRef.state === 'resolved' &&
      typeof item.itemRef.key === 'string' &&
      item.itemRef.key.length > 0
        ? item.itemRef.key
        : undefined;
    let category: string | undefined;
    if (item.category.kind === 'equip-slot') {
      category = 'equipment';
    } else if (item.category.kind === 'item-class') {
      category = item.category.value;
    }

    return {
      ...(itemKey === undefined ? {} : { itemKey }),
      itemRefState: item.itemRef.state,
      itemName: formatDropItemName(item.itemName),
      ...(category === undefined ? {} : { itemCategory: category }),
      assertionKind: entry.assertionKind,
      ...(entry.assertionKind === 'historical-overlay'
        ? {
            sourceBuild: entry.sourceBuild,
          }
        : {}),
    };
  });
}

function formatDropItemName(
  fact: MonsterDropBrowseV1['items'][number]['itemName'],
): string {
  if (fact.state === 'known') return fact.value;
  if (fact.state === 'unknown') return 'Unknown item name';
  if (fact.state === 'absent') return 'Item name not recorded';
  return 'Item name unavailable';
}

/** Unique, key-valued options for the shared FacetedBrowser item facet. */
export function projectMonsterDropItemOptions(
  dropBrowse: MonsterDropBrowseV1,
): readonly MonsterDropItemOption[] {
  const resolved = dropBrowse.items.flatMap((item) => {
    const key = item.itemRef.key;
    if (
      item.itemRef.state !== 'resolved' ||
      typeof key !== 'string' ||
      key.length === 0
    ) {
      return [];
    }
    return [{ value: key, label: formatDropItemName(item.itemName) }];
  });

  const labelCounts = new Map<string, number>();
  for (const option of resolved) {
    labelCounts.set(option.label, (labelCounts.get(option.label) ?? 0) + 1);
  }

  return resolved
    .map((option) => ({
      value: option.value,
      label:
        labelCounts.get(option.label) === 1
          ? option.label
          : `${option.label} (${option.value})`,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

const RATIO_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

/**
 * A positive ratio below display precision reads as a threshold instead of
 * rounding to a false zero; a genuine zero still reads `0`.
 */
function formatMonsterRatio(value: number): string {
  if (value === 0) return '0';
  if (value > 0 && value < 0.01) return '<0.01';
  return RATIO_FORMATTER.format(value);
}

/**
 * The single honest display helper for a projected fact.
 *
 * A source-backed non-`known` state never renders as `0` or `No`: it renders the
 * state itself, because `unknown`, `absent` and `unsupported` say different
 * things about the source data.
 *
 * The derived `EXP / 100 HP` ratio is the one exception: it has no source state
 * of its own, so it is either computable or not, and an unavailable ratio shows
 * a dash rather than a word in an otherwise numeric column.
 */
export function formatMonsterFact(
  row: MonsterBrowseRow,
  factId: MonsterFactId,
): string {
  const value = row[factId];
  if (typeof value === 'number') {
    return factId === 'expPer100Hp'
      ? formatMonsterRatio(value)
      : value.toLocaleString('en-US');
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') return value;

  if (factId === 'expPer100Hp') return '-';

  const state = row.factStates[factId];
  if (state === undefined) return UNKNOWN_FACT_LABELS.unknown;
  return UNKNOWN_FACT_LABELS[state];
}
