import { itemIconUrl } from '@mapletip/data/items';
import type { MonsterPageRecordV1 } from '@mapletip/data/monsters';
import { describe, expect, it } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { UNNAMED_MONSTER_LABEL } from '../../shared';
import { projectMonsterDetail } from '../project';

import { monsterPageFixture } from './monsterPageFixture';

type MonsterPageDrop = MonsterPageRecordV1['drops']['entries'][number];
type MonsterPageLocation = MonsterPageRecordV1['locations']['entries'][number];
type MonsterPageQuest = MonsterPageRecordV1['quests']['entries'][number];

function pageDrop(
  name: MonsterPageDrop['name'],
  category: MonsterPageDrop['category'],
  overrides: Partial<MonsterPageDrop> = {},
): MonsterPageDrop {
  return {
    itemRef: { state: 'resolved', key: 'fixture:item:record' },
    name,
    category,
    icon: { state: 'unknown' },
    assertion: { kind: 'native' },
    ...overrides,
  };
}

function pageLocation(
  mapKey: string,
  name: MonsterPageLocation['name'],
  placementCount: number,
  overrides: Partial<MonsterPageLocation> = {},
): MonsterPageLocation {
  return {
    mapKey,
    name,
    placementCount,
    minimap: { state: 'absent', coverageKey: 'fixture:minimap' },
    ...overrides,
  };
}

function pageQuest(
  overrides: Partial<MonsterPageQuest> = {},
): MonsterPageQuest {
  return {
    questKey: 'fixture:quest:001',
    name: { state: 'known', value: 'Practice Hunt' },
    minLevel: { state: 'known', value: 10 },
    jobCodes: { state: 'known', items: [100] },
    repeatable: { state: 'known', value: false },
    killCount: { state: 'known', value: 30 },
    ...overrides,
  };
}

describe('projectMonsterDetail', () => {
  it('projects identity fields and unprefixed canonical path for default build', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        publicId: '36z2h01p',
        slug: 'sentinel-snail',
        name: { state: 'known', value: 'Sentinel Snail' },
      }),
      'cw-launch',
    );

    expect(view).toMatchObject({
      publicId: '36z2h01p',
      slug: 'sentinel-snail',
      name: 'Sentinel Snail',
      buildId: 'cw-launch',
      canonicalPath: '/maplestory/monsters/sentinel-snail-36z2h01p',
      spriteUrl: `https://d0.mapletip.com/media/images/aa/${'a'.repeat(64)}.png`,
      spriteWidth: 32,
      spriteHeight: 48,
    });
    expect(view.stats.map(({ label }) => label)).toEqual([
      'Level',
      'HP',
      'MP',
      'EXP',
      'Weapon attack',
      'Magic attack',
      'Weapon defense',
      'Magic defense',
      'Accuracy',
      'Avoidability',
      'Knockback',
      'Speed',
    ]);
  });

  it('projects prefixed canonical path for alternate builds', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        publicId: 'jp565851',
        slug: 'pianus',
        name: { state: 'known', value: 'Pianus' },
        scope: { build_id: 'gms-v83', family_id: 'gms' },
      }),
      'gms-v83',
    );

    expect(view.buildId).toBe('gms-v83');
    expect(view.canonicalPath).toBe(
      '/maplestory/gms-v83/monsters/pianus-jp565851',
    );
  });

  it('falls back to UNNAMED_MONSTER_LABEL when name is non-known', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        name: { state: 'absent', coverageKey: 'monster:name' },
      }),
      'cw-launch',
    );

    expect(view.name).toBe(UNNAMED_MONSTER_LABEL);
  });

  it('projects known, non-known, negative, and large stat values in order', () => {
    const fixture = monsterPageFixture();
    const view = projectMonsterDetail(
      monsterPageFixture({
        stats: {
          ...fixture.stats,
          level: { state: 'known', value: 5 },
          hp: { state: 'known', value: 23_000_000 },
          mp: { state: 'unknown' },
          exp: { state: 'absent', coverageKey: 'fixture:exp' },
          paDamage: { state: 'unsupported' },
          maDamage: { state: 'known', value: -65 },
          pdDamage: { state: 'known', value: 2_147_483_647 },
        },
      }),
      'cw-launch',
    );

    expect(view.stats.map(({ value }) => value)).toEqual([
      '5',
      '23,000,000',
      'Unknown',
      '-',
      'Unavailable',
      '-65',
      '2,147,483,647',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
    ]);
    expect(view.stats.map(({ known }) => known)).toEqual([
      true,
      true,
      false,
      false,
      false,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('projects only known element responses and known true traits', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        boss: { state: 'known', value: true },
        undead: { state: 'unknown' },
        elements: {
          state: 'partial',
          items: [
            {
              code: 'S',
              effect: 2,
              meaning: { state: 'known', value: 'Poison' },
              multiplier: { state: 'known', value: 0 },
              resistance: { state: 'known', value: 'Immune' },
            },
            {
              code: 'H',
              effect: 1,
              meaning: { state: 'known', value: 'Holy' },
              multiplier: { state: 'known', value: 1.5 },
              resistance: { state: 'known', value: 'Weak' },
            },
            {
              code: 'F',
              effect: 0,
              meaning: { state: 'known', value: 'Fire' },
              multiplier: { state: 'unknown' },
              resistance: { state: 'unknown' },
            },
          ],
        },
      }),
      'cw-launch',
    );

    expect(view.boss).toBe(true);
    expect(view.undead).toBeUndefined();
    expect(view.elements).toEqual([
      { code: 'S', element: 'Poison', response: 'Immune' },
      { code: 'H', element: 'Holy', response: 'Weak' },
    ]);
  });

  it('groups every drop in contract order and counts rendered entries', () => {
    const entries = [
      pageDrop(
        { state: 'known', value: 'Second Charm' },
        { kind: 'item-class', value: 'etc' },
      ),
      pageDrop(
        { state: 'known', value: 'Practice Cap' },
        { kind: 'equip-slot', code: 'cap' },
      ),
      pageDrop(
        { state: 'known', value: 'Practice Tonic' },
        { kind: 'item-class', value: 'consume' },
      ),
      pageDrop(
        { state: 'known', value: 'First Charm' },
        { kind: 'item-class', value: 'etc' },
      ),
      pageDrop(
        { state: 'known', value: 'Paper Kite' },
        { kind: 'item-class', value: 'setup' },
      ),
      pageDrop(
        { state: 'known', value: 'Pixel Pin' },
        { kind: 'item-class', value: 'cash' },
      ),
      pageDrop(
        { state: 'known', value: 'Toy Mite' },
        { kind: 'item-class', value: 'pet' },
      ),
      pageDrop(
        { state: 'known', value: 'Unknown Type Token' },
        { kind: 'unknown' },
      ),
    ];
    const view = projectMonsterDetail(
      monsterPageFixture({
        drops: { entries, summary: { native: { state: 'unknown' } } },
      }),
      'cw-launch',
    );

    expect(view.drops).toMatchObject({
      state: 'present',
      count: 8,
      groups: [
        { id: 'equipment', label: 'Equipment', count: 1 },
        { id: 'usable', label: 'Usable', count: 1 },
        { id: 'etc', label: 'Etc', count: 2 },
        { id: 'setup', label: 'Setup', count: 1 },
        { id: 'cash', label: 'Cash', count: 1 },
        { id: 'pets', label: 'Pets', count: 1 },
        { id: 'unknown', label: 'Unknown type', count: 1 },
      ],
    });
    if (view.drops.state !== 'present') {
      throw new Error('Expected projected drops.');
    }
    expect(view.drops.groups[2]?.entries.map(({ name }) => name)).toEqual([
      'Second Charm',
      'First Charm',
    ]);
    expect(view.drops.groups[6]?.entries[0]?.name).toBe('Unknown Type Token');
  });

  it('retains unresolved item rows, honest fallback names, icons and source builds', () => {
    const iconId = 'b'.repeat(64);
    const view = projectMonsterDetail(
      monsterPageFixture({
        drops: {
          entries: [
            pageDrop(
              { state: 'unknown' },
              { kind: 'unknown' },
              {
                itemRef: { state: 'unresolved' },
                icon: { state: 'known', value: iconId },
                assertion: {
                  kind: 'historical-overlay',
                  confidence: 'maybe',
                  sourceBuild: 'gms-v83',
                },
              },
            ),
          ],
          summary: { native: { state: 'unsupported' } },
        },
      }),
      'cw-launch',
    );

    expect(view.drops).toMatchObject({
      state: 'present',
      count: 1,
      groups: [
        {
          id: 'unknown',
          entries: [
            {
              name: 'Item name unavailable',
              iconUrl: itemIconUrl(MAPLEKIT_RELEASE.baseUrl, iconId),
              assertionKind: 'historical-overlay',
              sourceBuild: 'gms-v83',
            },
          ],
        },
      ],
    });
  });

  it('distinguishes no recorded drops from unavailable collection evidence', () => {
    const absent = projectMonsterDetail(
      monsterPageFixture({
        drops: {
          entries: [],
          summary: {
            native: { state: 'absent' },
            historical: { state: 'absent' },
          },
        },
      }),
      'cw-launch',
    );
    const noObservedRows = projectMonsterDetail(
      monsterPageFixture({
        drops: {
          entries: [],
          summary: {
            native: { state: 'known', count: 0, lowerBound: true },
            historical: { state: 'absent' },
          },
        },
      }),
      'cw-launch',
    );
    const unknown = projectMonsterDetail(monsterPageFixture(), 'cw-launch');
    const unsupported = projectMonsterDetail(
      monsterPageFixture({
        drops: {
          entries: [],
          summary: { native: { state: 'unsupported' } },
        },
      }),
      'cw-launch',
    );

    expect(absent.drops).toEqual({ state: 'no-recorded', count: 0 });
    expect(noObservedRows.drops).toEqual({ state: 'no-recorded', count: 0 });
    expect(unknown.drops).toEqual({
      state: 'unavailable',
      count: 'unknown',
    });
    expect(unsupported.drops).toEqual({
      state: 'unavailable',
      count: 'unknown',
    });
  });

  it('orders locations by placement count then name, preserves duplicate map keys, and projects geography and minimaps', () => {
    const minimapId = 'c'.repeat(64);
    const view = projectMonsterDetail(
      monsterPageFixture({
        locations: {
          summary: { state: 'known', mapCount: 4, placementCount: 40 },
          entries: [
            pageLocation('fixture:map:unnamed', { state: 'unknown' }, 10, {
              streetName: 'Harbor Road',
              geography: {
                regionKey: 'fixture:south',
                regionLabel: 'South Practice Region',
                provenance: 'reviewed-overlay',
                status: 'verified',
              },
            }),
            pageLocation(
              'fixture:map:duplicate-b',
              { state: 'known', value: 'Twin Glade' },
              5,
              {
                geography: {
                  regionKey: 'fixture:south',
                  regionLabel: 'South Practice Region',
                  provenance: 'reviewed-overlay',
                  status: 'verified',
                },
              },
            ),
            pageLocation(
              'fixture:map:top',
              { state: 'known', value: 'High Meadow' },
              20,
              {
                streetName: 'West Path',
                geography: {
                  regionKey: 'fixture:north',
                  regionLabel: 'North Practice Region',
                  provenance: 'reviewed-overlay',
                  status: 'verified',
                },
                minimap: { state: 'known', value: minimapId },
              },
            ),
            pageLocation(
              'fixture:map:duplicate-a',
              { state: 'known', value: 'Twin Glade' },
              5,
              {
                geography: {
                  regionKey: 'fixture:south',
                  regionLabel: 'South Practice Region',
                  provenance: 'reviewed-overlay',
                  status: 'verified',
                },
              },
            ),
          ],
        },
      }),
      'cw-launch',
    );

    expect(view.locations).toEqual({
      state: 'present',
      count: 4,
      maps: [
        {
          key: 'fixture:map:top',
          name: 'High Meadow',
          geographyLine: 'West Path · North Practice Region',
          minimapUrl: `https://d0.mapletip.com/media/images/cc/${minimapId}.png`,
          placementCount: 20,
          placementLabel: '20 spawns',
        },
        {
          key: 'fixture:map:unnamed',
          name: 'Map name unavailable',
          geographyLine: 'Harbor Road · South Practice Region',
          placementCount: 10,
          placementLabel: '10 spawns',
        },
        {
          key: 'fixture:map:duplicate-a',
          name: 'Twin Glade',
          geographyLine: 'South Practice Region',
          placementCount: 5,
          placementLabel: '5 spawns',
        },
        {
          key: 'fixture:map:duplicate-b',
          name: 'Twin Glade',
          geographyLine: 'South Practice Region',
          placementCount: 5,
          placementLabel: '5 spawns',
        },
      ],
    });
  });

  it('omits region labels when maps are all in one region and uses singular spawn wording', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        locations: {
          summary: { state: 'known', mapCount: 1, placementCount: 1 },
          entries: [
            pageLocation(
              'fixture:map:quiet',
              { state: 'known', value: 'Quiet Clearing' },
              1,
              {
                streetName: 'Forest Edge',
                geography: {
                  regionKey: 'fixture:forest',
                  regionLabel: 'Practice Forest',
                  provenance: 'source-region-allowlist',
                },
              },
            ),
          ],
        },
      }),
      'cw-launch',
    );

    expect(view.locations).toMatchObject({
      state: 'present',
      count: 1,
      maps: [
        {
          name: 'Quiet Clearing',
          geographyLine: 'Forest Edge',
          placementCount: 1,
          placementLabel: '1 spawn',
        },
      ],
    });
  });

  it('projects absent and unresolved location collection states separately', () => {
    const absent = projectMonsterDetail(
      monsterPageFixture({
        locations: { summary: { state: 'absent' }, entries: [] },
      }),
      'cw-launch',
    );
    const unresolved = projectMonsterDetail(
      monsterPageFixture({
        locations: {
          summary: { state: 'unresolved', mapCount: 2, placementCount: 7 },
          entries: [],
        },
      }),
      'cw-launch',
    );

    expect(absent.locations).toEqual({ state: 'no-locations', count: 0 });
    expect(unresolved.locations).toEqual({
      state: 'unavailable',
      count: 'unknown',
    });
  });

  it('projects known quest facts and subtracts this monster from a shared group', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        quests: {
          state: 'known',
          entries: [
            pageQuest({
              jobCodes: { state: 'known', items: [100, 110] },
              countGroupSize: { state: 'known', value: 3 },
              repeatable: { state: 'known', value: true },
            }),
          ],
        },
      }),
      'cw-launch',
    );

    expect(view.quests).toEqual({
      state: 'present',
      count: 1,
      entries: [
        {
          key: 'fixture:quest:001',
          name: 'Practice Hunt',
          minimumLevelBadge: 'Lv. 10+',
          jobSummary: 'Warrior +1',
          defeatLabel: 'Defeat ×30',
          repeatable: true,
          sharedCountNote: 'Shared with 2 other monsters',
        },
      ],
    });
  });

  it('formats complete and incomplete job summaries without inventing eligibility', () => {
    const complete = projectMonsterDetail(
      monsterPageFixture({
        quests: {
          state: 'known',
          entries: [
            pageQuest({
              jobCodes: { state: 'absent', coverageKey: 'all-jobs' },
            }),
          ],
        },
      }),
      'cw-launch',
    );
    const partial = projectMonsterDetail(
      monsterPageFixture({
        quests: {
          state: 'known',
          entries: [
            pageQuest({ jobCodes: { state: 'partial', items: [100] } }),
          ],
        },
      }),
      'cw-launch',
    );

    expect(complete.quests).toMatchObject({
      state: 'present',
      entries: [{ jobSummary: 'Any job' }],
    });
    expect(partial.quests).toMatchObject({
      state: 'present',
      entries: [{ jobSummary: 'Warrior +?' }],
    });
  });

  it('keeps quest absence and unresolved information distinct and does not invent facts', () => {
    const absent = projectMonsterDetail(
      monsterPageFixture({
        quests: { state: 'absent', entries: [] },
      }),
      'cw-launch',
    );
    const unresolved = projectMonsterDetail(
      monsterPageFixture({ quests: { state: 'unknown', entries: [] } }),
      'cw-launch',
    );
    const unknownCount = projectMonsterDetail(
      monsterPageFixture({
        quests: {
          state: 'known',
          entries: [
            pageQuest({
              name: { state: 'unknown' },
              minLevel: { state: 'absent', coverageKey: 'fixture:min-level' },
              jobCodes: { state: 'unknown' },
              repeatable: { state: 'unknown' },
              killCount: { state: 'unknown' },
            }),
          ],
        },
      }),
      'cw-launch',
    );

    expect(absent.quests).toEqual({ state: 'no-quests', count: 0 });
    expect(unresolved.quests).toEqual({
      state: 'unavailable',
      count: 'unknown',
    });
    expect(unknownCount.quests).toMatchObject({
      state: 'present',
      entries: [
        {
          name: 'Quest name unavailable',
          defeatLabel: 'Defeat',
          repeatable: false,
        },
      ],
    });
    if (unknownCount.quests.state !== 'present') {
      throw new Error('Expected the known quest entry to be projected.');
    }
    expect(unknownCount.quests.entries[0]?.sharedCountNote).toBeUndefined();
  });

  it('projects summoned items with placeholder values and omits an empty list', () => {
    const absent = projectMonsterDetail(
      monsterPageFixture({ summonedByItems: [] }),
      'cw-launch',
    );
    const present = projectMonsterDetail(
      monsterPageFixture({
        summonedByItems: [
          {
            itemRef: { state: 'resolved', key: 'fixture:item:seed' },
            name: { state: 'known', value: 'Practice Seed' },
            icon: { state: 'known', value: 'b'.repeat(64) },
          },
          {
            itemRef: { state: 'unresolved' },
            name: { state: 'unknown' },
            icon: { state: 'unknown' },
          },
        ],
      }),
      'cw-launch',
    );

    expect(absent.summonedBy).toEqual({ state: 'absent', count: 0 });
    expect(present.summonedBy).toEqual({
      state: 'present',
      count: 2,
      entries: [
        {
          key: 'fixture:item:seed',
          name: 'Practice Seed',
          iconUrl: `https://d0.mapletip.com/media/images/bb/${'b'.repeat(64)}.png`,
        },
        { key: 'summoned-item-1', name: 'Item name unavailable' },
      ],
    });
  });
});
