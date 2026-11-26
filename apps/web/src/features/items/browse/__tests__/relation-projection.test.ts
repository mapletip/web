import { describe, expect, it } from 'vitest';

import {
  canReadItemRelation,
  projectItemRelation,
} from '../relation-projection';
import type { ItemDrawerPack } from '../relations';

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
    });
    expect(
      projectItemRelation({ pack, itemKeys: new Set(['item:unknown']) }),
    ).toEqual({ targets: [], byItem: {} });
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
