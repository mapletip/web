import type { ItemBrowseCoverage } from '@mapletip/data/items';

import type { CategorizedItemRow, ItemBrowseScrollDeltas } from './project';

const TIERS = ['lesser', 'intermediate', 'greater', 'chaos'] as const;
const collator = new Intl.Collator('en-US');

const SCROLL_STAT_LABELS: Readonly<
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

function leadingStat({ row }: { readonly row: CategorizedItemRow }): string {
  const entries = Object.entries(row.stats ?? {});
  entries.sort(
    (left, right) => Math.abs(right[1] ?? 0) - Math.abs(left[1] ?? 0),
  );
  return entries[0]?.[0] ?? '';
}

function equipmentName(label: string): string {
  return label
    .split('-')
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
}

/** The card's lead line: its leading stat in sentence case ("Weapon attack"). */
function statLead({ row }: { readonly row: CategorizedItemRow }): string {
  const label =
    SCROLL_STAT_LABELS[leadingStat({ row }) as keyof ItemBrowseScrollDeltas];
  return label[0]!.toUpperCase() + label.slice(1);
}

function single(row: CategorizedItemRow): CategorizedItemRow {
  return {
    ...row,
    scrollMembers: [row],
    names: row.name ? [row.name] : [],
    scrollLead: statLead({ row }),
    scrollSort: row.targetLabel
      ? `0:${row.targetLabel}:${leadingStat({ row })}:${row.name}`
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
    if (!row.targetLabel || !row.tier || !leadingStat({ row })) {
      singles.push(single(row));
      continue;
    }
    const key = `${row.targetLabel}:${leadingStat({ row })}`;
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
      (left, right) => TIERS.indexOf(left.tier!) - TIERS.indexOf(right.tier!),
    );
    const first = members[0]!;
    singles.push({
      ...first,
      name: equipmentName(first.targetLabel!),
      scrollMembers: members,
      names: members.flatMap((row) => (row.name ? [row.name] : [])),
      scrollLead: statLead({ row: first }),
      scrollSort: `0:${first.targetLabel}:${leadingStat({ row: first })}`,
    });
  }
  return singles.sort(compare);
}

function compare(left: CategorizedItemRow, right: CategorizedItemRow): number {
  return collator.compare(left.scrollSort ?? '', right.scrollSort ?? '');
}
