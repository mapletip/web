/**
 * Deterministic synthetic Monster-like records for the Faceted Browser reference. Not real
 * game data; values come from a seeded PRNG so stories and screenshots are
 * stable.
 */
export interface SampleMonster {
  readonly id: string;
  readonly name: string;
  readonly href: string;
  /** `null` exercises the missing-sprite state. */
  readonly sprite: string | null;
  readonly boss: boolean;
  readonly level: number;
  /** `null` is unknown; `0` is a known zero. */
  readonly hp: number | null;
  readonly exp: number | null;
  readonly expPer100Hp: number | null;
  readonly weaponAttack: number | null;
  readonly magicAttack: number | null;
  readonly weaponDefense: number | null;
  readonly magicDefense: number | null;
  readonly accuracy: number | null;
  readonly avoidability: number | null;
}

export type SampleMonsterNumericField = Exclude<
  keyof SampleMonster,
  'id' | 'name' | 'href' | 'sprite' | 'boss'
>;

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const adjectives = [
  'Ember',
  'Frost',
  'Mossy',
  'Gilded',
  'Hollow',
  'Thorned',
  'Dusk',
  'Coral',
  'Rusted',
  'Lantern',
];
const nouns = [
  'Slime',
  'Sprout',
  'Golem',
  'Wisp',
  'Boar',
  'Drake',
  'Shade',
  'Crab',
  'Sentinel',
  'Moth',
];
const hues = [8, 32, 96, 142, 188, 220, 262, 300, 330, 54];

function sprite(index: number): string {
  const hue = hues[index % hues.length] ?? 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="18" r="11" fill="hsl(${hue} 60% 55%)"/><circle cx="12" cy="16" r="2" fill="#111"/><circle cx="20" cy="16" r="2" fill="#111"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, '-');
}

export function createSampleMonsters(
  count = 100,
  seed = 20261023,
): SampleMonster[] {
  const random = mulberry32(seed);
  const int = (min: number, max: number) =>
    Math.floor(min + random() * (max - min + 1));
  return Array.from({ length: count }, (_, index) => {
    const level = int(1, 120);
    const name =
      index === 7
        ? 'Ancient Overgrown Lantern-Bearing Sentinel of the Forgotten Coral Depths'
        : `${adjectives[index % adjectives.length] ?? ''} ${nouns[Math.floor(index / adjectives.length) % nouns.length] ?? ''}${index >= 100 ? ` ${index}` : ''}`;
    const hp =
      index % 17 === 3 ? null : Math.round(level ** 2.1 * (8 + random() * 6));
    const exp =
      index % 23 === 5 ? 0 : Math.round(level ** 1.6 * (2 + random() * 3));
    return {
      id: `m${String(index + 1).padStart(4, '0')}`,
      name,
      href: `/monsters/${slug(name)}-${String(index + 1).padStart(4, '0')}`,
      sprite: index % 11 === 4 ? null : sprite(index),
      boss: index % 19 === 0,
      level,
      hp,
      exp,
      expPer100Hp:
        hp && exp !== null ? Math.round((exp / hp) * 10000) / 100 : null,
      weaponAttack: int(5, 40) * Math.ceil(level / 4),
      magicAttack: index % 13 === 6 ? null : int(5, 40) * Math.ceil(level / 4),
      weaponDefense: index % 9 === 2 ? 0 : int(0, 30) * Math.ceil(level / 5),
      magicDefense: int(0, 30) * Math.ceil(level / 5),
      accuracy: int(10, 30) + level,
      avoidability:
        index % 29 === 8 ? null : int(0, 25) + Math.floor(level / 3),
    };
  });
}

export type SampleSortField = 'name' | SampleMonsterNumericField;
export interface SampleSort {
  readonly field: SampleSortField;
  readonly direction: 'asc' | 'desc';
}

/** Stand-in for the domain query layer (Orama in the app): unknown values sort last. */
export function sortSampleMonsters(
  records: readonly SampleMonster[],
  sort: SampleSort | null,
): SampleMonster[] {
  if (!sort) return [...records];
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...records].sort((left, right) => {
    const a = left[sort.field];
    const b = right[sort.field];
    if (a === null && b === null) return left.id.localeCompare(right.id);
    if (a === null) return 1;
    if (b === null) return -1;
    const compared =
      typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b)
        : Number(a) - Number(b);
    return compared === 0 ? left.id.localeCompare(right.id) : compared * factor;
  });
}
