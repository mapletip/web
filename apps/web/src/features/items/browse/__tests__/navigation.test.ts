import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import { getItemNavData, ITEM_NAV_TARGET } from '../navigation';
import type { ItemRow } from '../project';

describe('navigation', () => {
  const dummyRows: readonly ItemRow[] = [
    {
      sourceId: '02000000',
      name: 'Red Potion',
      itemClass: 'consume',
      types: ['potion'],
    },
    {
      sourceId: '02070000',
      name: 'Subi Throwing-Stars',
      itemClass: 'consume',
      types: ['throwing-star'],
    },
    {
      sourceId: '04000000',
      name: 'Snail Shell',
      itemClass: 'etc',
    },
    {
      sourceId: '03000000',
      name: 'Blue Chair',
      itemClass: 'setup',
      types: ['chair'],
    },
    {
      sourceId: '5000000',
      name: 'Brown Puppy',
      itemClass: 'pet',
    },
  ];

  describe('getItemNavData', () => {
    it('computes distinct item counts once per roster', () => {
      const nav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.use },
        'cw-launch',
      );

      const allScope = nav.find((s) => s.slug === 'all');
      expect(allScope?.count).toBe(5);

      const useScope = nav.find((s) => s.slug === 'use');
      expect(useScope?.count).toBe(2);
      expect(useScope?.expanded).toBe(true);

      const etcScope = nav.find((s) => s.slug === 'etc');
      expect(etcScope?.count).toBe(1);
      expect(etcScope?.expanded).toBe(false);
    });

    it('keeps zero-count children visible, dimmed with 0 and valid links', () => {
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

    it('marks active scope and child', () => {
      const throwingStarsChild = ITEM_SCOPES.use.children.find(
        (c) => c.slug === 'throwing-stars',
      );
      const nav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.use, child: throwingStarsChild },
        'cw-launch',
      );

      const useScope = nav.find((s) => s.slug === 'use');
      const starChild = useScope?.children.find(
        (c) => c.slug === 'throwing-stars',
      );
      expect(starChild?.active).toBe(true);
    });

    it('nav model carries params and search without page parameter', () => {
      const nav = getItemNavData(
        dummyRows,
        { scope: ITEM_SCOPES.use },
        'gms-v83',
        { q: 'potion', page: 3, type: 'potion' },
      );

      const useScope = nav.find((s) => s.slug === 'use');
      expect(useScope?.to).toBe(ITEM_NAV_TARGET);
      expect(useScope?.params).toEqual({
        buildId: 'gms-v83',
        scope: 'use',
        child: undefined,
      });
      expect(useScope?.search).toEqual({
        q: 'potion',
        type: 'potion',
      });

      const allScope = nav.find((s) => s.slug === 'all');
      expect(allScope?.params).toEqual({
        buildId: 'gms-v83',
        scope: undefined,
        child: undefined,
      });
    });
  });
});
