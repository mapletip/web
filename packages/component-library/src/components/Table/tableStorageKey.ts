const STORAGE_KEY_PREFIX = 'mapletip:component-library:datatable:v1';

export interface TableStorageKeyParts {
  readonly columns: readonly { readonly accessor: string }[];
  readonly idAccessor: string;
  readonly identityField?: string | undefined;
}

/**
 * Deterministic, bounded DataTable storage bucket for one logical table shape.
 *
 * The key intentionally excludes visibility, widths, page and mount identity, so
 * remounting or showing/hiding columns reuses the same bucket instead of leaving
 * abandoned localStorage entries behind. Hosts that need build or domain scoping
 * supply an explicit `tableStorageKey`/`storeColumnsKey`.
 */
export function deriveTableStorageKey({
  columns,
  idAccessor,
  identityField,
}: TableStorageKeyParts): string {
  const schema = [...new Set(columns.map((column) => String(column.accessor)))]
    .sort()
    .join(',');
  return `${STORAGE_KEY_PREFIX}:${idAccessor}:${identityField ?? 'none'}:${schema}`;
}

/**
 * Resolve the effective DataTable key.
 *
 * DataTable 9.4.0 has no safe "no persistence" mode: omitting `storeColumnsKey`
 * makes it read the shared empty-string bucket, which can hide the table
 * (upstream issue #845). Every table therefore receives a nonempty key:
 * `undefined` derives a stable bucket; a string scopes persistence explicitly.
 *
 * An empty override is rejected for the same upstream reason.
 */
export function resolveTableStorageKey(
  override: string | undefined,
  derive: () => string,
): string {
  if (override === undefined) return derive();
  const trimmed = override.trim();
  if (trimmed.length === 0) {
    throw new Error(
      'Table storeColumnsKey must be a stable, nonempty, namespaced key.',
    );
  }
  return trimmed;
}
