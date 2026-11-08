/** Facet derivation and query-field registration for Items Browse. */
import type {
  FacetDefinition,
  FacetOption,
  QueryFieldDefinition,
} from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import {
  CATEGORICAL_FACETS,
  RANGE_FACETS,
  type CategoricalContext,
  type CategoricalFacetConfig,
  type ItemFacetField,
  type RangeFacetConfig,
  getItemRelationships,
} from './facet-config';
import { getItemFacetFields } from './facet-contexts';
import { buildPetLabels } from './pet-labels';
import type { ItemRow } from './project';
import { buildRangeBuckets } from './range-buckets';
import type { ItemCategorySelection } from './routing';
import { matchSourceId } from './search';

const CATEGORICAL_FACET_MAP = new Map<string, CategoricalFacetConfig>(
  CATEGORICAL_FACETS.map((facet): readonly [string, CategoricalFacetConfig] => [
    facet.field,
    facet,
  ]),
);
const RANGE_FACET_MAP = new Map<string, RangeFacetConfig>(
  RANGE_FACETS.map((facet): readonly [string, RangeFacetConfig] => [
    facet.field,
    facet,
  ]),
);

/** The sole query-field list includes facet values and hidden exact item IDs. */
export const ITEM_QUERY_FIELDS: readonly QueryFieldDefinition<ItemRow>[] = [
  ...CATEGORICAL_FACETS.map((facet) => ({
    id: facet.field,
    accessor: facet.values,
    getUniqueValues: facet.values,
  })),
  ...RANGE_FACETS.map((facet) => ({
    id: facet.field,
    accessor: facet.getValue,
  })),
  {
    id: 'sourceId',
    accessor: (row) => row.sourceId,
    searchMatch: ({ value, query }) =>
      typeof value === 'string' && matchSourceId({ sourceId: value, query }),
  },
];

export { getItemRelationships };

function getContextFacetFields({
  category,
}: {
  readonly category: ItemCategorySelection;
}): readonly ItemFacetField[] {
  if (
    category.child &&
    !category.scope.children.some(
      (child) => child.slug === category.child?.slug,
    )
  ) {
    throw new Error(
      `Item facet context ${category.scope.slug}:${category.child.slug} is not registered in its scope.`,
    );
  }
  return getItemFacetFields({
    scope: category.scope.slug,
    childSlug: category.child?.slug,
  });
}

interface DeriveCategoricalFacetOptions {
  readonly config: CategoricalFacetConfig;
  readonly rows: readonly ItemRow[];
  readonly context: CategoricalContext;
}

function deriveCategoricalFacet({
  config,
  rows,
  context,
}: DeriveCategoricalFacetOptions): FacetDefinition<ItemRow> | undefined {
  const total = rows.length;
  if (total === 0) return undefined;

  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const value of config.values(row)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  const options: FacetOption[] = [];
  for (const [value, count] of counts) {
    if (count === 0 || count === total) continue;
    const label =
      typeof config.optionLabel === 'function'
        ? config.optionLabel(value, context)
        : config.optionLabel[value];
    if (label !== undefined) options.push({ value, label });
  }
  if (options.length === 0) return undefined;

  const sorter = config.sortOrder;
  if (typeof sorter === 'function') {
    options.sort((left, right) => sorter(left.value, right.value));
  } else if (sorter) {
    const order = new Map(sorter.map((value, index) => [value, index]));
    options.sort(
      (left, right) =>
        (order.get(left.value) ?? Infinity) -
          (order.get(right.value) ?? Infinity) ||
        left.label.localeCompare(right.label),
    );
  } else {
    options.sort((left, right) => left.label.localeCompare(right.label));
  }

  return {
    id: config.field,
    field: config.field,
    label: config.label,
    kind: 'multi-select',
    ...(config.quick ? { quick: true } : {}),
    options,
  };
}

interface DeriveRangeFacetOptions {
  readonly config: RangeFacetConfig;
  readonly rows: readonly ItemRow[];
}

function deriveRangeFacet({
  config,
  rows,
}: DeriveRangeFacetOptions): FacetDefinition<ItemRow> | undefined {
  const values = rows
    .map((row) => config.getValue(row))
    .filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value),
    );
  const buckets = buildRangeBuckets({ values, unit: config.unit });
  if (!buckets) return undefined;
  return {
    id: config.field,
    field: config.field,
    label: config.label,
    kind: 'range',
    buckets,
    ...(config.quick ? { quick: true } : {}),
  };
}

export interface GetItemFacetsOptions {
  readonly category: ItemCategorySelection;
  readonly coverage: ItemBrowseCoverage;
  readonly rows: readonly ItemRow[];
  readonly roster: readonly ItemRow[];
}

/** Derives the active category's data-backed facet controls. */
export function getItemFacets({
  category,
  coverage,
  rows,
  roster,
}: GetItemFacetsOptions): readonly FacetDefinition<ItemRow>[] {
  const context: CategoricalContext = {
    coverage,
    petLabels: buildPetLabels({ roster }),
  };
  const facets: FacetDefinition<ItemRow>[] = [];

  for (const field of getContextFacetFields({ category })) {
    const categoricalConfig = CATEGORICAL_FACET_MAP.get(field);
    if (categoricalConfig) {
      const facet = deriveCategoricalFacet({
        config: categoricalConfig,
        rows,
        context,
      });
      if (facet) facets.push(facet);
      continue;
    }

    const rangeConfig = RANGE_FACET_MAP.get(field);
    if (rangeConfig) {
      const facet = deriveRangeFacet({ config: rangeConfig, rows });
      if (facet) facets.push(facet);
    }
  }

  return facets;
}
