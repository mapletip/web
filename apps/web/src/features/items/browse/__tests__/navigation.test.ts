import { describe, expect, it } from 'vitest';

import {
  getCategoryCounts,
  ITEM_SCOPES,
  ITEM_SCOPE_SLUGS,
} from '../categories';
import {
  buildItemNavHref,
  getItemNavTree,
  itemNavId,
  itemScopeIcon,
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

  describe('buildItemNavHref', () => {
    it('builds canonical hrefs without buildId', () => {
      expect(buildItemNavHref({})).toBe('/maplestory/items');
      expect(buildItemNavHref({ scope: 'use' })).toBe('/maplestory/items/use');
      expect(buildItemNavHref({ scope: 'use', child: 'recovery' })).toBe(
        '/maplestory/items/use/recovery',
      );
    });

    it('builds versioned hrefs with explicit buildId', () => {
      expect(buildItemNavHref({ buildId: 'gms-v83' })).toBe(
        '/maplestory/gms-v83/items',
      );
      expect(buildItemNavHref({ buildId: 'gms-v83', scope: 'etc' })).toBe(
        '/maplestory/gms-v83/items/etc',
      );
      expect(
        buildItemNavHref({
          buildId: 'gms-v83',
          scope: 'etc',
          child: 'quest-items',
        }),
      ).toBe('/maplestory/gms-v83/items/etc/quest-items');
    });
  });

  describe('itemNavId', () => {
    it('returns "all" for All Items category', () => {
      expect(itemNavId({ scope: ITEM_SCOPES.all })).toBe('all');
    });

    it('returns "<scope>" for scope category without child', () => {
      expect(itemNavId({ scope: ITEM_SCOPES.use })).toBe('use');
    });

    it('returns "<scope>/<child>" for child category', () => {
      const child = ITEM_SCOPES.use.children.find(
        (c) => c.slug === 'throwing-stars',
      );
      expect(child).toBeDefined();
      expect(itemNavId({ scope: ITEM_SCOPES.use, child })).toBe(
        'use/throwing-stars',
      );
    });
  });

  describe('getItemNavTree', () => {
    it('computes tree structure and counts matching getCategoryCounts', () => {
      const expectedCounts = getCategoryCounts(dummyRows);
      const root = getItemNavTree(dummyRows, 'cw-launch');

      expect(root.id).toBe('all');
      expect(root.label).toBe('All Items');
      expect(root.count).toBe(expectedCounts.all.total);
      expect(root.href).toBe('/maplestory/items');
      expect(root.meta).toEqual({ buildId: undefined });

      const children = root.children ?? [];
      expect(children.map((c) => c.id)).toEqual([
        'use',
        'etc',
        'setup',
        'cash',
      ]);

      for (const scopeNode of children) {
        const slug = scopeNode.id as 'use' | 'etc' | 'setup' | 'cash';
        expect(scopeNode.count).toBe(expectedCounts[slug].total);
        expect(scopeNode.href).toBe(`/maplestory/items/${slug}`);
        expect(scopeNode.meta).toEqual({
          buildId: undefined,
          scope: slug,
        });

        const childNodes = scopeNode.children ?? [];
        for (const childNode of childNodes) {
          const childSlug = childNode.id.replace(`${slug}/`, '');
          expect(childNode.count).toBe(
            expectedCounts[slug].children[childSlug] ?? 0,
          );
          expect(childNode.href).toBe(`/maplestory/items/${slug}/${childSlug}`);
          expect(childNode.meta).toEqual({
            buildId: undefined,
            scope: slug,
            child: childSlug,
          });
        }
      }
    });

    it('omits buildId in hrefs and meta for cw-launch', () => {
      const root = getItemNavTree(dummyRows, 'cw-launch');
      expect(root.href).toBe('/maplestory/items');
      expect(root.meta?.buildId).toBeUndefined();

      const useScope = root.children?.find((c) => c.id === 'use');
      expect(useScope?.href).toBe('/maplestory/items/use');
      expect(useScope?.meta?.buildId).toBeUndefined();

      const recoveryChild = useScope?.children?.find(
        (c) => c.id === 'use/recovery',
      );
      expect(recoveryChild?.href).toBe('/maplestory/items/use/recovery');
      expect(recoveryChild?.meta?.buildId).toBeUndefined();
    });

    it('includes buildId in hrefs and meta for gms-v83', () => {
      const root = getItemNavTree(dummyRows, 'gms-v83');
      expect(root.href).toBe('/maplestory/gms-v83/items');
      expect(root.meta?.buildId).toBe('gms-v83');

      const etcScope = root.children?.find((c) => c.id === 'etc');
      expect(etcScope?.href).toBe('/maplestory/gms-v83/items/etc');
      expect(etcScope?.meta?.buildId).toBe('gms-v83');

      const questChild = etcScope?.children?.find(
        (c) => c.id === 'etc/quest-items',
      );
      expect(questChild?.href).toBe(
        '/maplestory/gms-v83/items/etc/quest-items',
      );
      expect(questChild?.meta?.buildId).toBe('gms-v83');
    });

    it('retains zero-count categories with count 0 and valid href', () => {
      const root = getItemNavTree(dummyRows, 'cw-launch');
      const useScope = root.children?.find((c) => c.id === 'use');
      const bulletsChild = useScope?.children?.find(
        (c) => c.id === 'use/bullets',
      );

      expect(bulletsChild).toBeDefined();
      expect(bulletsChild?.count).toBe(0);
      expect(bulletsChild?.href).toBe('/maplestory/items/use/bullets');
      expect(bulletsChild?.meta).toEqual({
        buildId: undefined,
        scope: 'use',
        child: 'bullets',
      });
    });
  });

  describe('itemScopeIcon', () => {
    it('returns an img element with 20x20 sizing for each scope', () => {
      for (const slug of ITEM_SCOPE_SLUGS) {
        const icon = itemScopeIcon(slug);
        expect(icon.type).toBe('img');
        expect(icon.props.width).toBe(20);
        expect(icon.props.height).toBe(20);
        expect(icon.props.alt).toBe('');
        expect(icon.props.src).toBeDefined();
      }
    });
  });
});
