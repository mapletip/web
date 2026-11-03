export interface DemoRecord extends Record<string, unknown> {
  readonly id: string;
  readonly name: string;
  readonly href: string;
  readonly category: string;
  readonly region: string;
  readonly rarity: string;
  readonly tradeable: boolean;
  readonly level: number | null;
  readonly attack: number | null;
  readonly defense: number | null;
  readonly speed: number | null;
}

export const demoCategories = [
  'Sword',
  'Bow',
  'Staff',
  'Dagger',
  'Claw',
  'Knuckle',
  'Polearm',
  'Wand',
] as const;

export const demoRegions = [
  'Maple Island',
  'Victoria Island',
  'Ludibrium',
  'Leafre',
  'El Nath',
  'Orbis',
  'Aqua Road',
  'Temple of Time',
] as const;

export const demoRarities = [
  'Common',
  'Rare',
  'Epic',
  'Unique',
  'Legendary',
] as const;

function deterministicMetric(index: number, salt: number): number {
  let state = (index + 1) * 0x9e3779b9 + salt * 0x6d2b79f5;
  state = Math.imul(state ^ (state >>> 15), state | 1);
  state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
  return ((state ^ (state >>> 14)) >>> 0) / 4_294_967_296;
}

function pick<const T extends readonly string[]>(
  index: number,
  salt: number,
  values: T,
): T[number] {
  const offset = Math.floor(deterministicMetric(index, salt) * values.length);
  return values[offset] ?? values[0]!;
}

function stat(index: number, salt: number, scale: number): number {
  return Math.round(deterministicMetric(index, salt) * scale);
}

function nullableStat(
  index: number,
  salt: number,
  scale: number,
  missingEvery: number,
): number | null {
  return index % missingEvery === 0 ? null : stat(index, salt, scale);
}

/**
 * Synthetic, deterministic records for the local FacetedBrowser demonstration.
 * This is not canonical MapleTip game data and does not fetch anything.
 */
export const demoRecords: readonly DemoRecord[] = Array.from(
  { length: 48 },
  (_, index) => {
    const id = String(index + 1).padStart(3, '0');
    const category = pick(index, 11, demoCategories);
    return {
      id,
      name: `Demo ${category} ${id}`,
      href: `#record-${id}`,
      category,
      region: pick(index, 12, demoRegions),
      rarity: pick(index, 13, demoRarities),
      tradeable: deterministicMetric(index, 14) > 0.28,
      level: stat(index, 1, 200),
      attack: nullableStat(index, 2, 450, 13),
      defense: nullableStat(index, 3, 320, 17),
      speed: nullableStat(index, 4, 24, 19),
    };
  },
);
