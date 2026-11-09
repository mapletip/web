/** Item Browse facet configuration keyed by query field. */
import {
  ITEM_CATEGORICAL_FACET_CONFIGS,
  type CategoricalFacetConfig,
  type CategoricalContext,
} from './categorical-facet-config';
import {
  ITEM_NUMERIC_FACET_CONFIGS,
  type NumericFacetConfig,
} from './numeric-facet-config';

export type ItemFacetConfig = CategoricalFacetConfig | NumericFacetConfig;

export const ITEM_FACET_CONFIGS = {
  ...ITEM_CATEGORICAL_FACET_CONFIGS,
  ...ITEM_NUMERIC_FACET_CONFIGS,
} satisfies Record<string, ItemFacetConfig>;

export type ItemFacetField = keyof typeof ITEM_FACET_CONFIGS;
export type { CategoricalContext };
