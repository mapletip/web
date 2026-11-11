/** Numeric and yes/no facet declarations for Items Browse. */
import type { FacetRangeBucket } from '@mapletip/component-library';

import type { ItemRow } from './project';

export interface RangeFacetConfig {
  readonly kind: 'range';
  readonly label: string;
  readonly getValue: (row: ItemRow) => number | undefined;
  readonly buckets: readonly FacetRangeBucket[] | 'quantile';
  readonly valuePrefix?: string;
  readonly unit?: string;
}

export interface BooleanFacetConfig {
  readonly kind: 'boolean';
  readonly label: string;
  readonly getValue: (row: ItemRow) => boolean | undefined;
}

export type NumericFacetConfig = RangeFacetConfig | BooleanFacetConfig;

const RECOVERY_BUCKETS = [
  { value: '1-99', label: '1–99', min: 1, max: 99 },
  { value: '100-299', label: '100–299', min: 100, max: 299 },
  { value: '300-599', label: '300–599', min: 300, max: 599 },
  { value: '600-999', label: '600–999', min: 600, max: 999 },
  { value: '1000-1999', label: '1000–1999', min: 1000, max: 1999 },
  { value: '2000+', label: '2000+', min: 2000 },
] as const satisfies readonly FacetRangeBucket[];

const CHAIR_HP_BUCKETS = [
  { value: '1-29', label: '1–29', min: 1, max: 29 },
  { value: '30-39', label: '30–39', min: 30, max: 39 },
  { value: '40-49', label: '40–49', min: 40, max: 49 },
  { value: '50-59', label: '50–59', min: 50, max: 59 },
  { value: '60+', label: '60+', min: 60 },
] as const satisfies readonly FacetRangeBucket[];

const CHAIR_MP_BUCKETS = [
  { value: '1-19', label: '1–19', min: 1, max: 19 },
  { value: '20-29', label: '20–29', min: 20, max: 29 },
  { value: '30-39', label: '30–39', min: 30, max: 39 },
  { value: '40-59', label: '40–59', min: 40, max: 59 },
  { value: '60+', label: '60+', min: 60 },
] as const satisfies readonly FacetRangeBucket[];

function hasNoRecordedValue(value: number | undefined): boolean {
  return value === undefined || value === 0;
}

export const ITEM_NUMERIC_FACET_CONFIGS = {
  noRecordedQuestOrRecipeUse: {
    kind: 'boolean',
    label: 'No recorded quest or recipe use',
    getValue: (row) =>
      hasNoRecordedValue(row.neededForQuestCount) &&
      hasNoRecordedValue(row.usedInRecipeCount),
  },
  percentageRecovery: {
    kind: 'boolean',
    label: 'Percentage recovery',
    getValue: (row) =>
      row.hpPercent !== undefined || row.mpPercent !== undefined,
  },
  hp: {
    kind: 'range',
    label: 'HP restored',
    getValue: (row) => row.hp,
    buckets: RECOVERY_BUCKETS,
  },
  mp: {
    kind: 'range',
    label: 'MP restored',
    getValue: (row) => row.mp,
    buckets: RECOVERY_BUCKETS,
  },
  attack: {
    kind: 'range',
    label: 'Attack',
    getValue: (row) => row.attack,
    buckets: 'quantile',
    valuePrefix: '+',
  },
  seatHp: {
    kind: 'range',
    label: 'Seated HP',
    getValue: (row) => row.seatHp,
    buckets: CHAIR_HP_BUCKETS,
  },
  seatMp: {
    kind: 'range',
    label: 'Seated MP',
    getValue: (row) => row.seatMp,
    buckets: CHAIR_MP_BUCKETS,
  },
} satisfies Record<string, NumericFacetConfig>;
