import type { FacetDefinition } from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import {
  buildCashItemFacets,
  buildCashScopeFacets,
  buildPetFoodFacets,
} from './pet-facets';
import type { ItemRow } from './project';
import { buildRangeBuckets } from './range-buckets';
import type { ItemCategorySelection } from './routing';
import { buildUpgradeScrollFacets } from './scroll-facets';

function buildRangeFacet(
  field: string,
  label: string,
  values: readonly (number | undefined)[],
  options?: { quick?: boolean },
): FacetDefinition<ItemRow> | undefined {
  const numericValues = values.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  const buckets = buildRangeBuckets(numericValues);
  if (!buckets) {
    return undefined;
  }
  return {
    id: field,
    field,
    label,
    kind: 'range',
    buckets,
    ...(options?.quick ? { quick: true } : {}),
  };
}

function buildRecoveryFacets(
  scopedRows: readonly ItemRow[],
): readonly FacetDefinition<ItemRow>[] {
  const facets: FacetDefinition<ItemRow>[] = [];

  const hp = buildRangeFacet(
    'hp',
    'HP',
    scopedRows.map((r) => r.hp),
    { quick: true },
  );
  if (hp) facets.push(hp);

  const mp = buildRangeFacet(
    'mp',
    'MP',
    scopedRows.map((r) => r.mp),
    { quick: true },
  );
  if (mp) facets.push(mp);

  const hpPercent = buildRangeFacet(
    'hpPercent',
    'HP %',
    scopedRows.map((r) => r.hpPercent),
  );
  if (hpPercent) facets.push(hpPercent);

  const mpPercent = buildRangeFacet(
    'mpPercent',
    'MP %',
    scopedRows.map((r) => r.mpPercent),
  );
  if (mpPercent) facets.push(mpPercent);

  return facets;
}

function buildProjectileFacets(
  scopedRows: readonly ItemRow[],
): readonly FacetDefinition<ItemRow>[] {
  const attack = buildRangeFacet(
    'attack',
    'Attack',
    scopedRows.map((r) => r.attack),
    { quick: true },
  );
  return attack ? [attack] : [];
}

function buildQuestFlagFacet(
  scopedRows: readonly ItemRow[],
  quick?: boolean,
): FacetDefinition<ItemRow> | undefined {
  let flagCount = 0;
  for (const row of scopedRows) {
    if (row.questFlag === true) {
      flagCount += 1;
    }
  }
  if (flagCount > 0 && flagCount < scopedRows.length) {
    return {
      id: 'questFlag',
      field: 'questFlag',
      label: 'Quest item',
      kind: 'multi-select',
      options: [{ value: 'quest-flagged', label: 'Quest-flagged item' }],
      ...(quick ? { quick: true } : {}),
    };
  }
  return undefined;
}

function buildChairFacets(
  scopedRows: readonly ItemRow[],
): readonly FacetDefinition<ItemRow>[] {
  const facets: FacetDefinition<ItemRow>[] = [];

  const seatHp = buildRangeFacet(
    'seatHp',
    'Seated HP recovery',
    scopedRows.map((r) => r.seatHp),
    { quick: true },
  );
  if (seatHp) facets.push(seatHp);

  const seatMp = buildRangeFacet(
    'seatMp',
    'Seated MP recovery',
    scopedRows.map((r) => r.seatMp),
  );
  if (seatMp) facets.push(seatMp);

  return facets;
}

function buildSetupScopeFacets(
  scopedRows: readonly ItemRow[],
): readonly FacetDefinition<ItemRow>[] {
  const facets: FacetDefinition<ItemRow>[] = [];

  const seatHp = buildRangeFacet(
    'seatHp',
    'Seated HP recovery',
    scopedRows.map((r) => r.seatHp),
  );
  if (seatHp) facets.push(seatHp);

  const seatMp = buildRangeFacet(
    'seatMp',
    'Seated MP recovery',
    scopedRows.map((r) => r.seatMp),
  );
  if (seatMp) facets.push(seatMp);

  return facets;
}

type ContextFacetBuilder = (
  scopedRows: readonly ItemRow[],
  coverage: ItemBrowseCoverage,
  roster: readonly ItemRow[],
) => readonly FacetDefinition<ItemRow>[];

const CONTEXT_FACET_BUILDERS: Readonly<Record<string, ContextFacetBuilder>> = {
  'use:recovery': (rows) => buildRecoveryFacets(rows),
  'use:upgrade-scrolls': (rows, cov) => buildUpgradeScrollFacets(rows, cov),
  'use:throwing-stars': (rows) => buildProjectileFacets(rows),
  'use:arrows': (rows) => buildProjectileFacets(rows),
  'use:bullets': (rows) => buildProjectileFacets(rows),
  'use:pet-food': buildPetFoodFacets,
  'etc:quest-items': (rows) => {
    const qf = buildQuestFlagFacet(rows, true);
    return qf ? [qf] : [];
  },
  etc: (rows) => {
    const qf = buildQuestFlagFacet(rows, false);
    return qf ? [qf] : [];
  },
  'setup:chairs': (rows) => buildChairFacets(rows),
  setup: (rows) => buildSetupScopeFacets(rows),
  cash: buildCashScopeFacets,
  'cash:cash-items': buildCashItemFacets,
};

export function getContextualFacets(
  category: ItemCategorySelection,
  coverage: ItemBrowseCoverage,
  scopedRows: readonly ItemRow[],
  roster: readonly ItemRow[],
): readonly FacetDefinition<ItemRow>[] {
  const contextKey = category.child
    ? `${category.scope.slug}:${category.child.slug}`
    : category.scope.slug;

  const builder = CONTEXT_FACET_BUILDERS[contextKey];
  if (!builder) {
    return [];
  }
  return builder(scopedRows, coverage, roster);
}
