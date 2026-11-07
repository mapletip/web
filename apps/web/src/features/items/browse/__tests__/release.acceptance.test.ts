import { getItemBrowse } from '@mapletip/data/items';
import { describe, expect, it } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { getCategoryCounts, getCategoryRows } from '../categories';
import { projectItemBrowseRows } from '../project';

const isLiveRelease = process.env['MAPLETIP_LIVE_RELEASE'] === '1';

describe.runIf(isLiveRelease)('Items browse real-release acceptance (d0.mapletip.com)', () => {
  it('asserts CW Launch build population, scopes, children, and witnesses', async () => {
    const raw = await getItemBrowse({
      baseUrl: MAPLEKIT_RELEASE.baseUrl,
      pin: MAPLEKIT_RELEASE.pin,
      buildId: 'cw-launch',
    });

    const rows = projectItemBrowseRows(raw.records);

    // Total roster count
    expect(rows).toHaveLength(1372);

    // Scope totals
    const useRows = rows.filter((r) => r.itemClass === 'consume');
    const etcRows = rows.filter((r) => r.itemClass === 'etc');
    const setupRows = rows.filter((r) => r.itemClass === 'setup');
    const cashRows = rows.filter(
      (r) => r.itemClass === 'cash' || r.itemClass === 'pet',
    );

    expect(useRows).toHaveLength(407);
    expect(etcRows).toHaveLength(386);
    expect(setupRows).toHaveLength(226);
    expect(cashRows).toHaveLength(353);

    // Category counts via registry
    const counts = getCategoryCounts(rows);

    // CW Use children
    expect(counts.use.children['upgrade-scrolls']).toBe(208);
    expect(counts.use.children['recovery']).toBe(51);
    expect(counts.use.children['throwing-stars']).toBe(11);
    expect(counts.use.children['arrows']).toBe(8);
    expect(counts.use.children['bullets']).toBe(0);
    expect(counts.use.children['pet-food']).toBe(2);
    expect(counts.use.children['summoning-items']).toBe(9);
    expect(counts.use.children['reward-containers']).toBe(0);
    expect(counts.use.children['potions']).toBe(24);
    expect(counts.use.children['food-buffs']).toBe(43);
    expect(counts.use.children['monster-cards']).toBe(0);
    expect(counts.use.children['skill-books']).toBe(0);
    expect(counts.use.children['meso-pouches']).toBe(3);
    expect(counts.use.children['other-use-items']).toBe(91);

    // CW ETC children
    expect(counts.etc.children['quest-items']).toBe(170);
    expect(counts.etc.children['crafting']).toBe(75);
    expect(counts.etc.children['ores']).toBe(22);
    expect(counts.etc.children['gems']).toBe(10);
    expect(counts.etc.children['refined-materials']).toBe(8);
    expect(counts.etc.children['monster-materials']).toBe(203);
    expect(counts.etc.children['other-etc-items']).toBe(49);

    // CW Setup children
    expect(counts.setup.children['chairs']).toBe(66);
    expect(counts.setup.children['holiday-ornaments']).toBe(99);
    expect(counts.setup.children['furniture']).toBe(55);
    expect(counts.setup.children['crafting-stations']).toBe(6);
    expect(counts.setup.children['other-setup-items']).toBe(0);

    // CW Cash children
    expect(counts.cash.children['pets']).toBe(35);
    expect(counts.cash.children['cash-items']).toBe(318);

    // Witnesses:
    // CW 02028000-2 are Meso Pouches and not Food & Buffs/Reward Containers
    for (const id of ['02028000', '02028001', '02028002']) {
      const item = rows.find((r) => r.sourceId === id);
      expect(item).toBeDefined();
      expect(item?.types).toContain('meso-pouch');
      expect(item?.types ?? []).not.toContain('food-buff');
      expect(item?.functions ?? []).not.toContain('reward-container');
    }

    // Every positive child of every scope is disjoint from Other
    for (const scopeSlug of ['use', 'etc', 'setup'] as const) {
      const otherSlug = `other-${scopeSlug}-items`;
      const otherRows = getCategoryRows(rows, scopeSlug, otherSlug);
      const otherKeys = new Set(otherRows.map((r) => r.key));

      const childSlugs = Object.keys(counts[scopeSlug].children).filter(
        (slug) => slug !== otherSlug,
      );
      for (const childSlug of childSlugs) {
        const positiveRows = getCategoryRows(rows, scopeSlug, childSlug);
        for (const row of positiveRows) {
          expect(otherKeys.has(row.key)).toBe(false);
        }
      }
    }
  });

  it('asserts GMS v83 build population, scopes, children, and witnesses', async () => {
    const raw = await getItemBrowse({
      baseUrl: MAPLEKIT_RELEASE.baseUrl,
      pin: MAPLEKIT_RELEASE.pin,
      buildId: 'gms-v83',
    });

    const rows = projectItemBrowseRows(raw.records);

    // Total roster count
    expect(rows).toHaveLength(5478);

    // Scope totals
    const useRows = rows.filter((r) => r.itemClass === 'consume');
    const etcRows = rows.filter((r) => r.itemClass === 'etc');
    const setupRows = rows.filter((r) => r.itemClass === 'setup');
    const cashRows = rows.filter(
      (r) => r.itemClass === 'cash' || r.itemClass === 'pet',
    );

    expect(useRows).toHaveLength(2286);
    expect(etcRows).toHaveLength(2360);
    expect(setupRows).toHaveLength(294);
    expect(cashRows).toHaveLength(538);

    // Category counts via registry
    const counts = getCategoryCounts(rows);

    // GMS Use children
    expect(counts.use.children['upgrade-scrolls']).toBe(754);
    expect(counts.use.children['recovery']).toBe(236);
    expect(counts.use.children['throwing-stars']).toBe(17);
    expect(counts.use.children['arrows']).toBe(10);
    expect(counts.use.children['bullets']).toBe(9);
    expect(counts.use.children['pet-food']).toBe(2);
    expect(counts.use.children['summoning-items']).toBe(283);
    expect(counts.use.children['reward-containers']).toBe(56);
    expect(counts.use.children['potions']).toBe(55);
    expect(counts.use.children['food-buffs']).toBe(436);
    expect(counts.use.children['monster-cards']).toBe(343);
    expect(counts.use.children['skill-books']).toBe(165);
    expect(counts.use.children['meso-pouches']).toBe(0);
    expect(counts.use.children['other-use-items']).toBe(126);

    // GMS ETC children
    expect(counts.etc.children['quest-items']).toBe(1318);
    expect(counts.etc.children['crafting']).toBe(107);
    expect(counts.etc.children['ores']).toBe(25);
    expect(counts.etc.children['gems']).toBe(56);
    expect(counts.etc.children['refined-materials']).toBe(9);
    expect(counts.etc.children['monster-materials']).toBe(812);
    expect(counts.etc.children['other-etc-items']).toBe(618);

    // GMS Setup children
    expect(counts.setup.children['chairs']).toBe(63);
    expect(counts.setup.children['holiday-ornaments']).toBe(231);
    expect(counts.setup.children['furniture']).toBe(0);
    expect(counts.setup.children['crafting-stations']).toBe(0);
    expect(counts.setup.children['other-setup-items']).toBe(0);

    // GMS Cash children
    expect(counts.cash.children['pets']).toBe(54);
    expect(counts.cash.children['cash-items']).toBe(484);

    // Witnesses:
    // Pet 05240018 Sprout in GMS keeps unresolved target 5000046 and is absent from Use Pet Food
    const sprout = rows.find((r) => r.sourceId === '05240018');
    expect(sprout).toBeDefined();
    expect(sprout?.unresolvedPetTargets).toContain('5000046');
    const usePetFoodRows = getCategoryRows(rows, 'use', 'pet-food');
    expect(usePetFoodRows.some((r) => r.sourceId === '05240018')).toBe(false);

    // Elixir-style percent-only rows have no flat hp/mp
    const elixir = rows.find((r) => r.sourceId === '02000004');
    expect(elixir).toBeDefined();
    expect(elixir?.hpPercent).toBeDefined();
    expect(elixir?.hp).toBeUndefined();
    expect(elixir?.mp).toBeUndefined();

    // Pink Seal Cushion 03010007 is a Chair
    const cushion = rows.find((r) => r.sourceId === '03010007');
    expect(cushion).toBeDefined();
    expect(cushion?.types).toContain('chair');
    const chairRows = getCategoryRows(rows, 'setup', 'chairs');
    expect(chairRows.some((r) => r.sourceId === '03010007')).toBe(true);

    // Every positive child of every scope is disjoint from Other
    for (const scopeSlug of ['use', 'etc', 'setup'] as const) {
      const otherSlug = `other-${scopeSlug}-items`;
      const otherRows = getCategoryRows(rows, scopeSlug, otherSlug);
      const otherKeys = new Set(otherRows.map((r) => r.key));

      const childSlugs = Object.keys(counts[scopeSlug].children).filter(
        (slug) => slug !== otherSlug,
      );
      for (const childSlug of childSlugs) {
        const positiveRows = getCategoryRows(rows, scopeSlug, childSlug);
        for (const row of positiveRows) {
          expect(otherKeys.has(row.key)).toBe(false);
        }
      }
    }
  });
});
