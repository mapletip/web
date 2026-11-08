import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { getCategoryCounts } from '../assignment';
import { ITEM_SCOPES } from '../categories';
import { buildItemNavHref, findItemNavNode, itemNavId } from '../navigation';
import { getItemNavTree } from '../navigation-tree';
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
      const root = getItemNavTree({ rows: dummyRows, buildId: 'cw-launch' });

      expect(root.id).toBe('all');
      expect(root.label).toBe('All Items');
      expect(root.count).toBe(expectedCounts.all.total);
      expect(root.href).toBe('/maplestory/items');
      expect(root.meta).toEqual({ buildId: undefined });
      expect(root.icon).toBeUndefined();

      const children = root.children ?? [];
      expect(children.map((c) => c.id)).toEqual([
        'use',
        'etc',
        'setup',
        'cash',
      ]);

      for (const scopeNode of children) {
        const slug = scopeNode.id as 'use' | 'etc' | 'setup' | 'cash';
        expect(scopeNode.label).toBe(ITEM_SCOPES[slug].label);
        expect(scopeNode.count).toBe(expectedCounts[slug].total);
        expect(scopeNode.href).toBe(`/maplestory/items/${slug}`);
        expect(scopeNode.meta).toEqual({
          buildId: undefined,
          scope: slug,
        });

        const childNodes = scopeNode.children ?? [];
        for (const childNode of childNodes) {
          const childSlug = childNode.id.replace(`${slug}/`, '');
          const registryChild = ITEM_SCOPES[slug].children.find(
            (c) => c.slug === childSlug,
          );
          expect(registryChild).toBeDefined();
          expect(childNode.label).toBe(registryChild?.label);
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
      const root = getItemNavTree({ rows: dummyRows, buildId: 'cw-launch' });
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
      const root = getItemNavTree({ rows: dummyRows, buildId: 'gms-v83' });
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
      const root = getItemNavTree({ rows: dummyRows, buildId: 'cw-launch' });
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

  describe('findItemNavNode', () => {
    it('locates root node by id and confirms it has no icon', () => {
      const tree = getItemNavTree({ rows: dummyRows, buildId: 'cw-launch' });
      const node = findItemNavNode(tree, 'all');
      expect(node).toBeDefined();
      expect(node?.id).toBe('all');
      expect(node?.label).toBe('All Items');
      expect(node?.icon).toBeUndefined();
    });

    it('locates scope node by id and provides its icon', () => {
      const tree = getItemNavTree({ rows: dummyRows, buildId: 'cw-launch' });
      const node = findItemNavNode(tree, 'use');
      expect(node).toBeDefined();
      expect(node?.id).toBe('use');
      expect(node?.label).toBe('Use');
      expect(node?.icon).toBeDefined();
    });

    it('locates child node by id without icon when rows omit icon', () => {
      const tree = getItemNavTree({ rows: dummyRows, buildId: 'cw-launch' });
      const node = findItemNavNode(tree, 'use/recovery');
      expect(node).toBeDefined();
      expect(node?.id).toBe('use/recovery');
      expect(node?.label).toBe('Recovery');
      expect(node?.icon).toBeUndefined();
    });

    it('locates child node by id with resolved item icon when rows have icon', () => {
      const rowsWithIcon: readonly ItemRow[] = [
        ...dummyRows,
        {
          key: 'consume:02000004:icon',
          sourceId: '02000004',
          itemClass: 'consume',
          functions: ['recovery'],
          icon: '07c090345b4e437b6204eb7e234119d7709846f6b263712c7df5121add2bdc71',
        },
      ];
      const tree = getItemNavTree({ rows: rowsWithIcon, buildId: 'cw-launch' });
      const node = findItemNavNode(tree, 'use/recovery');
      expect(node).toBeDefined();
      expect(node?.id).toBe('use/recovery');
      expect(node?.label).toBe('Recovery');
      expect(node?.icon).toBeDefined();
    });

    it('returns undefined for nonexistent id', () => {
      const tree = getItemNavTree({ rows: dummyRows, buildId: 'cw-launch' });
      expect(findItemNavNode(tree, 'nonexistent')).toBeUndefined();
    });

    it('yields no icon when a content ID is not carried by any member of the child', () => {
      // Case 1: Member of recovery has an unlisted icon
      // Case 2: Another category member carries recovery's preferred icon
      const rows: readonly ItemRow[] = [
        {
          key: 'recovery-unknown-icon',
          sourceId: '02000000',
          itemClass: 'consume',
          functions: ['recovery'],
          icon: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        },
        {
          key: 'etc-item-with-elixir-icon',
          sourceId: '04000000',
          itemClass: 'etc',
          types: ['monster-material'],
          icon: '07c090345b4e437b6204eb7e234119d7709846f6b263712c7df5121add2bdc71',
        },
      ];

      const tree = getItemNavTree({ rows, buildId: 'cw-launch' });
      const useScope = tree.children?.find((c) => c.id === 'use');
      const recoveryNode = useScope?.children?.find(
        (c) => c.id === 'use/recovery',
      );
      const otherEtcNode = tree.children
        ?.find((c) => c.id === 'etc')
        ?.children?.find((c) => c.id === 'etc/other-etc-items');

      expect(recoveryNode?.icon).toBeUndefined();
      expect(otherEtcNode?.icon).toBeUndefined();
    });

    it('resolves the icon when a member carries a preferred content ID', () => {
      const rows: readonly ItemRow[] = [
        {
          key: 'elixir-item',
          sourceId: '02000004',
          itemClass: 'consume',
          functions: ['recovery'],
          icon: '07c090345b4e437b6204eb7e234119d7709846f6b263712c7df5121add2bdc71',
        },
      ];

      const tree = getItemNavTree({ rows, buildId: 'cw-launch' });
      const useScope = tree.children?.find((c) => c.id === 'use');
      const recoveryNode = useScope?.children?.find(
        (c) => c.id === 'use/recovery',
      );

      expect(recoveryNode?.icon).toBeDefined();
      const iconElement = recoveryNode?.icon as ReactElement<{ src: string }>;
      expect(iconElement.props.src).toContain(
        '07c090345b4e437b6204eb7e234119d7709846f6b263712c7df5121add2bdc71',
      );
    });

    it('respects preference order when resolving icons', () => {
      const powerElixirOnly: readonly ItemRow[] = [
        {
          key: 'power-elixir-item',
          sourceId: '02000005',
          itemClass: 'consume',
          functions: ['recovery'],
          icon: '5aae760b2488feb48104655227f9faf80f84691197b940ab44775f8f2a0c3965',
        },
      ];

      const tree1 = getItemNavTree({
        rows: powerElixirOnly,
        buildId: 'cw-launch',
      });
      const node1 = findItemNavNode(tree1, 'use/recovery');
      expect(node1?.icon).toBeDefined();
      const iconElement1 = node1?.icon as ReactElement<{ src: string }>;
      expect(iconElement1.props.src).toContain(
        '5aae760b2488feb48104655227f9faf80f84691197b940ab44775f8f2a0c3965',
      );

      // When both first (Elixir) and second (Power Elixir) preferences are present,
      // first preference wins
      const bothPresent: readonly ItemRow[] = [
        ...powerElixirOnly,
        {
          key: 'elixir-item',
          sourceId: '02000004',
          itemClass: 'consume',
          functions: ['recovery'],
          icon: '07c090345b4e437b6204eb7e234119d7709846f6b263712c7df5121add2bdc71',
        },
      ];

      const tree2 = getItemNavTree({ rows: bothPresent, buildId: 'cw-launch' });
      const node2 = findItemNavNode(tree2, 'use/recovery');
      expect(node2?.icon).toBeDefined();
      const iconElement2 = node2?.icon as ReactElement<{ src: string }>;
      expect(iconElement2.props.src).toContain(
        '07c090345b4e437b6204eb7e234119d7709846f6b263712c7df5121add2bdc71',
      );
    });
  });
});
