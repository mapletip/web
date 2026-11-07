import { describe, expect, it } from 'vitest';

import {
  ITEM_CHILD_SLUGS,
  ITEM_SCOPES,
  matchesCategory,
  type ItemCategoryChildId,
  type ItemScopeSlug,
} from '../categories';
import { CATEGORY_ICONS } from '../category-icons';
import { getItemNavTree } from '../navigation';
import type { ItemRow } from '../project';

describe('category-icons configuration and resolution', () => {
  it('ensures every table key is a real registry child and covers all 28 children', () => {
    const tableKeys = Object.keys(CATEGORY_ICONS) as ItemCategoryChildId[];
    expect(tableKeys).toHaveLength(28);

    for (const key of tableKeys) {
      const [scopeSlug, childSlug] = key.split('/') as [ItemScopeSlug, string];
      const scope = ITEM_SCOPES[scopeSlug];
      expect(
        scope,
        `Scope ${scopeSlug} must exist in ITEM_SCOPES`,
      ).toBeDefined();

      const child = scope.children.find((c) => c.slug === childSlug);
      expect(
        child,
        `Child ${childSlug} must exist under scope ${scopeSlug} in ITEM_SCOPES`,
      ).toBeDefined();
    }

    // Verify all children in ITEM_SCOPES have a key in CATEGORY_ICONS
    for (const [scopeSlug, childSlugs] of Object.entries(ITEM_CHILD_SLUGS)) {
      for (const childSlug of childSlugs) {
        const expectedKey = `${scopeSlug}/${childSlug}` as ItemCategoryChildId;
        expect(
          CATEGORY_ICONS[expectedKey],
          `CATEGORY_ICONS must contain key ${expectedKey}`,
        ).toBeDefined();
      }
    }
  });

  it('ensures every listed ID in the table is an actual member of its category in a fixture', () => {
    // Construct representative fixture items for every listed source ID in CATEGORY_ICONS
    const fixtureRows: readonly ItemRow[] = [
      // Use
      {
        key: '02040000',
        sourceId: '02040000',
        itemClass: 'consume',
        types: ['upgrade-scroll'],
      },
      {
        key: '02040001',
        sourceId: '02040001',
        itemClass: 'consume',
        types: ['upgrade-scroll'],
      },
      {
        key: '02000000',
        sourceId: '02000000',
        itemClass: 'consume',
        functions: ['recovery'],
        types: ['potion'],
      },
      {
        key: '02000002',
        sourceId: '02000002',
        itemClass: 'consume',
        functions: ['recovery'],
        types: ['potion'],
      },
      {
        key: '02000001',
        sourceId: '02000001',
        itemClass: 'consume',
        functions: ['recovery'],
        types: ['potion'],
      },
      {
        key: '02070000',
        sourceId: '02070000',
        itemClass: 'consume',
        types: ['throwing-star'],
      },
      {
        key: '02070006',
        sourceId: '02070006',
        itemClass: 'consume',
        types: ['throwing-star'],
      },
      {
        key: '02070005',
        sourceId: '02070005',
        itemClass: 'consume',
        types: ['throwing-star'],
      },
      {
        key: '02060000',
        sourceId: '02060000',
        itemClass: 'consume',
        types: ['arrow'],
      },
      {
        key: '02061000',
        sourceId: '02061000',
        itemClass: 'consume',
        types: ['arrow'],
      },
      {
        key: '02060001',
        sourceId: '02060001',
        itemClass: 'consume',
        types: ['arrow'],
      },
      {
        key: '02330000',
        sourceId: '02330000',
        itemClass: 'consume',
        types: ['bullet'],
      },
      {
        key: '02330001',
        sourceId: '02330001',
        itemClass: 'consume',
        types: ['bullet'],
      },
      {
        key: '02330002',
        sourceId: '02330002',
        itemClass: 'consume',
        types: ['bullet'],
      },
      {
        key: '02120000',
        sourceId: '02120000',
        itemClass: 'consume',
        types: ['pet-food'],
      },
      {
        key: '02100000',
        sourceId: '02100000',
        itemClass: 'consume',
        functions: ['summon'],
      },
      {
        key: '02100007',
        sourceId: '02100007',
        itemClass: 'consume',
        functions: ['summon'],
      },
      {
        key: '02022428',
        sourceId: '02022428',
        itemClass: 'consume',
        functions: ['reward-container'],
      },
      {
        key: '02022336',
        sourceId: '02022336',
        itemClass: 'consume',
        functions: ['reward-container'],
      },
      {
        key: '02000003',
        sourceId: '02000003',
        itemClass: 'consume',
        types: ['potion'],
      },
      {
        key: '02000006',
        sourceId: '02000006',
        itemClass: 'consume',
        types: ['potion'],
      },
      {
        key: '02022002',
        sourceId: '02022002',
        itemClass: 'consume',
        types: ['food-buff'],
      },
      {
        key: '02012000',
        sourceId: '02012000',
        itemClass: 'consume',
        types: ['food-buff'],
      },
      {
        key: '02020006',
        sourceId: '02020006',
        itemClass: 'consume',
        types: ['food-buff'],
      },
      {
        key: '02380001',
        sourceId: '02380001',
        itemClass: 'consume',
        functions: ['monster-card'],
      },
      {
        key: '02380007',
        sourceId: '02380007',
        itemClass: 'consume',
        functions: ['monster-card'],
      },
      {
        key: '02380005',
        sourceId: '02380005',
        itemClass: 'consume',
        functions: ['monster-card'],
      },
      {
        key: '02290053',
        sourceId: '02290053',
        itemClass: 'consume',
        functions: ['skill'],
      },
      {
        key: '02290084',
        sourceId: '02290084',
        itemClass: 'consume',
        functions: ['skill'],
      },
      {
        key: '02280010',
        sourceId: '02280010',
        itemClass: 'consume',
        functions: ['skill'],
      },
      {
        key: '02028000',
        sourceId: '02028000',
        itemClass: 'consume',
        types: ['meso-pouch'],
      },
      {
        key: '02028001',
        sourceId: '02028001',
        itemClass: 'consume',
        types: ['meso-pouch'],
      },
      { key: '02030000', sourceId: '02030000', itemClass: 'consume' },
      { key: '02030004', sourceId: '02030004', itemClass: 'consume' },

      // ETC
      {
        key: '04031039',
        sourceId: '04031039',
        itemClass: 'etc',
        neededForQuestCount: 1,
      },
      {
        key: '04031040',
        sourceId: '04031040',
        itemClass: 'etc',
        neededForQuestCount: 1,
      },
      {
        key: '04031041',
        sourceId: '04031041',
        itemClass: 'etc',
        neededForQuestCount: 1,
      },
      {
        key: '04020000',
        sourceId: '04020000',
        itemClass: 'etc',
        usedInRecipeCount: 1,
        types: ['ore'],
      },
      {
        key: '04020007',
        sourceId: '04020007',
        itemClass: 'etc',
        usedInRecipeCount: 1,
        types: ['ore'],
      },
      {
        key: '04010006',
        sourceId: '04010006',
        itemClass: 'etc',
        types: ['ore'],
      },
      {
        key: '04010001',
        sourceId: '04010001',
        itemClass: 'etc',
        types: ['ore'],
      },
      {
        key: '04010000',
        sourceId: '04010000',
        itemClass: 'etc',
        types: ['ore'],
      },
      {
        key: '04020107',
        sourceId: '04020107',
        itemClass: 'etc',
        types: ['gem'],
      },
      {
        key: '04021007',
        sourceId: '04021007',
        itemClass: 'etc',
        types: ['gem'],
      },
      {
        key: '04010101',
        sourceId: '04010101',
        itemClass: 'etc',
        types: ['refined-material'],
      },
      {
        key: '04011001',
        sourceId: '04011001',
        itemClass: 'etc',
        types: ['refined-material'],
      },
      {
        key: '04000009',
        sourceId: '04000009',
        itemClass: 'etc',
        types: ['monster-material'],
      },

      // Set-up
      {
        key: '03010000',
        sourceId: '03010000',
        itemClass: 'setup',
        types: ['chair'],
      },
      {
        key: '03010008',
        sourceId: '03010008',
        itemClass: 'setup',
        types: ['chair'],
      },
      {
        key: '03010007',
        sourceId: '03010007',
        itemClass: 'setup',
        types: ['chair'],
      },
      {
        key: '03992024',
        sourceId: '03992024',
        itemClass: 'setup',
        types: ['holiday-ornament'],
      },
      {
        key: '03992021',
        sourceId: '03992021',
        itemClass: 'setup',
        types: ['holiday-ornament'],
      },
      {
        key: '03992026',
        sourceId: '03992026',
        itemClass: 'setup',
        types: ['holiday-ornament'],
      },
      {
        key: '03000005',
        sourceId: '03000005',
        itemClass: 'setup',
        types: ['furniture'],
      },
      {
        key: '03000006',
        sourceId: '03000006',
        itemClass: 'setup',
        types: ['furniture'],
      },
      {
        key: '03030000',
        sourceId: '03030000',
        itemClass: 'setup',
        types: ['crafting-station'],
      },
      {
        key: '03030001',
        sourceId: '03030001',
        itemClass: 'setup',
        types: ['crafting-station'],
      },

      // Cash/Pet
      { key: '5000000', sourceId: '5000000', itemClass: 'pet' },
      { key: '5000001', sourceId: '5000001', itemClass: 'pet' },
      { key: '5000002', sourceId: '5000002', itemClass: 'pet' },
      { key: '05120002', sourceId: '05120002', itemClass: 'cash' },
      { key: '05010000', sourceId: '05010000', itemClass: 'cash' },
      { key: '05010002', sourceId: '05010002', itemClass: 'cash' },
    ];

    const fixtureBySourceId = new Map(fixtureRows.map((r) => [r.sourceId, r]));

    for (const [key, sourceIds] of Object.entries(CATEGORY_ICONS)) {
      const [scopeSlug, childSlug] = key.split('/') as [ItemScopeSlug, string];
      const scope = ITEM_SCOPES[scopeSlug];
      const child = scope.children.find((c) => c.slug === childSlug);
      expect(child).toBeDefined();

      for (const sourceId of sourceIds) {
        const row = fixtureBySourceId.get(sourceId);
        expect(
          row,
          `Row with sourceId ${sourceId} must exist in fixture`,
        ).toBeDefined();
        const isMember = row ? matchesCategory(row, scope, child) : false;
        expect(
          isMember,
          `sourceId ${sourceId} must be a member of category ${key}`,
        ).toBe(true);
      }
    }
  });

  it('yields no icon when preferred IDs are missing or have no icon', () => {
    // Rows contain members of recovery, but neither has sourceId in CATEGORY_ICONS or an icon
    const rowsWithoutPreferred: readonly ItemRow[] = [
      {
        key: 'other-recovery',
        sourceId: '02999999',
        itemClass: 'consume',
        functions: ['recovery'],
        icon: '3e6f5119559b88de2f712dc0bf15ede726d2db79649e96a0a46c57c72fea0559',
      },
      {
        key: 'recovery-no-icon',
        sourceId: '02000000',
        itemClass: 'consume',
        functions: ['recovery'],
        // icon is omitted
      },
    ];

    const tree = getItemNavTree(rowsWithoutPreferred, 'cw-launch');
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

  it('resolves the first preferred source ID with a known icon', () => {
    // Both 02000002 (second preference) and 02000001 (third preference) are present with icons,
    // but 02000000 (first preference) is missing.
    const rows: readonly ItemRow[] = [
      {
        key: 'white-pot',
        sourceId: '02000002',
        itemClass: 'consume',
        functions: ['recovery'],
        icon: '182b52bbd81a4baeff46af86ad8317adfad729e10e78e4c5cb41c46a7263d5f6',
      },
      {
        key: 'orange-pot',
        sourceId: '02000001',
        itemClass: 'consume',
        functions: ['recovery'],
        icon: 'd49da50440246171b9a8898595c30abfee7bd89945afd651cfa76d6f463378d5',
      },
    ];

    const tree = getItemNavTree(rows, 'cw-launch');
    const useScope = tree.children?.find((c) => c.id === 'use');
    const recoveryNode = useScope?.children?.find(
      (c) => c.id === 'use/recovery',
    );

    expect(recoveryNode?.icon).toBeDefined();
    // Resolves to 02000002 (first available preferred ID)
    const iconProps = recoveryNode?.icon as React.ReactElement<{ src: string }>;
    expect(iconProps.props.src).toContain(
      '182b52bbd81a4baeff46af86ad8317adfad729e10e78e4c5cb41c46a7263d5f6',
    );
  });
});
