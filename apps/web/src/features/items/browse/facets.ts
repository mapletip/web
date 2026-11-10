/** Facet declarations and query-field registration for Items Browse. */
import type {
  FacetDefinition,
  QueryFieldDefinition,
} from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import {
  ITEM_FACET_CONFIGS,
  type CategoricalContext,
  type ItemFacetConfig,
  type ItemFacetField,
} from './facet-config';
import { getItemFacetFields } from './facet-contexts';
import { UPGRADE_TARGET_LABELS } from './labels';
import type { ItemRow } from './project';
import type { ItemCategorySelection } from './routing';
import { matchSourceId } from './search';
import { computeScrollStatsSortValue } from './sort';

/** The sole query-field list includes facet values and hidden exact item IDs. */
export const ITEM_QUERY_FIELDS: readonly QueryFieldDefinition<ItemRow>[] = [
  ...Object.entries(ITEM_FACET_CONFIGS).map(([field, config]) => {
    if (config.kind === 'multi-select') {
      return { id: field, accessor: config.values };
    }
    return { id: field, accessor: config.getValue };
  }),
  {
    id: 'sourceId',
    accessor: (row) => row.sourceId,
    searchMatch: ({ value, query }) =>
      typeof value === 'string' && matchSourceId({ sourceId: value, query }),
  },
  { id: 'stats', accessor: computeScrollStatsSortValue },
  {
    id: 'targetLabel',
    accessor: (row) =>
      row.targetLabel
        ? (UPGRADE_TARGET_LABELS[row.targetLabel] ?? row.targetLabel)
        : undefined,
  },
];

interface DeriveFacetOptions {
  readonly field: ItemFacetField;
  readonly context: CategoricalContext;
}

function deriveFacet({
  field,
  context,
}: DeriveFacetOptions): FacetDefinition<ItemRow> {
  const config: ItemFacetConfig = ITEM_FACET_CONFIGS[field];
  const shared = {
    id: field,
    field,
    label: config.label,
    ...(config.quick ? { quick: true } : {}),
  };

  if (config.kind === 'multi-select') {
    const labels =
      typeof config.labels === 'function'
        ? config.labels({ context })
        : config.labels;
    const optionValues = config.optionOrder ?? Object.keys(labels ?? {});
    const options =
      labels === undefined
        ? undefined
        : optionValues.flatMap((value) => {
            const label = labels[value];
            if (label === undefined) return [];
            const group = config.groups?.[value];
            return [
              { value, label, ...(group === undefined ? {} : { group }) },
            ];
          });
    return {
      ...shared,
      kind: 'multi-select',
      ...(options === undefined ? {} : { options }),
      ...(config.formatOption === undefined
        ? {}
        : { formatOption: config.formatOption }),
    };
  }

  if (config.kind === 'range') {
    return {
      ...shared,
      kind: 'range',
      buckets: config.buckets,
      ...(config.valuePrefix === undefined
        ? {}
        : { valuePrefix: config.valuePrefix }),
      ...(config.unit === undefined ? {} : { unit: config.unit }),
    };
  }

  return { ...shared, kind: 'boolean' };
}

export interface GetItemFacetsOptions {
  readonly category: ItemCategorySelection;
  readonly coverage: ItemBrowseCoverage;
}

/** Declares category facets and leaves data-backed pruning to the library. */
export function getItemFacets({
  category,
  coverage,
}: GetItemFacetsOptions): readonly FacetDefinition<ItemRow>[] {
  const context: CategoricalContext = { coverage };
  const questRecipeCoverageComplete =
    coverage.relationships['needed-for-quest'] === 'complete' &&
    coverage.relationships['used-in-recipe'] === 'complete';
  return getItemFacetFields({
    scope: category.scope.slug,
    childSlug: category.child?.slug,
  }).flatMap((field) => {
    if (
      field === 'noRecordedQuestOrRecipeUse' &&
      !questRecipeCoverageComplete
    ) {
      return [];
    }
    return [deriveFacet({ field, context })];
  });
}
