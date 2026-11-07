import { describe, expect, it } from 'vitest';

import { DEFAULT_BUILD_ID } from '@/config/maplekit';

import { ITEM_SCOPES } from '../categories';
import type { ItemRow } from '../project';
import { findExactIdNotice, matchSourceId } from '../search';

describe('Items Browse exact ID search', () => {
  const rows: readonly ItemRow[] = [
    {
      key: 'item:02000000',
      sourceId: '02000000',
      name: 'Red Potion',
      itemClass: 'consume',
    },
    {
      key: 'item:04000000',
      sourceId: '04000000',
      name: 'Snail Shell',
      itemClass: 'etc',
    },
    {
      key: 'item:dup:1',
      sourceId: '03000000',
      name: 'Blue Chair',
      itemClass: 'setup',
    },
    {
      key: 'item:dup:2',
      sourceId: '3000000',
      name: 'Another Blue Chair',
      itemClass: 'setup',
    },
  ];

  it('matches digit-only IDs by numeric value, including leading zeroes', () => {
    expect(matchSourceId({ sourceId: '02000000', query: '2000000' })).toBe(
      true,
    );
    expect(matchSourceId({ sourceId: '02000000', query: '02000000' })).toBe(
      true,
    );
    expect(matchSourceId({ sourceId: '02000000', query: '200' })).toBe(false);
    expect(matchSourceId({ sourceId: '02000000', query: 'potion' })).toBe(
      false,
    );
  });

  it('returns a build-specific notice when a numeric ID has no match', () => {
    expect(
      findExactIdNotice({
        query: '9999999',
        rows,
        category: { scope: ITEM_SCOPES.all },
        buildId: 'gms-v83',
      }),
    ).toEqual({
      kind: 'none',
      query: '9999999',
      buildLabel: 'GMS v83',
    });
  });

  it('does not show a notice when the ID matches a name or current category', () => {
    expect(
      findExactIdNotice({
        query: '60',
        rows: [
          ...rows,
          {
            key: 'item:scroll60',
            sourceId: '02040000',
            name: 'Scroll for Bow 60%',
            itemClass: 'consume',
          },
        ],
        category: { scope: ITEM_SCOPES.all },
        buildId: DEFAULT_BUILD_ID,
      }),
    ).toBeNull();
    expect(
      findExactIdNotice({
        query: '2000000',
        rows,
        category: { scope: ITEM_SCOPES.use },
        buildId: DEFAULT_BUILD_ID,
      }),
    ).toBeNull();
  });

  it('links a unique match to its owning scope', () => {
    const notice = findExactIdNotice({
      query: '2000000',
      rows,
      category: { scope: ITEM_SCOPES.etc },
      buildId: DEFAULT_BUILD_ID,
    });
    expect(notice).toMatchObject({
      kind: 'outside-category',
      item: rows[0],
      owningScope: ITEM_SCOPES.use,
      query: '2000000',
    });
  });

  it('reports multiple numeric matches without unsafe casts', () => {
    const notice = findExactIdNotice({
      query: '3000000',
      rows,
      category: { scope: ITEM_SCOPES.use },
      buildId: DEFAULT_BUILD_ID,
    });
    expect(notice?.kind).toBe('multiple');
    const matchCount = notice?.kind === 'multiple' ? notice.items.length : 0;
    expect(matchCount).toBe(2);
  });

  it('hides a multiple-match notice when every match is in the category', () => {
    expect(
      findExactIdNotice({
        query: '3000000',
        rows,
        category: { scope: ITEM_SCOPES.setup },
        buildId: DEFAULT_BUILD_ID,
      }),
    ).toBeNull();
  });
});
