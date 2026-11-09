import type { ItemBrowseCoverage } from '@mapletip/data/items';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { deriveSortOptions, getItemColumns } from '..';
import { ITEM_SCOPES } from '../../categories';
import type { ItemRow } from '../../project';
import {
  computeScrollStatsSortValue,
  DEFAULT_ITEM_SORT,
  STAT_PRIORITY_MULTIPLIER,
} from '../../sort';
import { CONTEXT_COLUMNS } from '../contexts';

const mockCoverage: ItemBrowseCoverage = {
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

const cwCoverage: ItemBrowseCoverage = {
  scrollTier: 'unsupported',
  relationships: {
    'cash-shop-listing': 'complete',
    'found-in-container': 'complete',
    'made-by-recipe': 'complete',
    'monster-drop': 'unsupported',
    'needed-for-quest': 'complete',
    'quest-reward': 'complete',
    'used-in-recipe': 'complete',
  },
};

describe('getItemColumns - column set selection', () => {
  it('selects upgrade scroll columns and leaves name column unconstrained by width', () => {
    const scrollCategory = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find((c) => c.slug === 'upgrade-scrolls'),
    };
    const rowWithStats: ItemRow = {
      key: 'scroll-1',
      sourceId: '02040001',
      itemClass: 'consume',
      name: 'Scroll for Helmet for DEF 100%',
      targetLabel: 'hat',
      stats: { weaponDefense: 1 },
      success: 100,
    };

    const { columns, defaultHiddenColumns } = getItemColumns(
      scrollCategory,
      mockCoverage,
      [rowWithStats],
    );

    const nameCol = columns.find((c) => c.accessor === 'name');
    expect(nameCol).toBeDefined();
    expect(nameCol?.width).toBeUndefined(); // takes all leftover width

    const accessors = columns.map((c) => c.accessor);
    expect(accessors).toContain('targetLabel');
    expect(accessors).toContain('stats');
    expect(accessors).toContain('success');
    expect(accessors).toContain('cursed');
    expect(accessors).not.toContain('specials');
    expect(accessors).not.toContain('directTargetCount');
    expect(defaultHiddenColumns).toEqual([]);
  });

  it('includes specials and directTargetCount when present', () => {
    const scrollCategory = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find((c) => c.slug === 'upgrade-scrolls'),
    };
    const rowWithSpecials: ItemRow = {
      key: 'scroll-2',
      sourceId: '02040002',
      itemClass: 'consume',
      name: 'Chaos Scroll 60%',
      targetLabel: 'accessory',
      stats: { weaponAttack: 5 },
      success: 60,
      cursed: 100,
      specials: ['chaos'],
      directTargetCount: 3,
    };

    const { columns } = getItemColumns(scrollCategory, mockCoverage, [
      rowWithSpecials,
    ]);

    const accessors = columns.map((c) => c.accessor);
    expect(accessors).toContain('specials');
    expect(accessors).toContain('directTargetCount');
  });

  it('omits scroll tier when coverage is unsupported', () => {
    const scrollCategory = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find((c) => c.slug === 'upgrade-scrolls'),
    };
    const rowWithTier: ItemRow = {
      key: 'scroll-3',
      sourceId: '02040003',
      itemClass: 'consume',
      tier: 'lesser',
      stats: { weaponAttack: 2 },
    };

    const { columns: supportedCols } = getItemColumns(
      scrollCategory,
      mockCoverage,
      [rowWithTier],
    );
    expect(supportedCols.map((c) => c.accessor)).toContain('tier');

    const { columns: unsupportedCols } = getItemColumns(
      scrollCategory,
      cwCoverage,
      [rowWithTier],
    );
    expect(unsupportedCols.map((c) => c.accessor)).not.toContain('tier');
  });

  it('selects recovery columns showing numbers without redundant HP unit', () => {
    const recoveryCategory = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find((c) => c.slug === 'recovery'),
    };
    const rows: ItemRow[] = [
      {
        key: 'potion-1',
        sourceId: '02000000',
        itemClass: 'consume',
        hp: 50,
      },
      {
        key: 'potion-2',
        sourceId: '02000001',
        itemClass: 'consume',
        mp: 50,
      },
      {
        key: 'potion-3',
        sourceId: '02000002',
        itemClass: 'consume',
        hpPercent: 50,
        mpPercent: 50,
      },
    ];

    const { columns, facts } = getItemColumns(
      recoveryCategory,
      mockCoverage,
      rows,
    );
    const accessors = columns.map((c) => c.accessor);
    expect(accessors).toContain('hp');
    expect(accessors).toContain('mp');
    expect(accessors).toContain('hpPercent');
    expect(accessors).toContain('mpPercent');

    const hpFact = facts.find((f) => f.key === 'hp')!;
    expect(hpFact.value(rows[0]!)).toBe('50');
    const hpPercentFact = facts.find((f) => f.key === 'hpPercent')!;
    expect(hpPercentFact.value(rows[2]!)).toBe('50%');
  });

  it('selects projectile attack column with formatted plus', () => {
    const starsCategory = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find((c) => c.slug === 'throwing-stars'),
    };
    const rows: ItemRow[] = [
      {
        key: 'subi',
        sourceId: '02070000',
        itemClass: 'consume',
        attack: 15,
      },
      {
        key: 'other',
        sourceId: '02070001',
        itemClass: 'consume',
        attack: 21,
      },
    ];

    const { columns, facts } = getItemColumns(
      starsCategory,
      mockCoverage,
      rows,
    );
    const attackCol = columns.find((c) => c.accessor === 'attack')!;
    expect(attackCol).toBeDefined();
    const attackFact = facts.find((f) => f.key === 'attack')!;
    expect(attackFact.value(rows[0]!)).toBe('+15');
  });

  it('keeps feeding columns visible on Pet Food', () => {
    const petFoodCategory = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find((c) => c.slug === 'pet-food'),
    };
    const rows: ItemRow[] = [
      {
        key: 'food-1',
        sourceId: '02120000',
        itemClass: 'consume',
        fullness: 30,
        closeness: 1,
        petTargets: [{ key: '5000000', name: 'Cat' }],
      },
      {
        key: 'food-2',
        sourceId: '02120001',
        itemClass: 'consume',
        fullness: 100,
        closeness: 5,
        petTargets: [{ key: '5000001', name: 'Dog' }],
      },
    ];

    const { columns, defaultHiddenColumns } = getItemColumns(
      petFoodCategory,
      mockCoverage,
      rows,
    );
    const accessors = columns.map((c) => c.accessor);
    expect(accessors).toContain('fullness');
    expect(accessors).toContain('closeness');
    expect(accessors).toContain('petTargets');
    expect(defaultHiddenColumns).not.toContain('fullness');
    expect(defaultHiddenColumns).not.toContain('petTargets');
  });

  it('places feeding columns in optional hidden columns on Cash Items and omits Kind', () => {
    const cashItemsCategory = {
      scope: ITEM_SCOPES.cash,
      child: ITEM_SCOPES.cash.children.find((c) => c.slug === 'cash-items'),
    };
    // 2 rows: one feeder, one non-feeder, both are Cash Items (itemClass: 'cash')
    const rows: ItemRow[] = [
      {
        key: 'cash-feeder',
        sourceId: '05240000',
        itemClass: 'cash',
        fullness: 50,
      },
      {
        key: 'cash-hat',
        sourceId: '01000000',
        itemClass: 'cash',
      },
    ];

    const { columns, defaultHiddenColumns } = getItemColumns(
      cashItemsCategory,
      mockCoverage,
      rows,
    );
    const accessors = columns.map((c) => c.accessor);

    // Kind is omitted because every row has itemClass === 'cash'
    expect(accessors).not.toContain('itemClass');

    // Feeding columns are included but hidden by default
    expect(accessors).toContain('fullness');
    expect(defaultHiddenColumns).toContain('fullness');
  });

  it('handles questFlag truthfulness: true Yes, false No, undefined absent', () => {
    const questCategory = {
      scope: ITEM_SCOPES.etc,
      child: ITEM_SCOPES.etc.children.find((c) => c.slug === 'quest-items'),
    };
    const rows: ItemRow[] = [
      { key: 'q1', sourceId: '1', itemClass: 'etc', questFlag: true },
      { key: 'q2', sourceId: '2', itemClass: 'etc', questFlag: false },
      { key: 'q3', sourceId: '3', itemClass: 'etc' },
    ];

    const { columns, facts } = getItemColumns(
      questCategory,
      mockCoverage,
      rows,
    );
    const flagCol = columns.find((c) => c.accessor === 'questFlag')!;
    expect(flagCol).toBeDefined();

    const flagFact = facts.find((f) => f.key === 'questFlag')!;
    expect(flagFact.value(rows[0]!)).toBe('Yes');
    expect(flagFact.value(rows[1]!)).toBe('No');
    expect(flagFact.value(rows[2]!)).toBeUndefined();

    // Table cell render
    const renderedMissing = renderToString(flagCol.render!(rows[2]!));
    expect(renderedMissing).toContain('title="Not recorded"');
    expect(renderedMissing).toContain('—');
  });

  it('renders truthful cell states for relationship coverage', () => {
    const questCategory = {
      scope: ITEM_SCOPES.etc,
      child: ITEM_SCOPES.etc.children.find((c) => c.slug === 'quest-items'),
    };
    const rows: ItemRow[] = [
      {
        key: 'q1',
        sourceId: '1',
        itemClass: 'etc',
        neededForQuestCount: 12,
      },
      {
        key: 'q2',
        sourceId: '2',
        itemClass: 'etc',
      },
    ];

    const partialCoverage: ItemBrowseCoverage = {
      ...mockCoverage,
      relationships: {
        ...mockCoverage.relationships,
        'needed-for-quest': 'partial',
      },
    };

    const { columns } = getItemColumns(questCategory, partialCoverage, rows);
    const col = columns.find((c) => c.accessor === 'neededForQuestCount')!;

    // Table render in partial coverage
    const countHtml = renderToString(col.render!(rows[0]!));
    expect(countHtml).toContain('12');

    // Missing count in partial coverage renders None recorded
    const missingHtml = renderToString(col.render!(rows[1]!));
    expect(missingHtml).toContain('None recorded');
  });

  it('states lower bound in monster drops fullLabel once', () => {
    const etcCategory = { scope: ITEM_SCOPES.etc };
    const rows: ItemRow[] = [
      { key: 'e1', sourceId: '1', itemClass: 'etc', monsterDropCount: 5 },
      { key: 'e2', sourceId: '2', itemClass: 'etc', monsterDropCount: 10 },
    ];
    const { columns } = getItemColumns(etcCategory, mockCoverage, rows);
    const dropCol = columns.find((c) => c.accessor === 'monsterDropCount');
    expect(dropCol?.fullLabel).toBe('Monster drops (lower bound)');
  });

  it('omits relationship column when coverage is unsupported', () => {
    const etcCategory = {
      scope: ITEM_SCOPES.etc,
    };
    const rows: ItemRow[] = [
      {
        key: 'e1',
        sourceId: '1',
        itemClass: 'etc',
        monsterDropCount: 5,
      },
    ];

    const { columns } = getItemColumns(etcCategory, cwCoverage, rows);
    const accessors = columns.map((c) => c.accessor);
    expect(accessors).not.toContain('monsterDropCount');
  });
});

describe('deriveSortOptions', () => {
  it('derives sort options from columns by numeric vs text rule and custom sort labels', () => {
    const scrollCategory = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find((c) => c.slug === 'upgrade-scrolls'),
    };
    const rows: ItemRow[] = [
      {
        key: 'scroll-1',
        sourceId: '02040001',
        itemClass: 'consume',
        targetLabel: 'hat',
        stats: { weaponAttack: 2 },
        success: 100,
      },
      {
        key: 'scroll-2',
        sourceId: '02040002',
        itemClass: 'consume',
        targetLabel: 'topwear',
        stats: { weaponAttack: 5 },
        success: 60,
      },
    ];

    const { columns } = getItemColumns(scrollCategory, mockCoverage, rows);
    const sortOptions = deriveSortOptions(columns);

    // Text column (targetLabel) sorts asc first (A–Z)
    const targetOptions = sortOptions.filter((o) => o.field === 'targetLabel');
    expect(targetOptions).toHaveLength(2);
    expect(targetOptions[0]).toEqual({
      field: 'targetLabel',
      direction: 'asc',
      label: 'Equipment type (A–Z)',
    });
    expect(targetOptions[1]).toEqual({
      field: 'targetLabel',
      direction: 'desc',
      label: 'Equipment type (Z–A)',
    });

    // Custom sort labels on stats: strongest first / weakest first
    const statsOptions = sortOptions.filter((o) => o.field === 'stats');
    expect(statsOptions).toHaveLength(2);
    expect(statsOptions[0]).toEqual({
      field: 'stats',
      direction: 'desc',
      label: 'Stats Improved: strongest first',
    });
    expect(statsOptions[1]).toEqual({
      field: 'stats',
      direction: 'asc',
      label: 'Stats Improved: weakest first',
    });

    // Numeric column (success) sorts desc first (high to low)
    const successOptions = sortOptions.filter((o) => o.field === 'success');
    expect(successOptions).toHaveLength(2);
    expect(successOptions[0]).toEqual({
      field: 'success',
      direction: 'desc',
      label: 'Success: high to low',
    });
    expect(successOptions[1]).toEqual({
      field: 'success',
      direction: 'asc',
      label: 'Success: low to high',
    });
  });
});

describe('sort accessors', () => {
  it('guarantees multiplier exceeds largest GMS delta of 140', () => {
    expect(STAT_PRIORITY_MULTIPLIER).toBeGreaterThan(140);
  });

  it('sorts scrolls by stat priority then amount', () => {
    const wa1: ItemRow = {
      key: '1',
      sourceId: '1',
      itemClass: 'consume',
      stats: { weaponAttack: 1 },
    };
    const str140: ItemRow = {
      key: '2',
      sourceId: '2',
      itemClass: 'consume',
      stats: { strength: 140 },
    };
    const wa5: ItemRow = {
      key: '3',
      sourceId: '3',
      itemClass: 'consume',
      stats: { weaponAttack: 5 },
    };
    const noStats: ItemRow = {
      key: '4',
      sourceId: '4',
      itemClass: 'consume',
    };

    const wa1Score = computeScrollStatsSortValue(wa1)!;
    const str140Score = computeScrollStatsSortValue(str140)!;
    const wa5Score = computeScrollStatsSortValue(wa5)!;
    const noStatsScore = computeScrollStatsSortValue(noStats);

    // Weapon ATT strictly outranks STR even if STR delta is +140
    expect(wa1Score).toBeGreaterThan(str140Score);
    // Weapon ATT +5 outranks Weapon ATT +1
    expect(wa5Score).toBeGreaterThan(wa1Score);
    // Missing stats return undefined so sortUndefined: 'last' sorts them last
    expect(noStatsScore).toBeUndefined();
  });

  it('keeps default sort as name asc', () => {
    expect(DEFAULT_ITEM_SORT).toEqual({
      field: 'name',
      direction: 'asc',
    });
  });

  it('maintains disjoint visible and optional column lists with no duplicates across all contexts', () => {
    for (const [contextKey, config] of Object.entries(CONTEXT_COLUMNS)) {
      const visibleSet = new Set(config.visible);
      const optionalKeys = config.optional ?? [];
      const optionalSet = new Set(optionalKeys);
      const overlap = optionalKeys.filter((key) => visibleSet.has(key));

      expect(visibleSet.size, `Duplicate visible keys in ${contextKey}`).toBe(
        config.visible.length,
      );
      expect(optionalSet.size, `Duplicate optional keys in ${contextKey}`).toBe(
        optionalKeys.length,
      );
      expect(
        overlap,
        `Overlapping visible/optional keys in ${contextKey}`,
      ).toEqual([]);
    }
  });
});
