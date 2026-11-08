/** Numeric and yes/no facet declarations for Items Browse. */
import type { ItemRow } from './project';

export interface RangeFacetConfig {
  readonly kind: 'range';
  readonly label: string;
  readonly getValue: (row: ItemRow) => number | undefined;
  readonly unit?: string;
  readonly quick?: boolean;
}

export interface BooleanFacetConfig {
  readonly kind: 'boolean';
  readonly label: string;
  readonly getValue: (row: ItemRow) => boolean | undefined;
  readonly quick?: boolean;
}

export type NumericFacetConfig = RangeFacetConfig | BooleanFacetConfig;

export const ITEM_NUMERIC_FACET_CONFIGS = {
  scrollDirect: {
    kind: 'boolean',
    label: 'Targets',
    getValue: (row) => Boolean(row.directTargetCount),
  },
  questFlag: {
    kind: 'boolean',
    label: 'Quest item',
    getValue: (row) => row.questFlag,
    quick: true,
  },
  hp: { kind: 'range', label: 'HP', getValue: (row) => row.hp, quick: true },
  mp: { kind: 'range', label: 'MP', getValue: (row) => row.mp, quick: true },
  hpPercent: {
    kind: 'range',
    label: 'HP %',
    getValue: (row) => row.hpPercent,
    unit: '%',
  },
  mpPercent: {
    kind: 'range',
    label: 'MP %',
    getValue: (row) => row.mpPercent,
    unit: '%',
  },
  attack: {
    kind: 'range',
    label: 'Attack',
    getValue: (row) => row.attack,
    quick: true,
  },
  closeness: {
    kind: 'range',
    label: 'Closeness',
    getValue: (row) => row.closeness,
    quick: true,
  },
  fullness: {
    kind: 'range',
    label: 'Fullness',
    getValue: (row) => row.fullness,
  },
  tameness: {
    kind: 'range',
    label: 'Tameness',
    getValue: (row) => row.tameness,
  },
  seatHp: {
    kind: 'range',
    label: 'Seated HP recovery',
    getValue: (row) => row.seatHp,
    quick: true,
  },
  seatMp: {
    kind: 'range',
    label: 'Seated MP recovery',
    getValue: (row) => row.seatMp,
  },
} satisfies Record<string, NumericFacetConfig>;
