import type { ItemBrowseRow } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { projectItemBrowseRows } from '../project';

function makeBaseRow(overrides: Partial<ItemBrowseRow> = {}): ItemBrowseRow {
  return {
    key: 'item:fixture:1',
    sourceId: '02000000',
    itemClass: 'consume',
    name: { state: 'known', value: 'Red Potion' },
    icon: { state: 'known', value: 'a'.repeat(64) },
    ...overrides,
  };
}

describe('projectItemBrowseRows', () => {
  it('distinguishes unknown vs absent name and icon states', () => {
    const rows = projectItemBrowseRows([
      makeBaseRow({
        key: 'item:1',
        sourceId: '02000001',
        name: { state: 'unknown' },
        icon: { state: 'known', value: 'b'.repeat(64) },
      }),
      makeBaseRow({
        key: 'item:2',
        sourceId: '02000002',
        name: { state: 'absent', coverageKey: 'test' },
        icon: { state: 'absent', coverageKey: 'test' },
      }),
    ]);

    expect(rows[0]?.name).toBeUndefined();
    expect(rows[0]?.nameState).toBe('unknown');
    expect(rows[0]?.icon).toBe('b'.repeat(64));

    expect(rows[1]?.name).toBeUndefined();
    expect(rows[1]?.nameState).toBe('absent');
    expect(rows[1]?.icon).toBeUndefined();
  });

  it('keeps known 0 values for numeric properties and does not drop them', () => {
    const [row] = projectItemBrowseRows([
      makeBaseRow({
        projectileAttack: 0,
        recovery: { hp: 0, mp: 0, hpPercent: 0, mpPercent: 0 },
        seatingRecovery: { hp: 0, mp: 0 },
        petFood: { closeness: 0, fullness: 0, tameness: 0 },
        scroll: {
          success: 0,
          cursed: 0,
          deltas: { weaponAttack: 0 },
          targets: [],
        },
        relationships: {
          'cash-shop-listing': 0,
        },
      }),
    ]);

    expect(row?.attack).toBe(0);
    expect(row?.hp).toBe(0);
    expect(row?.mp).toBe(0);
    expect(row?.hpPercent).toBe(0);
    expect(row?.mpPercent).toBe(0);
    expect(row?.seatHp).toBe(0);
    expect(row?.seatMp).toBe(0);
    expect(row?.closeness).toBe(0);
    expect(row?.fullness).toBe(0);
    expect(row?.tameness).toBe(0);
    expect(row?.success).toBe(0);
    expect(row?.cursed).toBe(0);
    expect(row?.directTargetCount).toBe(0);
  });

  it('resolves pet targets from the roster while preserving unresolved targets', () => {
    const petTargetKey = 'item:pet:kino';
    const rows = projectItemBrowseRows([
      makeBaseRow({
        key: petTargetKey,
        sourceId: '5000042',
        itemClass: 'pet',
        name: { state: 'known', value: 'Kino' },
      }),
      makeBaseRow({
        key: 'item:food:sprout',
        sourceId: '05240018',
        itemClass: 'cash',
        name: { state: 'known', value: 'Sprout' },
        petFood: {
          closeness: 100,
          targets: [petTargetKey],
          unresolvedTargets: ['5000046'],
        },
      }),
    ]);

    const sprout = rows.find((r) => r.sourceId === '05240018');
    expect(sprout).toBeDefined();
    expect(sprout?.petTargets).toEqual(['Kino']);
    expect(sprout?.unresolvedPetTargets).toEqual(['5000046']);
  });

  it('projects Elixir-style percent-only rows with no flat hp or mp', () => {
    const [row] = projectItemBrowseRows([
      makeBaseRow({
        sourceId: '02000004',
        name: { state: 'known', value: 'Elixir' },
        recovery: {
          hpPercent: 50,
          mpPercent: 50,
        },
      }),
    ]);

    expect(row?.hpPercent).toBe(50);
    expect(row?.mpPercent).toBe(50);
    expect(row?.hp).toBeUndefined();
    expect(row?.mp).toBeUndefined();
  });

  it('computes sortable statRank based on priority and delta amount', () => {
    const rows = projectItemBrowseRows([
      makeBaseRow({
        key: 'scroll:watt',
        sourceId: '02040001',
        scroll: { deltas: { weaponAttack: 5 } },
      }),
      makeBaseRow({
        key: 'scroll:str',
        sourceId: '02040002',
        scroll: { deltas: { strength: 5 } },
      }),
      makeBaseRow({
        key: 'scroll:none',
        sourceId: '02040003',
        scroll: {},
      }),
    ]);

    const wattScroll = rows.find((r) => r.key === 'scroll:watt');
    const strScroll = rows.find((r) => r.key === 'scroll:str');
    const noDeltaScroll = rows.find((r) => r.key === 'scroll:none');

    expect(wattScroll?.statRank).toBeDefined();
    expect(strScroll?.statRank).toBeDefined();
    expect(noDeltaScroll?.statRank).toBeUndefined();

    // weaponAttack has higher priority than strength (lower numeric rank)
    expect(wattScroll?.statRank).toBeLessThan(strScroll?.statRank ?? Infinity);
  });
});
