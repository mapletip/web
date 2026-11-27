import { describe, expect, it } from 'vitest';

import { mergeIdenticalItems } from '../identical-items';
import { versionDetails } from '../ItemDrawerBody';
import type { CategorizedItemRow } from '../project';

const base: CategorizedItemRow = {
  key: 'first',
  sourceId: 'first',
  itemClass: 'consume',
  name: 'Silverleaf Draught',
  icon: 'shared',
  kind: 'potions-and-food',
  kindPath: ['all', 'use', 'potions-and-food'],
  mp: 120,
  sellPrice: 20,
};

describe('identical item cards', () => {
  it('merges rows that differ only in item id and links, keeping every version', () => {
    const merged = mergeIdenticalItems({
      rows: [
        { ...base, questRewardCount: 3 },
        { ...base, key: 'second', sourceId: 'second' },
      ],
    });
    expect(merged).toHaveLength(1);
    expect(merged[0]?.versions?.map((row) => row.sourceId)).toEqual([
      'first',
      'second',
    ]);
    // The merged card matches a quest reward filter because one version is a reward.
    expect(merged[0]?.questRewardCount).toBe(3);
  });

  it('keeps rows a player can tell apart as separate cards', () => {
    for (const difference of [
      { mp: 150 },
      { icon: 'other' },
      { sellPrice: 25 },
      { maxStack: 200 },
      { name: 'Silverleaf Tonic' },
    ]) {
      expect(
        mergeIdenticalItems({
          rows: [
            base,
            { ...base, key: 'second', sourceId: 'second', ...difference },
          ],
        }),
      ).toHaveLength(2);
    }
  });

  it('describes what tells versions apart in player words', () => {
    const reward = { ...base, questRewardCount: 1 };
    const plain = { ...base, key: 'second', sourceId: 'second' };
    expect(versionDetails({ record: reward, versions: [reward, plain] })).toBe(
      'Quest reward',
    );
    expect(versionDetails({ record: plain, versions: [reward, plain] })).toBe(
      'No known quest reward',
    );
    expect(versionDetails({ record: base, versions: [base, plain] })).toBe(
      'Same in-game stats',
    );
  });
});
