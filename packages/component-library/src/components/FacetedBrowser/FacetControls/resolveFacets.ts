import { buildQuantileBuckets } from '@/components/FacetedBrowser/FacetControls/quantileBuckets';
import { createRangeBucketFilterFn } from '@/components/FacetedBrowser/FacetControls/rangeBucketFilterFn';
import type {
  FacetDefinition,
  FacetOption,
} from '@/components/FacetedBrowser/FacetControls/types';
import type {
  QueryFieldDefinition,
  ResolvedField,
} from '@/components/FacetedBrowser/hooks/querySemantics';

const NATURAL_COLLATOR = new Intl.Collator(undefined, { numeric: true });

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

function countStringValues<TRecord extends Record<string, unknown>>({
  records,
  field,
}: {
  readonly records: readonly TRecord[];
  readonly field: ResolvedField<TRecord>;
}): Map<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const values = new Set(
      field
        .getUniqueValues(record)
        .filter((value): value is string => typeof value === 'string'),
    );
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function resolveFacet<TRecord extends Record<string, unknown>>({
  facet,
  records,
  field,
}: {
  readonly facet: FacetDefinition<TRecord>;
  readonly records: readonly TRecord[];
  readonly field: ResolvedField<TRecord>;
}): FacetDefinition<TRecord> | undefined {
  if (facet.kind === 'range') {
    const values = records.flatMap((record) => {
      const value = field.accessorFn(record);
      return typeof value === 'number' ? [value] : [];
    });
    const distinctValues = new Set(
      values.filter((value) => Number.isFinite(value)),
    );
    if (distinctValues.size < 2) return undefined;
    if (facet.buckets !== 'quantile') return facet;
    return {
      ...facet,
      buckets: buildQuantileBuckets({
        values,
        unit: facet.unit,
        valuePrefix: facet.valuePrefix,
      }),
    };
  }

  if (facet.kind === 'boolean') {
    if (records.length === 0) return facet;
    const firstValue = field.accessorFn(records[0]!);
    return records.every((record) =>
      Object.is(field.accessorFn(record), firstValue),
    )
      ? undefined
      : facet;
  }

  const counts = countStringValues({ records, field });
  const declaredOptions =
    facet.options ??
    [...counts.entries()]
      .filter(([, count]) => count > 0 && count < records.length)
      .sort(([left], [right]) => NATURAL_COLLATOR.compare(left, right))
      .map(([value]) => ({
        value,
        label: facet.formatOption ? facet.formatOption({ value }) : value,
      }));
  const options: FacetOption[] = declaredOptions.filter((option) => {
    const count = counts.get(option.value) ?? 0;
    return count > 0 && count < records.length;
  });
  return options.length > 0 ? { ...facet, options } : undefined;
}

/**
 * The single place that turns declared facets into effective ones: range
 * buckets and option pruning use the complete record set, facet definitions are
 * validated, and any bucket-bearing facet is paired with its filtering
 * semantics. UI, chips, counts and filters all consume this result.
 */
export function resolveFacets<TRecord extends Record<string, unknown>>({
  facets,
  queryFields,
  records,
  fieldAccessors,
}: ResolveFacetsOptions<TRecord>): ResolvedFacets<TRecord> {
  validateFacets(facets, new Set(fieldAccessors.keys()));
  const effectiveFacets = facets.flatMap((facet) => {
    const field = fieldAccessors.get(facet.field);
    if (field === undefined) return [];
    const resolved = resolveFacet({ facet, records, field });
    return resolved === undefined ? [] : [resolved];
  });
  return {
    facets: effectiveFacets,
    queryFields: withBucketFilters(effectiveFacets, queryFields),
  };
}
