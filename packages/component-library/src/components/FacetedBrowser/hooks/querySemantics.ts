import {
  constructFilterFn,
  filterFn_arrHas,
  filterFn_arrIncludesSome,
  filterFn_betweenInclusive,
  filterFn_equals,
  filterFn_includesString,
  type Row,
} from '@tanstack/react-table';

import type { TableColumn } from '@/components/Table/types';

import {
  isInvalidNumericRange,
  isNumericRangeFilter,
  type NumericRangeFilter,
} from './filterTypes';
import { facetedBrowserFeatures } from './tableFeatures';

export type QueryFieldAccessor<TRecord> =
  (keyof TRecord & string) | ((row: TRecord) => unknown);

export interface QueryField<TRecord extends Record<string, unknown>> {
  readonly id: string;
  readonly accessor?: QueryFieldAccessor<TRecord>;
  readonly sortable?: boolean;
  readonly firstSortDirection?: 'asc' | 'desc';
  readonly getUniqueValues?: (row: TRecord) => readonly unknown[];
  readonly filterFn?: (
    row: Row<typeof facetedBrowserFeatures, TRecord>,
    columnId: string,
    filterValue: unknown,
  ) => boolean;
}

export type QueryFieldDefinition<TRecord extends Record<string, unknown>> =
  (keyof TRecord & string) | QueryField<TRecord>;

/** Built-ins expose a value-level comparator on `.filter`; row arguments are unused. */
function compareWithBuiltIn(
  filterFn: typeof filterFn_equals,
  dataValue: unknown,
  filterValue: unknown,
): boolean {
  return filterFn.filter(dataValue, filterValue, undefined as never, '');
}

export type FieldFilterFn<TRecord extends Record<string, unknown>> = (
  row: Row<typeof facetedBrowserFeatures, TRecord>,
  columnId: string,
  filterValue: unknown,
) => boolean;

export interface ResolvedField<TRecord extends Record<string, unknown>> {
  readonly id: string;
  readonly title: string | undefined;
  readonly accessorFn: (row: TRecord) => unknown;
  readonly enableSorting: boolean;
  readonly sortDescFirst: boolean;
  readonly filterFn: FieldFilterFn<TRecord>;
  readonly getUniqueValues: (row: TRecord) => readonly unknown[];
  readonly isIdentity: boolean;
}

function searchValueMatches(value: unknown, query: string): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => searchValueMatches(entry, query));
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return compareWithBuiltIn(
      filterFn_includesString,
      String(value).toLowerCase(),
      query,
    );
  }
  return false;
}

/**
 * TanStack global filter for the single search box. It scans accessor values
 * (including computed and array-valued query fields) instead of maintaining a
 * separate pre-table record filter.
 */
export const searchFilterFn = constructFilterFn({
  filter: (dataValue, filterValue) => {
    if (typeof filterValue !== 'string' || filterValue.length === 0)
      return true;
    return searchValueMatches(dataValue, filterValue);
  },
  resolveFilterValue: (value) =>
    typeof value === 'string' ? value.trim().toLowerCase() : '',
});

export const disabledSearchFilterFn = constructFilterFn({
  filter: (_dataValue, filterValue) =>
    typeof filterValue !== 'string' || filterValue.length === 0,
  resolveFilterValue: (value) =>
    typeof value === 'string' ? value.trim().toLowerCase() : '',
});

/** Compose published TanStack comparators for the three canonical facet shapes. */
export const defaultFacetFilterFn = constructFilterFn({
  filter: (dataValue, filterValue) => {
    if (filterValue === undefined || filterValue === null) return true;

    if (Array.isArray(filterValue)) {
      if (filterValue.length === 0) return true;
      return Array.isArray(dataValue)
        ? compareWithBuiltIn(filterFn_arrIncludesSome, dataValue, filterValue)
        : compareWithBuiltIn(filterFn_arrHas, dataValue, filterValue);
    }

    if (typeof filterValue === 'object') {
      if (!isNumericRangeFilter(filterValue)) return false;
      if (isInvalidNumericRange(filterValue)) return false;
      if (typeof dataValue !== 'number' || Number.isNaN(dataValue))
        return false;
      const range: NumericRangeFilter = filterValue;
      return compareWithBuiltIn(filterFn_betweenInclusive, dataValue, [
        range.min,
        range.max,
      ]);
    }

    // Scalar categorical filters are exact; substring semantics belong to the
    // separate global search box, not to facet equality.
    return compareWithBuiltIn(filterFn_equals, dataValue, filterValue);
  },
});

function uniqueValues(value: unknown): readonly unknown[] {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value.filter((entry) => entry !== null && entry !== undefined),
      ),
    ];
  }
  return value === null || value === undefined ? [] : [value];
}

function valueAccessor<TRecord extends Record<string, unknown>>(
  accessor: (row: TRecord) => unknown,
): (row: TRecord) => unknown {
  return (row) => {
    const value = accessor(row);
    return value === null ? undefined : value;
  };
}

function fieldFromColumn<TRecord extends Record<string, unknown>>(
  column: TableColumn<TRecord>,
  idAccessor: keyof TRecord & string,
  identityField: (keyof TRecord & string) | undefined,
): ResolvedField<TRecord> {
  const accessorFn = valueAccessor((row) => row[column.accessor]);
  return {
    id: column.accessor,
    title: column.title,
    accessorFn,
    enableSorting: column.sortable ?? false,
    sortDescFirst: column.firstSortDirection === 'desc',
    filterFn: defaultFacetFilterFn,
    getUniqueValues: (row) => uniqueValues(accessorFn(row)),
    isIdentity:
      column.accessor === idAccessor || column.accessor === identityField,
  };
}

function resolveAccessor<TRecord extends Record<string, unknown>>(
  configuredAccessor: QueryFieldAccessor<TRecord> | undefined,
  existing: ResolvedField<TRecord> | undefined,
  id: string,
): (row: TRecord) => unknown {
  if (typeof configuredAccessor === 'function') return configuredAccessor;
  if (typeof configuredAccessor === 'string') {
    return (row) => row[configuredAccessor];
  }
  return existing?.accessorFn ?? ((row) => row[id]);
}

function fieldFromQuery<TRecord extends Record<string, unknown>>(
  queryField: QueryFieldDefinition<TRecord>,
  existing: ResolvedField<TRecord> | undefined,
  idAccessor: keyof TRecord & string,
  identityField: (keyof TRecord & string) | undefined,
): ResolvedField<TRecord> {
  const definition = typeof queryField === 'string' ? undefined : queryField;
  const id = typeof queryField === 'string' ? queryField : definition!.id;
  const configuredAccessor = definition?.accessor;
  const rawAccessor: (row: TRecord) => unknown = resolveAccessor(
    configuredAccessor,
    existing,
    id,
  );

  const accessorFn = valueAccessor(rawAccessor);
  const firstSortDirection = definition?.firstSortDirection;
  const sortDescFirst =
    firstSortDirection !== undefined
      ? firstSortDirection === 'desc'
      : (existing?.sortDescFirst ?? false);

  return {
    id,
    title: existing?.title,
    accessorFn,
    enableSorting: definition?.sortable ?? existing?.enableSorting ?? true,
    sortDescFirst,
    filterFn:
      definition?.filterFn ?? existing?.filterFn ?? defaultFacetFilterFn,
    getUniqueValues:
      definition?.getUniqueValues ?? ((row) => uniqueValues(accessorFn(row))),
    isIdentity: id === idAccessor || id === identityField,
  };
}

function fieldFromKey<TRecord extends Record<string, unknown>>(
  field: keyof TRecord & string,
  accessorFn: (row: TRecord) => unknown,
  isIdentity: boolean,
  enableSorting: boolean,
): ResolvedField<TRecord> {
  return {
    id: field,
    title: undefined,
    accessorFn: valueAccessor(accessorFn),
    enableSorting,
    sortDescFirst: false,
    filterFn: defaultFacetFilterFn,
    getUniqueValues: (row) => uniqueValues(accessorFn(row)),
    isIdentity,
  };
}

/** Resolve visual, query-only, identity and search-only fields once. */
export function resolveFields<TRecord extends Record<string, unknown>>({
  columns,
  queryFields,
  idAccessor,
  identityField,
  searchFields,
}: {
  readonly columns: readonly TableColumn<TRecord>[];
  readonly queryFields: readonly QueryFieldDefinition<TRecord>[];
  readonly idAccessor: keyof TRecord & string;
  readonly identityField: (keyof TRecord & string) | undefined;
  readonly searchFields: readonly (keyof TRecord & string)[] | undefined;
}): Map<string, ResolvedField<TRecord>> {
  const fields = new Map<string, ResolvedField<TRecord>>();

  for (const column of columns) {
    fields.set(
      column.accessor,
      fieldFromColumn(column, idAccessor, identityField),
    );
  }

  for (const queryField of queryFields) {
    const id = typeof queryField === 'string' ? queryField : queryField.id;
    fields.set(
      id,
      fieldFromQuery(queryField, fields.get(id), idAccessor, identityField),
    );
  }

  if (!fields.has(idAccessor)) {
    fields.set(
      idAccessor,
      fieldFromKey(idAccessor, (row) => row[idAccessor], true, true),
    );
  }

  if (identityField !== undefined && !fields.has(identityField)) {
    fields.set(
      identityField,
      fieldFromKey(identityField, (row) => row[identityField], true, true),
    );
  }

  for (const field of searchFields ?? []) {
    if (fields.has(field)) continue;
    fields.set(
      field,
      fieldFromKey(
        field,
        (row) => row[field],
        field === idAccessor || field === identityField,
        false,
      ),
    );
  }

  return fields;
}

export function resolveSearchFieldIds<TRecord extends Record<string, unknown>>({
  searchFields,
  identityField,
  idAccessor,
  columns,
  queryFields,
}: {
  readonly searchFields: readonly (keyof TRecord & string)[] | undefined;
  readonly identityField: (keyof TRecord & string) | undefined;
  readonly idAccessor: keyof TRecord & string;
  readonly columns: readonly TableColumn<TRecord>[];
  readonly queryFields: readonly QueryFieldDefinition<TRecord>[];
}): ReadonlySet<string> {
  if (searchFields !== undefined && searchFields.length === 0) {
    // Keep one globally filterable column so a nonempty query still yields no
    // records, matching the explicit "search nowhere" contract.
    return new Set([idAccessor]);
  }
  return new Set(
    searchFields ?? [
      identityField ?? idAccessor,
      ...columns.map((column) => column.accessor),
      ...queryFields.map((field) =>
        typeof field === 'string' ? field : field.id,
      ),
    ],
  );
}
