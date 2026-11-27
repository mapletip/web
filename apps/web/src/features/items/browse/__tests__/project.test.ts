import type { ItemBrowseRowV2_2 } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { projectItemBrowseRows } from '../project';

function makeBaseRow(
  overrides: Partial<ItemBrowseRowV2_2> = {},
): ItemBrowseRowV2_2 {
  return {
    key: 'item:fixture:1',
    sourceId: '02000000',
    publicId: 'test0001',
    slug: 'crimson-tonic',
    itemClass: 'consume',
    name: { state: 'known', value: 'Crimson Tonic' },
    icon: { state: 'known', value: 'a'.repeat(64) },
    ...overrides,
  };
}

describe('projectItemBrowseRows', () => {
  it('projects a published Cash Shop price and omits an unpublished one', () => {
    const rows = projectItemBrowseRows([
      makeBaseRow({
        itemClass: 'cash',
        cashShopSale: {
          state: 'on-sale',
          duration: { kind: 'permanent' },
          price: 2400,
          quantity: 1,
        },
      }),
      makeBaseRow({
        key: 'item:fixture:2',
        sourceId: '02000002',
        itemClass: 'cash',
        cashShopSale: { state: 'not-on-sale' },
      }),
    ]);
    expect(rows.map((row) => row.nxPrice)).toEqual([2400, undefined]);
  });
  it('drops unknown and unsupported names while keeping known icons', () => {
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
        name: { state: 'unsupported' },
        icon: { state: 'absent', coverageKey: 'test' },
      }),
      makeBaseRow({
        key: 'item:3',
        sourceId: '02000003',
        icon: { state: 'unsupported' },
      }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.sourceId).toBe('02000003');
    expect(rows[0]?.icon).toBeUndefined();

    // Verify dropped payload fields are not present on rows
    expect('nameState' in (rows[0] ?? {})).toBe(false);
    expect('rel' in (rows[0] ?? {})).toBe(false);
    expect('statKeys' in (rows[0] ?? {})).toBe(false);
  });

  it('keeps known 0 values for numeric properties', () => {
    const [rowWithZero] = projectItemBrowseRows([
      makeBaseRow({
        projectileAttack: 0,
        recovery: { hp: 0, mp: 0, hpPercent: 0, mpPercent: 0 },
        seatingRecovery: { hp: 0, mp: 0 },
        petFood: { fullness: 0 },
        scroll: {
          success: 0,
          cursed: 0,
          deltas: { weaponAttack: 0 },
        },
        relationships: {
          'cash-shop-listing': 0,
        },
      }),
    ]);

    expect(rowWithZero?.attack).toBe(0);
    expect(rowWithZero?.hp).toBe(0);
    expect(rowWithZero?.mp).toBe(0);
    expect(rowWithZero?.hpPercent).toBe(0);
    expect(rowWithZero?.mpPercent).toBe(0);
    expect(rowWithZero?.seatHp).toBe(0);
    expect(rowWithZero?.seatMp).toBe(0);
    expect(rowWithZero?.fullness).toBe(0);
    expect(rowWithZero?.success).toBe(0);
    expect(rowWithZero?.cursed).toBe(0);
  });

  it('preserves questFlag as true, false, and undefined distinctly', () => {
    const [trueRow, falseRow, undefinedRow] = projectItemBrowseRows([
      makeBaseRow({
        key: 'item:quest:true',
        sourceId: '04030001',
        questFlag: true,
      }),
      makeBaseRow({
        key: 'item:quest:false',
        sourceId: '04030002',
        questFlag: false,
      }),
      makeBaseRow({
        key: 'item:quest:none',
        sourceId: '04030003',
      }),
    ]);

    expect(trueRow?.questFlag).toBe(true);
    expect(falseRow?.questFlag).toBe(false);
    expect(undefinedRow?.questFlag).toBeUndefined();
    expect('questFlag' in (undefinedRow ?? {})).toBe(false);
  });

  it('projects Restorative-style percent-only rows with no flat hp or mp', () => {
    const [row] = projectItemBrowseRows([
      makeBaseRow({
        sourceId: '02000004',
        name: { state: 'known', value: 'Restorative' },
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

  it('projects published player facts without stand-in values or extra serialized keys', () => {
    const [known, unknown, unsupported] = projectItemBrowseRows([
      makeBaseRow({
        types: ['potion'],
        sellPrice: 0,
        maxStack: 1,
        requirement: { level: 12 },
        buff: {
          durationSeconds: 600,
          effects: [{ stat: 'speed', unit: 'flat', value: 5 }],
        },
      }),
      makeBaseRow({
        sourceId: '02000001',
        maxStack: null,
        requirement: { level: null },
        buff: null,
      }),
      makeBaseRow({
        sourceId: '02000002',
      }),
    ]);

    expect(known).toMatchObject({
      sellPrice: 0,
      maxStack: 1,
      level: 12,
      buff: {
        durationSeconds: 600,
        effects: [{ stat: 'speed', unit: 'flat', value: 5 }],
      },
      kind: 'potions-and-food',
      kindPath: ['all', 'use', 'potions-and-food'],
    });
    for (const row of [unknown, unsupported]) {
      expect(row?.sellPrice).toBeUndefined();
      expect(row?.maxStack).toBeUndefined();
      expect(row?.level).toBeUndefined();
      expect(row?.buff).toBeUndefined();
    }
    const serialized = JSON.parse(JSON.stringify(known)) as Record<
      string,
      unknown
    >;
    expect(Object.keys(serialized).sort()).toEqual(
      [
        'buff',
        'icon',
        'itemClass',
        'key',
        'kind',
        'kindPath',
        'level',
        'maxStack',
        'name',
        'sellPrice',
        'sourceId',
        'types',
      ].sort(),
    );
  });
});
