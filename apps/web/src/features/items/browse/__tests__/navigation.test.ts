import { describe, expect, it } from 'vitest';

import { getCategoryCounts, ITEM_SCOPES } from '../categories';
import {
  getItemNavData,
  ITEM_NAV_TARGET,
  type ItemNavScope,
} from '../navigation';
import type { ItemRow } from '../project';

describe('navigation', () => {
  const dummyRows: readonly ItemRow[] = [
    {
      key: 'consume:02000000',
      sourceId: '02000000',
      name: 'Red Potion',
      itemClass: 'consume',
      types: ['potion'],
      functions: ['recovery'],
    },
    {
      key: 'consume:02070000',
      sourceId: '02070000',
      name: 'Subi Throwing-Stars',
      itemClass: 'consume',
      types: ['throwing-star'],
    },
    {
      key: 'consume:02999999',
      sourceId: '02999999',
      name: 'Mysterious Use Item',
      itemClass: 'consume',
    },
    {
      key: 'etc:04000000',
      sourceId: '04000000',
      name: 'Snail Shell',
      itemClass: 'etc',
    },
    {
      key: 'setup:03000000',
      sourceId: '03000000',
      name: 'Blue Chair',
      itemClass: 'setup',
      types: ['chair'],
    },
    {
      key: 'pet:5000000',
      sourceId: '5000000',
      name: 'Brown Puppy',
      itemClass: 'pet',
    },
  ];

  function countActive(scopes: readonly ItemNavScope[]): number {
    let total = 0;
    for (const scope of scopes) {
      if (scope.active) total += 1;
      for (const child of scope.children) {
        if (child.active) total += 1;
      }
    }
    return total;
  }

  describe('getItemNavData', () => {
    it('computes counts that equal getCategoryCounts', () => {
      const expectedCounts = getCategoryCounts(dummyRows);
      const nav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.all },
        'cw-launch',
      );

      for (const scope of nav) {
        expect(scope.count).toBe(expectedCounts[scope.slug].total);
        for (const child of scope.children) {
          expect(child.count).toBe(
            expectedCounts[scope.slug].children[child.slug] ?? 0,
          );
        }
      }
    });

    it('has exactly one active entry for All', () => {
      const nav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.all },
        'cw-launch',
      );

      expect(countActive(nav)).toBe(1);
      const allScope = nav.find((s) => s.slug === 'all');
      expect(allScope?.active).toBe(true);
    });

    it('has exactly one active entry for a scope page', () => {
      const nav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.use },
        'cw-launch',
      );

      expect(countActive(nav)).toBe(1);
      const useScope = nav.find((s) => s.slug === 'use');
      expect(useScope?.active).toBe(true);
      expect(useScope?.children.some((c) => c.active)).toBe(false);
    });

    it('has exactly one active entry for a child page', () => {
      const throwingStarsChild = ITEM_SCOPES.use.children.find(
        (c) => c.slug === 'throwing-stars',
      );
      expect(throwingStarsChild).toBeDefined();
      if (!throwingStarsChild) throw new Error('missing throwing-stars child');

      const nav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.use, child: throwingStarsChild },
        'cw-launch',
      );

      expect(countActive(nav)).toBe(1);
      const useScope = nav.find((s) => s.slug === 'use');
      expect(useScope?.active).toBe(false);

      const starChild = useScope?.children.find(
        (c) => c.slug === 'throwing-stars',
      );
      expect(starChild?.active).toBe(true);
    });

    it('has exactly one active entry for an Other child', () => {
      const otherUseChild = ITEM_SCOPES.use.children.find(
        (c) => c.slug === 'other-use-items',
      );
      expect(otherUseChild).toBeDefined();
      if (!otherUseChild) throw new Error('missing other-use-items child');

      const nav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.use, child: otherUseChild },
        'cw-launch',
      );

      expect(countActive(nav)).toBe(1);
      const useScope = nav.find((s) => s.slug === 'use');
      expect(useScope?.active).toBe(false);

      const otherChild = useScope?.children.find(
        (c) => c.slug === 'other-use-items',
      );
      expect(otherChild?.active).toBe(true);
    });

    it('omits buildId for cw-launch and includes it for gms-v83', () => {
      const cwNav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.use },
        'cw-launch',
      );
      const cwUse = cwNav.find((s) => s.slug === 'use');
      expect(cwUse?.params.buildId).toBeUndefined();
      expect(cwUse?.children[0]?.params.buildId).toBeUndefined();

      const gmsNav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.use },
        'gms-v83',
      );
      const gmsUse = gmsNav.find((s) => s.slug === 'use');
      expect(gmsUse?.params.buildId).toBe('gms-v83');
      expect(gmsUse?.children[0]?.params.buildId).toBe('gms-v83');
    });

    it('omits scope for All Items', () => {
      const nav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.all },
        'cw-launch',
      );

      const allScope = nav.find((s) => s.slug === 'all');
      expect(allScope?.params.scope).toBeUndefined();
      expect(allScope?.params.child).toBeUndefined();

      const useScope = nav.find((s) => s.slug === 'use');
      expect(useScope?.params.scope).toBe('use');
      expect(useScope?.params.child).toBeUndefined();
    });

    it('keeps zero-count children visible, dimmed with 0 and valid link targets', () => {
      const nav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.use },
        'cw-launch',
      );

      const useScope = nav.find((s) => s.slug === 'use');
      const bulletsChild = useScope?.children.find((c) => c.slug === 'bullets');

      expect(bulletsChild).toBeDefined();
      expect(bulletsChild?.count).toBe(0);
      expect(bulletsChild?.zeroCount).toBe(true);
      expect(bulletsChild?.to).toBe(ITEM_NAV_TARGET);
      expect(bulletsChild?.params).toEqual({
        buildId: undefined,
        scope: 'use',
        child: 'bullets',
      });
    });
  });
});
