import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { otherUse } from '../../kinds/other-use';
import type { CategorizedItemRow } from '../project';
import {
  canReadItemRelation,
  loadProjectedItemData,
  projectItemDescriptions,
  projectItemRelation,
} from '../relation-projection';
import type { ItemDrawerPack } from '../relations';

const reader = vi.hoisted(() => ({
  readRelation: vi.fn(),
  readDescriptions: vi.fn(),
}));

vi.mock('../relations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../relations')>();
  return {
    ...actual,
    createItemRelationReader: () => reader as never,
  };
});

const pack: ItemDrawerPack<'needed-for-quest'> = {
  contractVersion: '2.0',
  format: 'item-related-entity-browse/1',
  relationshipKind: 'needed-for-quest',
  scope: { family_id: 'fixture', build_id: 'fixture' },
  targets: [
    {
      key: 'quest:z',
      publicId: 'z',
      displayName: 'Zinc Errand',
      startLevel: { state: 'unknown' },
      startNpc: { state: 'unknown' },
      recurrence: { state: 'unknown' },
    },
    {
      key: 'quest:a',
      publicId: 'a',
      displayName: 'Amber Errand',
      startLevel: { state: 'unknown' },
      startNpc: { state: 'unknown' },
      recurrence: { state: 'unknown' },
    },
    {
      key: 'quest:unnamed',
      publicId: 'u',
      displayName: ' ',
      startLevel: { state: 'unknown' },
      startNpc: { state: 'unknown' },
      recurrence: { state: 'unknown' },
    },
  ],
  records: {
    'item:one': [
      { target: 0, roles: [{ role: 'turned-in' }] },
      { target: 1, roles: [{ role: 'held-to-start' }] },
      { target: 2, roles: [{ role: 'turned-in' }] },
      { target: 1, roles: [{ role: 'not-established' }] },
    ],
    'item:unknown': [{ target: 1, roles: [{ role: 'not-established' }] }],
    'item:other-category': [{ target: 0, roles: [{ role: 'turned-in' }] }],
  },
};

describe('item relation projection', () => {
  it('keys projected facts by source id while reading packs by item key', () => {
    const items = [{ key: 'item:one', sourceId: '1001' }];
    expect(projectItemRelation({ pack, items }).byItem).toEqual({
      '1001': [1, 0],
    });
    expect(
      projectItemDescriptions({
        descriptions: { 'item:one': 'A published note.' },
        items,
      }),
    ).toEqual({ '1001': 'A published note.' });
  });

  it('sorts published names and maps item edges to their sorted indices', () => {
    expect(
      projectItemRelation({
        pack,
        items: [
          { key: 'item:one', sourceId: 'one' },
          { key: 'item:unknown', sourceId: 'unknown' },
        ],
      }),
    ).toEqual({
      targets: [
        { publicId: 'a', name: 'Amber Errand' },
        { publicId: 'z', name: 'Zinc Errand' },
      ],
      byItem: { one: [1, 0] },
      unestablished: ['unknown'],
    });
  });

  it('keeps only the names the given items refer to', () => {
    expect(
      projectItemRelation({
        pack,
        items: [{ key: 'item:other-category', sourceId: 'other' }],
      }),
    ).toEqual({
      targets: [{ publicId: 'z', name: 'Zinc Errand' }],
      byItem: { other: [0] },
      unestablished: [],
    });
    expect(
      projectItemRelation({
        pack,
        items: [{ key: 'item:unknown', sourceId: 'unknown' }],
      }),
    ).toEqual({ targets: [], byItem: {}, unestablished: ['unknown'] });
  });

  it('skips an unsupported relationship', () => {
    expect(
      canReadItemRelation({
        kind: 'needed-for-quest',
        coverage: {
          relationships: { 'needed-for-quest': 'unsupported' },
        } as Parameters<typeof canReadItemRelation>[0]['coverage'],
      }),
    ).toBe(false);
  });

  it('projects every browse row when no category is selected', async () => {
    reader.readRelation.mockResolvedValue(pack);
    const allRows: readonly CategorizedItemRow[] = [
      {
        key: 'item:one',
        sourceId: 'one',
        itemClass: 'etc',
        kind: 'other-use',
        kindPath: ['all', 'use', 'other-use'],
      },
      {
        key: 'item:other-category',
        sourceId: 'other',
        itemClass: 'etc',
        kind: 'other-etc',
        kindPath: ['all', 'etc', 'other-etc'],
      },
    ];

    const loaded = await loadProjectedItemData({
      buildId: 'cw-launch',
      rows: allRows,
      coverage: {
        relationships: { 'needed-for-quest': 'complete' },
      } as ItemBrowseCoverage,
      relationKinds: ['needed-for-quest'],
    });

    expect(loaded.relations['needed-for-quest']).toEqual({
      targets: [
        { publicId: 'a', name: 'Amber Errand' },
        { publicId: 'z', name: 'Zinc Errand' },
      ],
      byItem: { one: [1, 0], other: [1] },
      unestablished: [],
    });
  });
});

describe('projected category descriptions', () => {
  const rows: readonly CategorizedItemRow[] = [
    {
      key: 'item:use',
      sourceId: 'use',
      itemClass: 'consume',
      kind: 'other-use',
      kindPath: ['all', 'use', 'other-use'],
    },
    {
      key: 'item:other',
      sourceId: 'other',
      itemClass: 'etc',
      kind: 'other-etc',
      kindPath: ['all', 'etc', 'other-etc'],
    },
  ];
  const coverage = { relationships: {} } as ItemBrowseCoverage;

  beforeEach(() => {
    reader.readRelation.mockReset();
    reader.readDescriptions.mockReset();
  });

  it('keeps only trimmed descriptions for the category items', () => {
    expect(
      projectItemDescriptions({
        descriptions: {
          'item:use': '  A useful note.  ',
          'item:other': 'A different category.',
          'item:missing': 'An unrelated item.',
          'item:blank': '  ',
        },
        items: [
          { key: 'item:use', sourceId: 'use' },
          { key: 'item:blank', sourceId: 'blank' },
        ],
      }),
    ).toEqual({ use: 'A useful note.' });
  });

  it('loads descriptions once and projects only the current category items', async () => {
    reader.readDescriptions.mockResolvedValue({
      'item:use': '  A useful note.  ',
      'item:other': 'A different category.',
    });

    const loaded = await loadProjectedItemData({
      buildId: 'cw-launch',
      kind: otherUse,
      rows,
      coverage,
    });

    expect(reader.readDescriptions).toHaveBeenCalledOnce();
    expect(loaded).toEqual({
      relations: {},
      descriptions: { use: 'A useful note.' },
    });
  });

  it('omits descriptions when the MapleKit read fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    reader.readRelation.mockResolvedValue({
      ...pack,
      records: {
        'item:use': [{ target: 1, roles: [{ role: 'held-to-start' }] }],
      },
    });
    reader.readDescriptions.mockRejectedValue(
      new Error('hidden fixture integrity detail'),
    );

    await expect(
      loadProjectedItemData({
        buildId: 'cw-launch',
        kind: otherUse,
        rows,
        coverage,
        relationKinds: ['needed-for-quest'],
      }),
    ).resolves.toMatchObject({
      relations: {
        'needed-for-quest': {
          targets: [{ name: 'Amber Errand' }],
          byItem: { use: [0] },
        },
      },
    });
  });
});
