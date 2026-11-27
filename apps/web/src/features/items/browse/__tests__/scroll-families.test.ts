import { describe, expect, it } from 'vitest';

import type { CategorizedItemRow } from '../project';
import { groupScrollFamilies, scrollChanges } from '../scroll-families';

function row({
  id,
  targetLabel = 'hat',
  tier,
  stats = { speed: 2 },
}: {
  readonly id: string;
  readonly targetLabel?: CategorizedItemRow['targetLabel'] | null;
  readonly tier?: CategorizedItemRow['tier'];
  readonly stats?: CategorizedItemRow['stats'];
}): CategorizedItemRow {
  return {
    key: id,
    sourceId: id,
    itemClass: 'consume',
    name: `${id} Scroll`,
    ...(targetLabel ? { targetLabel } : {}),
    ...(tier ? { tier } : {}),
    ...(stats ? { stats } : {}),
    kind: 'scrolls',
    kindPath: ['all', 'use', 'scrolls'],
  };
}

function coverage(scrollTier: 'complete' | 'unsupported') {
  return { scrollTier, relationships: {} } as Parameters<
    typeof groupScrollFamilies
  >[0]['coverage'];
}

describe('groupScrollFamilies', () => {
  it('orders distinct tiers within one equipment and leading stat family', () => {
    const rows = [
      row({ id: 'great', tier: 'greater' }),
      row({ id: 'chaos', tier: 'chaos' }),
      row({ id: 'less', tier: 'lesser' }),
      row({ id: 'middle', tier: 'intermediate' }),
    ];
    const [family] = groupScrollFamilies({
      rows,
      coverage: coverage('complete'),
    });
    expect(family?.scrollMembers?.map((member) => member.sourceId)).toEqual([
      'less',
      'middle',
      'great',
      'chaos',
    ]);
    expect(family?.names).toHaveLength(4);
    expect(family?.name).toBe('Hat');
  });

  it('uses the largest change to separate stats and lists both changes', () => {
    const rows = [
      row({
        id: 'defense',
        tier: 'lesser',
        stats: { weaponDefense: 2, magicDefense: 3 },
      }),
      row({ id: 'speed', tier: 'lesser' }),
    ];
    const families = groupScrollFamilies({
      rows,
      coverage: coverage('complete'),
    });
    expect(families.map((family) => family.scrollLead)).toEqual([
      'Magic defense',
      'Speed',
    ]);
    expect(scrollChanges({ stats: rows[0]?.stats })).toEqual([
      '+3 magic defense',
      '+2 weapon defense',
    ]);
  });

  it('keeps unresolved equipment after known equipment', () => {
    const unresolved = row({ id: 'unknown', targetLabel: null });
    const families = groupScrollFamilies({
      rows: [unresolved, row({ id: 'known', tier: 'lesser' })],
      coverage: coverage('complete'),
    });
    expect(families.map((family) => family.name)).toEqual([
      'Hat',
      'unknown Scroll',
    ]);
  });

  it('keeps duplicate tiers as individual cards', () => {
    const rows = [
      row({ id: 'one', tier: 'lesser' }),
      row({ id: 'two', tier: 'lesser' }),
    ];
    const families = groupScrollFamilies({
      rows,
      coverage: coverage('complete'),
    });
    expect(families).toHaveLength(2);
    expect(families.map((family) => family.name)).toEqual([
      'one Scroll',
      'two Scroll',
    ]);
  });

  it('keeps an unsupported build untiered', () => {
    const rows = [row({ id: 'one' }), row({ id: 'two' })];
    const families = groupScrollFamilies({
      rows,
      coverage: coverage('unsupported'),
    });
    expect(families).toHaveLength(2);
    expect(families.every((family) => family.scrollMembers?.length === 1)).toBe(
      true,
    );
  });
});
