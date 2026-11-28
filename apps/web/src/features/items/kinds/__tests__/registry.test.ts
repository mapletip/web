import type {
  ItemBrowseRecordV2_2,
  ItemBrowseRowV2_2,
} from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { ITEM_KINDS, assignItemKind } from '..';
import { fixtureRelease } from '../../../../mocks/release';
import { projectItemBrowseRows, type ItemRow } from '../../browse/project';

const buildIds = ['cw-launch', 'gms-v83'] as const;

function fixtureRecords({ buildId }: { buildId: (typeof buildIds)[number] }) {
  const descriptor = fixtureRelease.builds.get(buildId)?.itemBrowse;
  if (!descriptor) throw new Error(`Missing browse pack for ${buildId}`);
  const bytes = fixtureRelease.files.get(descriptor.path);
  if (!bytes) throw new Error(`Missing fixture file for ${buildId}`);
  const pack = JSON.parse(new TextDecoder().decode(bytes)) as {
    records: Record<string, ItemBrowseRecordV2_2 | undefined>;
  };
  return Object.entries(pack.records).flatMap(
    ([key, record]): ItemBrowseRowV2_2[] =>
      record ? [{ ...record, key }] : [],
  );
}

function fixtureRow({ overrides }: { overrides: Partial<ItemRow> }): ItemRow {
  return {
    key: 'item:fixture',
    sourceId: 'fixture',
    itemClass: 'consume',
    name: 'Practice Item',
    ...overrides,
  };
}

describe('item kind registry', () => {
  it.each(buildIds)('assigns each named item in %s exactly once', (buildId) => {
    const records = fixtureRecords({ buildId });
    const rows = projectItemBrowseRows(records);
    const namedCount = records.filter(
      (record) => record.name.state === 'known',
    ).length;
    expect(rows).toHaveLength(namedCount);

    const counts = new Map(ITEM_KINDS.map((kind) => [kind.id, 0]));
    for (const row of rows) {
      const first = assignItemKind({ row });
      expect(first).toBeDefined();
      expect(row.kind).toBe(first?.id);
      expect(row.kindPath).toEqual(['all', first?.group, first?.id]);
      counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1);
    }
    expect([...counts.values()].reduce((sum, count) => sum + count, 0)).toBe(
      namedCount,
    );
    expect(
      [...counts].filter(([, count]) => count === 0).map(([id]) => id),
    ).toEqual(buildId === 'cw-launch' ? ['bullet'] : []);
  });

  it.each([
    ['pet food from Use', { types: ['pet-food'] }, 'pet-food'],
    [
      'drop with quest flag',
      { itemClass: 'etc', types: ['monster-material'], questFlag: true },
      'monster-drops',
    ],
    ['meso pouch', { types: ['food-buff', 'meso-pouch'] }, 'other-use'],
    [
      'skill book that restores',
      { types: ['potion'], functions: ['skill', 'recovery'] },
      'skill-books',
    ],
  ] as const)('resolves %s by first rule', (_scenario, fields, expected) => {
    expect(assignItemKind({ row: fixtureRow({ overrides: fields }) })?.id).toBe(
      expected,
    );
  });
});
