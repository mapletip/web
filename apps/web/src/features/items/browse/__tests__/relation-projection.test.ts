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
  it('sorts published names and maps item edges to their sorted indices', () => {
    expect(
      projectItemRelation({
        pack,
        itemKeys: new Set(['item:one', 'item:unknown']),
      }),
    ).toEqual({
      targets: [
        { publicId: 'a', name: 'Amber Errand' },
        { publicId: 'z', name: 'Zinc Errand' },
      ],
      byItem: { 'item:one': [1, 0] },
      unestablished: ['item:unknown'],
    });
  });

  it('keeps only the names the given items refer to', () => {
    expect(
      projectItemRelation({
        pack,
        itemKeys: new Set(['item:other-category']),
      }),
    ).toEqual({
      targets: [{ publicId: 'z', name: 'Zinc Errand' }],
      byItem: { 'item:other-category': [0] },
      unestablished: [],
    });
    expect(
      projectItemRelation({ pack, itemKeys: new Set(['item:unknown']) }),
    ).toEqual({ targets: [], byItem: {}, unestablished: ['item:unknown'] });
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
        itemKeys: new Set(['item:use', 'item:blank']),
      }),
    ).toEqual({ 'item:use': 'A useful note.' });
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
      descriptions: { 'item:use': 'A useful note.' },
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
          byItem: { 'item:use': [0] },
        },
      },
    });
  });
});
