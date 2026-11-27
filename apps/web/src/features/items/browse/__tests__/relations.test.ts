import { getItemRelatedEntities } from '@mapletip/data/items';
import { openRelease } from '@mapletip/data/release';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import type { CategorizedItemRow } from '../project';
import {
  createItemRelationReader,
  ITEM_DRAWER_MONSTER_LIMIT,
  ITEM_DRAWER_QUEST_LIMIT,
  ITEM_DRAWER_RECIPE_LIMIT,
  projectItemDrawerRelations,
  requiredRelationKindsForItem,
  type ItemDrawerPack,
} from '../relations';

vi.mock(import('@mapletip/data/items'), async (original) => ({
  ...(await original()),
  getItemRelatedEntities: vi.fn(),
}));

vi.mock(import('@mapletip/data/release'), async (original) => ({
  ...(await original()),
  openRelease: vi.fn(),
}));

const readRelatedSdk = vi.mocked(getItemRelatedEntities);
const openReleaseSdk = vi.mocked(openRelease);

const scope = { family_id: 'classic-world', build_id: 'cw-launch' };

function row(overrides: Partial<CategorizedItemRow> = {}): CategorizedItemRow {
  return {
    key: 'item:fixture:1',
    sourceId: 'fixture-item',
    itemClass: 'etc',
    name: 'Practice Shard',
    kind: 'monster-drops',
    kindPath: ['all', 'etc', 'monster-drops'],
    ...overrides,
  };
}

const questPack: ItemDrawerPack<'needed-for-quest'> = {
  contractVersion: '2.0',
  format: 'item-related-entity-browse/1',
  relationshipKind: 'needed-for-quest',
  scope,
  targets: [
    {
      key: 'quest:1',
      publicId: 'q0000001',
      displayName: 'Lantern Gathering',
      startLevel: { state: 'known', value: 15 },
      startNpc: {
        state: 'known',
        value: {
          name: { state: 'known', value: 'Bellkeeper' },
          sprite: { state: 'unknown' },
        },
      },
      recurrence: {
        state: 'known',
        items: [{ kind: 'day-by-day' }],
      },
    },
    {
      key: 'quest:2',
      publicId: 'q0000002',
      displayName: 'Quiet Errand',
      startLevel: { state: 'unknown' },
      startNpc: { state: 'unknown' },
      recurrence: { state: 'unknown' },
    },
    {
      key: 'quest:3',
      publicId: 'q0000003',
      displayName: 'Excluded Role Quest',
      startLevel: { state: 'known', value: 20 },
      startNpc: { state: 'unknown' },
      recurrence: { state: 'unknown' },
    },
    {
      key: 'quest:4',
      publicId: 'q0000004',
      displayName: null,
      startLevel: { state: 'known', value: 10 },
      startNpc: { state: 'unknown' },
      recurrence: { state: 'unknown' },
    },
  ],
  records: {
    'item:fixture:1': [
      {
        target: 0,
        roles: [
          { role: 'turned-in', amount: 30 },
          { role: 'held-to-complete', amount: 30 },
        ],
      },
      {
        target: 1,
        roles: [{ role: 'held-to-start', amount: null }],
      },
      {
        target: 2,
        roles: [
          { role: 'must-not-be-held' },
          { role: 'pet' },
          { role: 'monster-card' },
          { role: 'not-established' },
        ],
      },
      {
        target: 3,
        roles: [{ role: 'turned-in', amount: 5 }],
      },
    ],
  },
};

const rewardPack: ItemDrawerPack<'quest-reward'> = {
  contractVersion: '2.0',
  format: 'item-related-entity-browse/1',
  relationshipKind: 'quest-reward',
  scope,
  targets: [
    {
      key: 'quest:reward-1',
      publicId: 'q0000010',
      displayName: 'Festival Prize',
      startLevel: { state: 'known', value: 12 },
      startNpc: { state: 'unknown' },
      recurrence: { state: 'known', items: [{ kind: 'weekly-repeat' }] },
    },
  ],
  records: {
    'item:fixture:1': [0],
  },
};

const recipePack: ItemDrawerPack<'used-in-recipe'> = {
  contractVersion: '2.0',
  format: 'item-related-entity-browse/1',
  relationshipKind: 'used-in-recipe',
  scope,
  targets: [
    {
      key: 'recipe:1',
      fee: { state: 'known', value: 0 },
      products: [
        {
          key: 'item:product:1',
          kind: 'item',
          name: { state: 'known', value: 'Paper Kite' },
          outcome: 'guaranteed',
        },
      ],
    },
    {
      key: 'recipe:2',
      fee: { state: 'unknown' },
      products: [
        {
          name: { state: 'known', value: 'Mystery Craft' },
          outcome: 'guaranteed',
        },
      ],
    },
    {
      key: 'recipe:3',
      fee: { state: 'unknown' },
      products: [{ name: { state: 'unknown' }, outcome: 'guaranteed' }],
    },
  ],
  records: {
    'item:fixture:1': [
      { target: 0, amount: 5 },
      { target: 1, amount: null },
      { target: 2, amount: 2 },
    ],
  },
};

const monsterPack: ItemDrawerPack<'monster-drop'> = {
  contractVersion: '2.0',
  format: 'item-related-entity-browse/1',
  relationshipKind: 'monster-drop',
  scope,
  evidence: {
    evidenceKinds: [
      { key: 'historical-overlay', label: 'Historical files' },
      { key: 'vod', label: 'VOD' },
    ],
    evidenceSources: [
      { kind: 'historical-overlay', build: 'gms-v83' },
      {
        kind: 'vod',
        build: 'cw-launch',
        date: '2026-02-01',
        url: 'https://video.example/watch?v=fixture',
      },
    ],
  },
  targets: [
    {
      key: 'monster:1',
      publicId: 'm0000001',
      displayName: 'Crowned Warden',
      level: { state: 'known', value: 17 },
      sprite: { state: 'known', value: 'a'.repeat(64) },
    },
    {
      key: 'monster:2',
      publicId: 'm0000002',
      displayName: 'Quiet Sprite',
      level: { state: 'unknown' },
      sprite: { state: 'unknown' },
    },
  ],
  records: {
    'item:fixture:1': [
      {
        target: 0,
        evidence: [{ source: 0 }, { source: 1, startSeconds: 95 }],
      },
      {
        target: 1,
        evidence: [{ source: 0 }],
      },
    ],
  },
};

describe('createItemRelationReader', () => {
  beforeEach(() => {
    readRelatedSdk.mockReset();
    openReleaseSdk.mockReset();
  });

  it('caches in-flight and resolved promises per kind and isolates builds', async () => {
    let resolveFirst!: (value: ItemDrawerPack<'needed-for-quest'>) => void;
    const pending = new Promise<ItemDrawerPack<'needed-for-quest'>>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );
    readRelatedSdk
      .mockReturnValueOnce(pending)
      .mockResolvedValueOnce(recipePack)
      .mockResolvedValueOnce(questPack);

    const classicWorld = createItemRelationReader('cw-launch');
    const gms = createItemRelationReader('gms-v83');

    const first = classicWorld.readRelation('needed-for-quest');
    expect(classicWorld.readRelation('needed-for-quest')).toBe(first);

    const recipes = classicWorld.readRelation('used-in-recipe');
    await expect(recipes).resolves.toBe(recipePack);

    const gmsQuests = gms.readRelation('needed-for-quest');
    await expect(gmsQuests).resolves.toBe(questPack);

    resolveFirst(questPack);
    await expect(first).resolves.toBe(questPack);
    expect(classicWorld.readRelation('needed-for-quest')).toBe(first);
    expect(readRelatedSdk.mock.calls).toEqual([
      [{ ...MAPLEKIT_RELEASE, buildId: 'cw-launch', kind: 'needed-for-quest' }],
      [{ ...MAPLEKIT_RELEASE, buildId: 'cw-launch', kind: 'used-in-recipe' }],
      [{ ...MAPLEKIT_RELEASE, buildId: 'gms-v83', kind: 'needed-for-quest' }],
    ]);
  });

  it('forgets failed relation and description reads automatically and supports explicit forget', async () => {
    readRelatedSdk
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(questPack);

    const loadDescriptions = vi
      .fn<() => Promise<Readonly<Record<string, string>>>>()
      .mockRejectedValueOnce(new Error('missing'))
      .mockResolvedValue({ 'item:fixture:1': 'A practice description.' });
    openReleaseSdk.mockResolvedValue({
      openItemBuild: vi.fn().mockResolvedValue({ loadDescriptions }),
    } as never);

    const reader = createItemRelationReader('cw-launch');
    await expect(reader.readRelation('needed-for-quest')).rejects.toThrow(
      'network',
    );
    const recovered = reader.readRelation('needed-for-quest');
    await expect(recovered).resolves.toBe(questPack);
    reader.forgetRelation('needed-for-quest', recovered);
    expect(reader.readRelation('needed-for-quest')).not.toBe(recovered);
    expect(readRelatedSdk).toHaveBeenCalledTimes(3);

    await expect(reader.readDescriptions()).rejects.toThrow('missing');
    const descriptions = reader.readDescriptions();
    await expect(descriptions).resolves.toEqual({
      'item:fixture:1': 'A practice description.',
    });
    expect(reader.readDescriptions()).toBe(descriptions);
    reader.forgetDescriptions(descriptions);
    expect(reader.readDescriptions()).not.toBe(descriptions);
  });
});

describe('projectItemDrawerRelations', () => {
  it('exports the specified section limits', () => {
    expect(ITEM_DRAWER_QUEST_LIMIT).toBe(5);
    expect(ITEM_DRAWER_RECIPE_LIMIT).toBe(5);
    expect(ITEM_DRAWER_MONSTER_LIMIT).toBe(6);
  });

  it('selects only the relationship kinds present on the item row', () => {
    expect(requiredRelationKindsForItem({ record: row() })).toEqual([]);
    expect(
      requiredRelationKindsForItem({
        record: row({
          neededForQuestCount: 2,
          usedInRecipeCount: 1,
          monsterDropCount: 3,
        }),
      }),
    ).toEqual(['needed-for-quest', 'used-in-recipe', 'monster-drop']);
  });

  it('projects quests, recipes, monsters, and drop sources while leaving unknown values out', () => {
    const projected = projectItemDrawerRelations({
      record: row(),
      descriptions: { 'item:fixture:1': '  A synthetic shard.  ' },
      neededForQuest: questPack,
      questReward: rewardPack,
      usedInRecipe: recipePack,
      monsterDrop: monsterPack,
    });

    expect(projected.description).toBe('A synthetic shard.');
    expect(projected.requiredQuests).toEqual([
      {
        key: 'quest:1',
        name: 'Lantern Gathering',
        amountText: '30 needed',
        levelText: 'Level 15',
        startNpc: 'Bellkeeper',
        recurrenceText: 'Daily',
      },
      {
        key: 'quest:2',
        name: 'Quiet Errand',
      },
    ]);
    expect(projected.rewardQuests).toEqual([
      {
        key: 'quest:reward-1',
        name: 'Festival Prize',
        levelText: 'Level 12',
        recurrenceText: 'Weekly',
      },
    ]);
    expect(projected.recipes).toEqual([
      { key: 'recipe:1', productName: 'Paper Kite', amountText: '5 needed' },
      { key: 'recipe:2', productName: 'Mystery Craft' },
    ]);
    expect(projected.monsters).toEqual([
      {
        key: 'monster:1',
        name: 'Crowned Warden',
        levelText: 'Level 17',
        spriteUrl: expect.stringContaining('a'.repeat(64)) as unknown,
        sources: [
          {
            observed: true,
            label: 'VOD',
            buildLabel: 'Classic World',
            date: '2026-02-01',
            href: 'https://video.example/watch?v=fixture&t=95s',
            startSeconds: 95,
          },
        ],
      },
      {
        key: 'monster:2',
        name: 'Quiet Sprite',
        sources: [
          {
            observed: false,
            label: 'GMS v83 Monster Book',
            buildLabel: 'GMS v83',
          },
        ],
      },
    ]);
  });

  it('does not list a turned-in quest among reward quests when the item is only taken', () => {
    const projected = projectItemDrawerRelations({
      record: row(),
      neededForQuest: questPack,
      questReward: { ...rewardPack, records: {} },
    });

    expect(projected.requiredQuests.map((q) => q.name)).toEqual([
      'Lantern Gathering',
      'Quiet Errand',
    ]);
    expect(projected.rewardQuests).toEqual([]);
  });
});
