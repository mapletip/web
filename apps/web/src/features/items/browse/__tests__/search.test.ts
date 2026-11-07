import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import type { ItemRow } from '../project';
import { findExactIdNotice, matchSourceId } from '../search';

describe('search matching and exact-ID notices', () => {
  const dummyRows: readonly ItemRow[] = [
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
      key: 'item:5000000',
      sourceId: '5000000',
      name: 'Brown Puppy',
      itemClass: 'pet',
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

  describe('matchSourceId', () => {
    it('matches exact numeric value for digits-only queries including leading zeros', () => {
      expect(matchSourceId('02000000', '2000000')).toBe(true);
      expect(matchSourceId('02000000', '02000000')).toBe(true);
      expect(matchSourceId('5000000', '5000000')).toBe(true);
    });

    it('never substring-matches IDs', () => {
      expect(matchSourceId('02000000', '200')).toBe(false);
      expect(matchSourceId('02000000', '02')).toBe(false);
      expect(matchSourceId('02000000', '0000')).toBe(false);
    });

    it('never matches non-digit queries', () => {
      expect(matchSourceId('02000000', 'potion')).toBe(false);
      expect(matchSourceId('02000000', '2000000a')).toBe(false);
      expect(matchSourceId('02000000', '')).toBe(false);
      expect(matchSourceId('02000000', '   ')).toBe(false);
    });
  });

  describe('findExactIdNotice', () => {
    it('returns null for non-digit queries', () => {
      expect(
        findExactIdNotice(
          'potion',
          dummyRows,
          { scope: ITEM_SCOPES.all },
          'cw-launch',
        ),
      ).toBeNull();
    });

    it('returns truthful message naming the build when no item matches', () => {
      const noticeCw = findExactIdNotice(
        '9999999',
        dummyRows,
        { scope: ITEM_SCOPES.all },
        'cw-launch',
      );
      expect(noticeCw).toEqual({
        kind: 'none',
        query: '9999999',
        buildLabel: 'Classic World',
      });

      const noticeGms = findExactIdNotice(
        '9999999',
        dummyRows,
        { scope: ITEM_SCOPES.all },
        'gms-v83',
      );
      expect(noticeGms).toEqual({
        kind: 'none',
        query: '9999999',
        buildLabel: 'GMS v83',
      });
    });

    it('returns null when query matches item names even if no item matches ID', () => {
      const rowsWithName: readonly ItemRow[] = [
        ...dummyRows,
        {
          key: 'item:scroll60',
          sourceId: '02040000',
          name: 'Scroll for Bow 60%',
          itemClass: 'consume',
        },
      ];
      // Query "60" matches "Scroll for Bow 60%" by name, even though no item has ID 60
      const notice = findExactIdNotice(
        '60',
        rowsWithName,
        { scope: ITEM_SCOPES.all },
        'cw-launch',
      );
      expect(notice).toBeNull();
    });

    it('returns null when the unique matching item is inside the current category', () => {
      // In Use, searching for 2000000 (Red Potion, which is in Use)
      const notice = findExactIdNotice(
        '2000000',
        dummyRows,
        { scope: ITEM_SCOPES.use },
        'cw-launch',
      );
      expect(notice).toBeNull();
    });

    it('returns outside-category notice when unique matching item is in another scope', () => {
      // Currently in ETC, searching for 2000000 (Red Potion, which is in Use)
      const notice = findExactIdNotice(
        '2000000',
        dummyRows,
        { scope: ITEM_SCOPES.etc },
        'cw-launch',
      );
      expect(notice).toEqual({
        kind: 'outside-category',
        item: dummyRows[0],
        owningScope: ITEM_SCOPES.use,
        query: '2000000',
      });
    });

    it('returns multiple notice when multiple items match numeric ID', () => {
      const notice = findExactIdNotice(
        '3000000',
        dummyRows,
        { scope: ITEM_SCOPES.use },
        'cw-launch',
      );
      expect(notice?.kind).toBe('multiple');
      const multipleNotice = notice as Extract<
        typeof notice,
        { kind: 'multiple' }
      >;
      expect(multipleNotice.items).toHaveLength(2);
    });
  });
});
