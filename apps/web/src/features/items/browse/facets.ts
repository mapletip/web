/** Facet declarations and query-field registration for Items Browse. */
import type {
  FacetDefinition,
  FacetOption,
  QueryFieldDefinition,
} from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import {
  BOOLEAN_FACETS,
  CATEGORICAL_FACETS,
  CONTEXT_FACETS,
  DEFAULT_FACETS,
  getItemRelationships,
  RANGE_FACETS,
  type CategoricalContext,
  type CategoricalFacetConfig,
} from './facet-configs';
import { UPGRADE_TARGET_LABELS } from './labels';
import { buildPetLabels } from './pet-labels';
import type { ItemRow } from './project';
import { itemCategoryContextKey, type ItemCategorySelection } from './routing';
import { matchSourceId } from './search';
import { computeScrollStatsSortValue } from './sort';

export { getItemRelationships };

/** One source for facet fields and the extra searchable/sortable item fields. */
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
  ...BOOLEAN_FACETS.map((facet) => ({
    id: facet.field,
    accessor: facet.getValue,
  })),
  {
    id: 'sourceId',
    accessor: (row) => row.sourceId,
    searchMatch: ({ value, query }) =>
      typeof value === 'string' ? matchSourceId(value, query) : false,
  },
  {
    id: 'stats',
    accessor: computeScrollStatsSortValue,
  },
  {
    id: 'targetLabel',
    accessor: (row) =>
      row.targetLabel
        ? (UPGRADE_TARGET_LABELS[row.targetLabel] ?? row.targetLabel)
        : undefined,
  },
  {
    id: 'cursed',
    accessor: (row) => row.cursed,
  },
];

interface GetItemFacetsOptions {
  readonly category: ItemCategorySelection;
  readonly coverage: ItemBrowseCoverage;
  readonly roster: readonly ItemRow[];
}

function buildFacetOptions(
  config: CategoricalFacetConfig,
  context: CategoricalContext,
): readonly FacetOption[] | undefined {
  const sortOrder =
    typeof config.sortOrder === 'function' ? undefined : config.sortOrder;
  const optionValues =
    config.optionValues ??
    (typeof config.optionLabel === 'function'
      ? undefined
      : (sortOrder ?? Object.keys(config.optionLabel)));
  if (optionValues === undefined) return undefined;

  return optionValues.flatMap((value) => {
    const label =
      typeof config.optionLabel === 'function'
        ? config.optionLabel(value, context)
        : config.optionLabel[value];
    if (label === undefined) return [];
    const group = config.groups?.[value];
    return [{ value, label, ...(group === undefined ? {} : { group }) }];
  });
}

function deriveCategoricalFacet(
  config: CategoricalFacetConfig,
  context: CategoricalContext,
): FacetDefinition<ItemRow> {
  const options = buildFacetOptions(config, context);
  const formatOption =
    typeof config.optionLabel === 'function' && options === undefined
      ? config.optionLabel
      : undefined;
  const facet: FacetDefinition<ItemRow> = {
    id: config.field,
    field: config.field,
    label: config.label,
    kind: 'multi-select',
    ...(config.quick ? { quick: true } : {}),
    ...(options === undefined ? {} : { options }),
    ...(formatOption
      ? {
          formatOption: ({ value }: { readonly value: string }) =>
            formatOption(value, context) ?? value,
        }
      : {}),
  };
  return facet;
}

function deriveFacets(
  fields: readonly string[],
  context: CategoricalContext,
): readonly FacetDefinition<ItemRow>[] {
  const categoricalByField = new Map(
    CATEGORICAL_FACETS.map((config) => [config.field, config]),
  );
  const rangeByField = new Map(
    RANGE_FACETS.map((config) => [config.field, config]),
  );
  const booleanByField = new Map(
    BOOLEAN_FACETS.map((config) => [config.field, config]),
  );

  return fields.flatMap((field) => {
    const categorical = categoricalByField.get(field);
    if (categorical) return [deriveCategoricalFacet(categorical, context)];

    const range = rangeByField.get(field);
    if (range) {
      return [
        {
          id: range.field,
          field: range.field,
          label: range.label,
          kind: 'range',
          buckets: 'quantile',
          ...(range.unit === undefined ? {} : { unit: range.unit }),
          ...(range.valuePrefix === undefined
            ? {}
            : { valuePrefix: range.valuePrefix }),
          ...(range.quick ? { quick: true } : {}),
        },
      ];
    }

    const boolean = booleanByField.get(field);
    return boolean
      ? [
          {
            id: boolean.field,
            field: boolean.field,
            label: boolean.label,
            kind: 'boolean',
            ...(boolean.quick ? { quick: true } : {}),
          },
        ]
      : [];
  });
}

/** Declare facets; FacetedBrowser owns data-backed options, buckets and filters. */
export function getItemFacets({
  category,
  coverage,
  roster,
}: GetItemFacetsOptions): readonly FacetDefinition<ItemRow>[] {
  const context: CategoricalContext = {
    coverage,
    petLabels: buildPetLabels(roster),
  };
  const questRecipeCoverageComplete = [
    coverage.relationships['needed-for-quest'],
    coverage.relationships['used-in-recipe'],
  ].every((state) => state === 'complete');
  const contextKey = itemCategoryContextKey(category);
  const configuredFields = CONTEXT_FACETS[contextKey] ?? DEFAULT_FACETS;
  const fields = configuredFields.filter(
    (field) =>
      (field !== 'noRecordedQuestOrRecipeUse' || questRecipeCoverageComplete) &&
      (field !== 'scrollTier' || coverage.scrollTier !== 'unsupported'),
  );
  return deriveFacets(fields, context);
}

export function getDropCoverageNotice(
  coverage: ItemBrowseCoverage,
  category: ItemCategorySelection,
): string | undefined {
  if (category.scope.slug !== 'all' || category.child !== undefined) {
    return undefined;
  }
  const cov = coverage.relationships['monster-drop'];
  if (cov === 'unsupported') return 'Classic World has no monster drop data.';
  if (cov === 'partial') {
    return 'GMS monster-book evidence is incomplete and a missing record does not mean an item cannot drop.';
  }
  return undefined;
}
