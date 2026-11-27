import type { ItemBrowseCoverage } from '@mapletip/data/items';

import type { CategorizedItemRow, ItemBrowseScrollDeltas } from './project';

const TIERS = ['lesser', 'intermediate', 'greater', 'chaos'] as const;
const collator = new Intl.Collator('en-US');

export const SCROLL_STAT_LABELS: Readonly<
  Record<keyof ItemBrowseScrollDeltas, string>
> = {
  accuracy: 'accuracy',
  avoidability: 'avoidability',
  craft: 'craft',
  criticalDamage: 'critical damage',
  criticalRate: 'critical rate',
  dexterity: 'dexterity',
  intelligence: 'intelligence',
  jump: 'jump',
  luck: 'luck',
  magicAttack: 'magic attack',
  magicDefense: 'magic defense',
  maxHp: 'max HP',
  maxMp: 'max MP',
  speed: 'speed',
  strength: 'strength',
  swim: 'swim',
  weaponAttack: 'weapon attack',
  weaponDefense: 'weapon defense',
};

type ItemBrowseScrollStat = keyof ItemBrowseScrollDeltas;

export function scrollChanges({
  stats,
}: {
  readonly stats: Readonly<ItemBrowseScrollDeltas> | undefined;
}): readonly string[] {
  if (!stats) return [];
  return (
    Object.entries(stats) as [keyof ItemBrowseScrollDeltas, number | null][]
  )
    .filter(
      (entry): entry is [keyof ItemBrowseScrollDeltas, number] =>
        entry[1] !== null && entry[1] !== 0,
    )
    .sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]))
    .map(
      ([stat, value]) =>
        `${value > 0 ? '+' : ''}${value} ${SCROLL_STAT_LABELS[stat]}`,
    );
}

function leadingStat({
  row,
}: {
  readonly row: CategorizedItemRow;
}): ItemBrowseScrollStat | undefined {
  const entries = Object.entries(row.stats ?? {}) as [
    ItemBrowseScrollStat,
    number | null,
  ][];
  entries.sort(
    (left, right) => Math.abs(right[1] ?? 0) - Math.abs(left[1] ?? 0),
  );
  return entries.find(([, value]) => value !== null && value !== 0)?.[0];
}

export function equipmentName({
  label,
}: {
  readonly label: NonNullable<CategorizedItemRow['targetLabel']>;
}): string {
  return label
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** The card's lead line: its leading stat in sentence case ("Weapon attack"). */
function statLead({
  row,
}: {
  readonly row: CategorizedItemRow;
}): string | undefined {
  const stat = leadingStat({ row });
  if (stat === undefined) return undefined;
  const label = SCROLL_STAT_LABELS[stat];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const SCROLL_STAT_KEYS = Object.keys(
  SCROLL_STAT_LABELS,
) as ItemBrowseScrollStat[];

function scrollStats({
  rows,
}: {
  readonly rows: readonly CategorizedItemRow[];
}): readonly ItemBrowseScrollStat[] {
  return SCROLL_STAT_KEYS.filter((stat) =>
    rows.some((row) => {
      const value = row.stats?.[stat];
      return value !== undefined && value !== null && value !== 0;
    }),
  );
}

function single(row: CategorizedItemRow): CategorizedItemRow {
  const lead = statLead({ row });
  return {
    ...row,
    scrollMembers: [row],
    names: row.name ? [row.name] : [],
    ...(lead === undefined ? {} : { scrollLead: lead }),
    scrollStats: scrollStats({ rows: [row] }),
    scrollSort: row.targetLabel
      ? `0:${row.targetLabel}:${leadingStat({ row }) ?? ''}:${row.name}`
      : `1:${row.name}`,
  };
}

/** Group only published, unambiguous tiers; preserve every ambiguous row. */
export function groupScrollFamilies({
  rows,
  coverage,
}: {
  readonly rows: readonly CategorizedItemRow[];
  readonly coverage: ItemBrowseCoverage | undefined;
}): readonly CategorizedItemRow[] {
  if (coverage?.scrollTier !== 'complete')
    return rows.map(single).sort(compare);
  const candidates = new Map<string, CategorizedItemRow[]>();
  const singles: CategorizedItemRow[] = [];
  for (const row of rows) {
    const stat = leadingStat({ row });
    if (!row.targetLabel || !row.tier || stat === undefined) {
      singles.push(single(row));
      continue;
    }
    const key = `${row.targetLabel}:${stat}`;
    const members = candidates.get(key) ?? [];
    members.push(row);
    candidates.set(key, members);
  }
  for (const members of candidates.values()) {
    if (new Set(members.map((row) => row.tier)).size !== members.length) {
      singles.push(...members.map(single));
      continue;
    }
    members.sort(
      (left, right) =>
        TIERS.indexOf(left.tier ?? 'lesser') -
        TIERS.indexOf(right.tier ?? 'lesser'),
    );
    const first = members[0];
    const targetLabel = first?.targetLabel;
    if (first === undefined || targetLabel === undefined) {
      singles.push(...members.map(single));
      continue;
    }
    const familyStats = scrollStats({ rows: members });
    const familyNames = members.flatMap((row) => (row.name ? [row.name] : []));
    const familyLead = statLead({ row: first });
    const familyMembers = members.map((member) => ({
      ...member,
      scrollMembers: members,
      names: familyNames,
      scrollStats: familyStats,
    }));
    singles.push({
      ...first,
      name: equipmentName({ label: targetLabel }),
      scrollMembers: familyMembers,
      names: familyNames,
      scrollStats: familyStats,
      ...(familyLead === undefined ? {} : { scrollLead: familyLead }),
      scrollSort: `0:${targetLabel}:${leadingStat({ row: first }) ?? ''}`,
    });
  }
  return singles.sort(compare);
}

function compare(left: CategorizedItemRow, right: CategorizedItemRow): number {
  return collator.compare(left.scrollSort ?? '', right.scrollSort ?? '');
}
