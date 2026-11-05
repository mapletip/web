import { buildQuantileBuckets } from '@/components/FacetedBrowser/FacetControls/quantileBuckets';
import { createRangeBucketFilterFn } from '@/components/FacetedBrowser/FacetControls/rangeBucketFilterFn';
import type { FacetDefinition } from '@/components/FacetedBrowser/FacetControls/types';
import type {
  QueryFieldDefinition,
  ResolvedField,
} from '@/components/FacetedBrowser/hooks/querySemantics';

/**
 * A range facet that carries buckets is the single source of bucket semantics:
 * its query filter is derived from those buckets, so a host cannot render
 * presets whose filtering semantics were never registered. An explicit
 * `filterFn` for the same field would silently diverge, so it is rejected.
 */
function withBucketFilters<TRecord extends Record<string, unknown>>(
  facets: readonly FacetDefinition<TRecord>[],
  queryFields: readonly QueryFieldDefinition<TRecord>[],
): readonly QueryFieldDefinition<TRecord>[] {
  const grown: QueryFieldDefinition<TRecord>[] = [...queryFields];
  for (const facet of facets) {
    // FacetedBrowser resolves 'quantile' before this point, so only concrete
    // bucket arrays reach the filter derivation.
    if (facet.kind !== 'range' || typeof facet.buckets === 'string') continue;
    if (facet.buckets === undefined) continue;
    if (facet.buckets.length === 0) continue;
    const index = grown.findIndex((field) =>
      typeof field === 'string'
        ? field === facet.field
        : field.id === facet.field,
    );
    const existing = index === -1 ? undefined : grown[index];
    if (typeof existing === 'object' && existing.filterFn !== undefined) {
      throw new Error(
        `FacetedBrowser: facet "${facet.id}" defines buckets, so its filterFn cannot be overridden.`,
      );
    }
    // The facet owns *filtering*, not the rest of the query field: keep any
    // registered accessor, sortability, first direction and unique-value
    // projection, and replace only the filter implementation.
    const base: QueryFieldDefinition<TRecord> =
      typeof existing === 'object' ? existing : { id: facet.field };
    const derived: QueryFieldDefinition<TRecord> = {
      ...base,
      filterFn: createRangeBucketFilterFn<TRecord>(facet.buckets),
    };
    if (index === -1) grown.push(derived);
    else grown[index] = derived;
  }
  return grown;
}

function validateFacets<TRecord extends Record<string, unknown>>(
  facets: readonly FacetDefinition<TRecord>[],
  registeredFields: ReadonlySet<string>,
): void {
  const facetIds = new Set<string>();
  const facetFields = new Set<string>();
  for (const facet of facets) {
    if (facetIds.has(facet.id)) {
      throw new Error(`FacetedBrowser: duplicate facet ID "${facet.id}".`);
    }
    if (facetFields.has(facet.field)) {
      throw new Error(
        `FacetedBrowser: multiple facets use query field "${facet.field}".`,
      );
    }
    if (!registeredFields.has(facet.field)) {
      throw new Error(
        `FacetedBrowser: facet "${facet.id}" refers to unregistered query field "${facet.field}".`,
      );
    }
    facetIds.add(facet.id);
    facetFields.add(facet.field);
  }
}

export interface ResolveFacetsOptions<TRecord extends Record<string, unknown>> {
  readonly facets: readonly FacetDefinition<TRecord>[];
  readonly queryFields: readonly QueryFieldDefinition<TRecord>[];
  readonly records: readonly TRecord[];
  readonly fieldAccessors: ReadonlyMap<string, ResolvedField<TRecord>>;
}

export interface ResolvedFacets<TRecord extends Record<string, unknown>> {
  readonly facets: readonly FacetDefinition<TRecord>[];
  readonly queryFields: readonly QueryFieldDefinition<TRecord>[];
}

/**
 * The single place that turns declared facets into effective ones: quantile
 * buckets are generated from the resolved field accessors over the complete
 * record set, facet definitions are validated, and any bucket-bearing facet is
 * paired with its filtering semantics. UI, chips, counts and filters all consume
 * this result, so their boundaries cannot diverge.
 */
export function resolveFacets<TRecord extends Record<string, unknown>>({
  facets,
  queryFields,
  records,
  fieldAccessors,
}: ResolveFacetsOptions<TRecord>): ResolvedFacets<TRecord> {
  const effectiveFacets = facets.map((facet) => {
    if (facet.kind !== 'range' || facet.buckets !== 'quantile') return facet;
    const accessor = fieldAccessors.get(facet.field)?.accessorFn;
    if (accessor === undefined) {
      throw new Error(
        `FacetedBrowser: facet "${facet.id}" uses quantile buckets but field "${facet.field}" is not registered.`,
      );
    }
    const values = records.flatMap((record) => {
      const value = accessor(record);
      return typeof value === 'number' ? [value] : [];
    });
    return { ...facet, buckets: buildQuantileBuckets(values) };
  });

  validateFacets(effectiveFacets, new Set(fieldAccessors.keys()));
  return {
    facets: effectiveFacets,
    queryFields: withBucketFilters(effectiveFacets, queryFields),
  };
}
