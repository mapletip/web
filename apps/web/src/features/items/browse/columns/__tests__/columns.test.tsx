import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { getItemColumns } from '..';
import { ITEM_SCOPES } from '../../categories';
import type { ItemRow } from '../../project';
import { computeScrollStatsSortValue } from '../../sort';
import { COLUMNS } from '../configs';

const coverage: ItemBrowseCoverage = {
  scrollTier: 'complete',
  relationships: {
    'cash-shop-listing': 'complete',
    'found-in-container': 'complete',
    'made-by-recipe': 'complete',
    'monster-drop': 'complete',
    'needed-for-quest': 'complete',
    'quest-reward': 'complete',
    'used-in-recipe': 'complete',
  },
};

const unsupportedCoverage: ItemBrowseCoverage = {
  ...coverage,
  scrollTier: 'unsupported',
  relationships: {
    ...coverage.relationships,
    'monster-drop': 'unsupported',
  },
};

function category({
  scope,
  child,
}: {
  readonly scope: 'use' | 'etc' | 'setup';
  readonly child: string;
}) {
  const selectedScope = ITEM_SCOPES[scope];
  const selectedChild = selectedScope.children.find(
    (candidate) => candidate.slug === child,
  );
  if (!selectedChild)
    throw new Error(`Unknown test category: ${scope}/${child}`);
  return { scope: selectedScope, child: selectedChild };
}

describe('Items Browse columns', () => {
  it('shows contextual scroll columns, leaves optional facts hidden, and derives sorts', () => {
    const selected = category({ scope: 'use', child: 'scrolls' });
    const rows: readonly ItemRow[] = [
      {
        key: 'scroll-a',
        sourceId: '02040001',
        itemClass: 'consume',
        name: 'Scroll A',
        targetLabel: 'hat',
        stats: { weaponAttack: 7, strength: 3 },
        success: 100,
        tier: 'lesser',
        specials: ['chaos'],
        directTargetCount: 2,
      },
    ];

    const result = getItemColumns({ category: selected, coverage, rows });
    const accessors = result.columns.map((column) => column.accessor);

    expect(accessors).toEqual([
      'name',
      'targetLabel',
      'stats',
      'success',
      'cursed',
      'tier',
      'specials',
      'directTargetCount',
    ]);
    expect(result.defaultHiddenColumns).toEqual([
      'specials',
      'directTargetCount',
    ]);
    expect(
      result.sortOptions.map(({ field, direction }) => `${field}-${direction}`),
    ).toContain('stats-desc');
    expect(COLUMNS.stats.value(rows[0]!, coverage)).toBe(
      'Weapon ATT +7\nSTR +3',
    );
    expect(COLUMNS.cursed.value(rows[0]!, coverage)).toBe('-');
  });

  it('omits scroll tiers and unsupported relationship columns for the build', () => {
    const rows: readonly ItemRow[] = [
      {
        key: 'item-a',
        sourceId: '04000001',
        itemClass: 'etc',
        monsterDropCount: 2,
      },
      {
        key: 'item-b',
        sourceId: '04000002',
        itemClass: 'etc',
        monsterDropCount: 1,
      },
    ];
    const result = getItemColumns({
      category: { scope: ITEM_SCOPES.etc },
      coverage: unsupportedCoverage,
      rows,
    });

    expect(result.columns.map((column) => column.accessor)).not.toContain(
      'monsterDropCount',
    );
  });

  it('keeps projectile attack signed in cells and sorts by the raw number', () => {
    const selected = category({ scope: 'use', child: 'throwing-stars' });
    const row: ItemRow = {
      key: 'star-a',
      sourceId: '2070001',
      itemClass: 'consume',
      attack: 15,
    };
    const result = getItemColumns({
      category: selected,
      coverage,
      rows: [row, { ...row, key: 'star-b', attack: 20 }],
    });
    const attackColumn = result.columns.find(
      (column) => column.accessor === 'attack',
    );

    expect(attackColumn?.render?.(row)).toBeDefined();
    expect(COLUMNS.attack.value(row, coverage)).toBe('+15');
    expect(
      result.sortOptions.map(({ field, direction }) => `${field}-${direction}`),
    ).toContain('attack-desc');
  });

  it('keeps chair recovery headers on one line at a readable width', () => {
    const selected = category({ scope: 'setup', child: 'chairs' });
    const rows: readonly ItemRow[] = [
      {
        key: 'chair-a',
        sourceId: '3010000',
        itemClass: 'setup',
        seatHp: 10,
        seatMp: 5,
      },
      {
        key: 'chair-b',
        sourceId: '3010001',
        itemClass: 'setup',
        seatHp: 20,
        seatMp: 10,
      },
    ];
    const result = getItemColumns({ category: selected, coverage, rows });

    expect(
      result.columns.find((column) => column.accessor === 'seatHp'),
    ).toMatchObject({ title: 'HP Recovered / 10s', width: 190, nowrap: true });
    expect(
      result.columns.find((column) => column.accessor === 'seatMp'),
    ).toMatchObject({ title: 'MP Recovered / 10s', width: 190, nowrap: true });
  });

  it('sorts scroll stats by player priority and does not group numbers with commas', () => {
    const weaponAttack: ItemRow = {
      key: 'scroll-a',
      sourceId: '02040001',
      itemClass: 'consume',
      stats: { weaponAttack: 1 },
    };
    const strength: ItemRow = {
      key: 'scroll-b',
      sourceId: '02040002',
      itemClass: 'consume',
      stats: { strength: 100 },
    };

    expect(computeScrollStatsSortValue(weaponAttack)).toBeGreaterThan(
      computeScrollStatsSortValue(strength)!,
    );
    expect(COLUMNS.hp.value({ ...weaponAttack, hp: 1500 }, coverage)).toBe(
      '1500',
    );
  });
});
