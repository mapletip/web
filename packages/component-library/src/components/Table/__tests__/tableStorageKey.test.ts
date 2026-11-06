import { describe, expect, it } from 'vitest';

import {
  deriveTableStorageKey,
  resolveTableStorageKey,
} from '@/components/Table/tableStorageKey';

const columns = [
  { accessor: 'value1' },
  { accessor: 'name' },
  { accessor: 'value1' },
] as const;

describe('deriveTableStorageKey', () => {
  it('is deterministic and insensitive to column order and duplicates', () => {
    const forward = deriveTableStorageKey({
      columns,
      idAccessor: 'id',
      identityField: 'name',
    });
    const reversed = deriveTableStorageKey({
      columns: [...columns].reverse(),
      idAccessor: 'id',
      identityField: 'name',
    });

    expect(forward).toBe(reversed);
    expect(forward).toBe(
      'mapletip:component-library:datatable:v1:id:name:name,value1',
    );
  });

  it('distinguishes table shapes and treats a missing identity explicitly', () => {
    const withIdentity = deriveTableStorageKey({
      columns,
      idAccessor: 'id',
      identityField: 'name',
    });
    const withoutIdentity = deriveTableStorageKey({
      columns,
      idAccessor: 'id',
    });
    const otherSchema = deriveTableStorageKey({
      columns: [{ accessor: 'name' }],
      idAccessor: 'id',
    });

    expect(withoutIdentity).toContain(':id:none:');
    expect(new Set([withIdentity, withoutIdentity, otherSchema]).size).toBe(3);
  });
});

describe('resolveTableStorageKey', () => {
  it('derives a bucket when no override is supplied', () => {
    expect(resolveTableStorageKey(undefined, () => 'derived')).toBe('derived');
  });

  it('uses a trimmed explicit namespace', () => {
    expect(resolveTableStorageKey('  host:table:v2  ', () => 'derived')).toBe(
      'host:table:v2',
    );
  });

  it('rejects an empty override for the documented upstream reason', () => {
    expect(() => resolveTableStorageKey('   ', () => 'derived')).toThrow(
      /nonempty, namespaced key/u,
    );
  });
});
