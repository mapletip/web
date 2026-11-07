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
  it('omits absent or unknown name and icon while keeping known values', () => {
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
    expect(rows[0]?.icon).toBe('b'.repeat(64));

    expect(rows[1]?.name).toBeUndefined();
    expect(rows[1]?.icon).toBeUndefined();

    // Verify dropped payload fields are not present on rows
    expect('nameState' in (rows[0] ?? {})).toBe(false);
    expect('rel' in (rows[0] ?? {})).toBe(false);
    expect('statKeys' in (rows[0] ?? {})).toBe(false);
    expect('key' in (rows[0] ?? {})).toBe(false);
  });

  it('keeps known 0 values for numeric properties and records directTargetCount only when > 0', () => {
    const [rowWithZero, rowWithTargets] = projectItemBrowseRows([
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
      makeBaseRow({
        scroll: {
          targets: ['equip:1', 'equip:2'],
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
    expect(rowWithZero?.closeness).toBe(0);
    expect(rowWithZero?.fullness).toBe(0);
    expect(rowWithZero?.tameness).toBe(0);
    expect(rowWithZero?.success).toBe(0);
    expect(rowWithZero?.cursed).toBe(0);
    // directTargetCount is only recorded when > 0
    expect(rowWithZero?.directTargetCount).toBeUndefined();

    expect(rowWithTargets?.directTargetCount).toBe(2);
  });

  it('resolves pet targets preserving key identity, distinct same-named pets, and unnamed pets without invented names', () => {
    const dragonPetA = 'item:pet:dragon-black';
    const dragonPetB = 'item:pet:dragon-red';
    const unnamedPetA = 'item:pet:unnamed-1';
    const unnamedPetB = 'item:pet:unnamed-2';

    const rows = projectItemBrowseRows([
      makeBaseRow({
        key: dragonPetA,
        sourceId: '5000020',
        itemClass: 'pet',
        name: { state: 'known', value: 'Baby Dragon' },
      }),
      makeBaseRow({
        key: dragonPetB,
        sourceId: '5000021',
        itemClass: 'pet',
        name: { state: 'known', value: 'Baby Dragon' },
      }),
      makeBaseRow({
        key: unnamedPetA,
        sourceId: '5000098',
        itemClass: 'pet',
        name: { state: 'unknown' },
      }),
      makeBaseRow({
        key: unnamedPetB,
        sourceId: '5000099',
        itemClass: 'pet',
        name: { state: 'absent', coverageKey: 'test' },
      }),
      makeBaseRow({
        key: 'item:food:dragon-food',
        sourceId: '05240020',
        itemClass: 'cash',
        name: { state: 'known', value: 'Dragon Food' },
        petFood: {
          closeness: 100,
          targets: [
            dragonPetA,
            dragonPetB,
            unnamedPetA,
            unnamedPetB,
            dragonPetA, // duplicate key in raw data should be deduped
          ],
          unresolvedTargets: ['5000046'],
        },
      }),
    ]);

    const food = rows.find((r) => r.sourceId === '05240020');
    expect(food).toBeDefined();

    // Two distinct pets sharing the same name stay separate; unnamed pets keep no invented name
    expect(food?.petTargets).toEqual([
      { sourceId: '5000020', name: 'Baby Dragon' },
      { sourceId: '5000021', name: 'Baby Dragon' },
      { sourceId: '5000098' },
      { sourceId: '5000099' },
    ]);

    // Unresolved targets stay separate
    expect(food?.unresolvedPetTargets).toEqual(['5000046']);
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
});
