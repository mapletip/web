import { describe, expect, it } from 'vitest';

import type { CategorizedItemRow } from '../../browse/project';
import { groupScrollFamilies } from '../../browse/scroll-families';
import { scrolls } from '../scrolls';

function row({
  id,
  name,
  targetLabel,
  tier,
  stats,
}: {
  readonly id: string;
  readonly name?: string;
  readonly targetLabel?: CategorizedItemRow['targetLabel'] | null;
  readonly tier?: CategorizedItemRow['tier'];
  readonly stats: NonNullable<CategorizedItemRow['stats']>;
}): CategorizedItemRow {
  return {
    key: id,
    sourceId: id,
    itemClass: 'consume',
    name: name ?? `${id} Practice Scroll`,
    ...(targetLabel ? { targetLabel } : {}),
    ...(tier ? { tier } : {}),
    stats,
    kind: 'scrolls',
    kindPath: ['all', 'use', 'scrolls'],
  };
}

const coverage = {
  relationships: {},
  scrollTier: 'complete',
} as Parameters<typeof groupScrollFamilies>[0]['coverage'];

function groupedRows(): readonly CategorizedItemRow[] {
  return groupScrollFamilies({
    rows: [
      row({
        id: 'lesser-sword',
        name: 'Lesser Training Sword Scroll',
        targetLabel: 'one-handed-sword',
        tier: 'lesser',
        stats: { weaponAttack: 2 },
      }),
      row({
        id: 'greater-sword',
        name: 'Greater Training Sword Scroll',
        targetLabel: 'one-handed-sword',
        tier: 'greater',
        stats: { weaponAttack: 5, speed: 1 },
      }),
      row({
        id: 'shield',
        targetLabel: 'shield',
        tier: 'lesser',
        stats: { weaponDefense: 2, magicDefense: 3 },
      }),
      row({
        id: 'cape-a',
        targetLabel: 'cape',
        tier: 'lesser',
        stats: { speed: 2 },
      }),
      row({
        id: 'cape-b',
        targetLabel: 'cape',
        tier: 'lesser',
        stats: { speed: 3 },
      }),
      row({ id: 'unresolved', targetLabel: null, stats: { accuracy: 1 } }),
    ],
    coverage,
  });
}

function queryAccessor({ id }: { readonly id: string }) {
  const field = scrolls.card
    .queryFields()
    .find((entry) => typeof entry !== 'string' && entry.id === id);
  if (
    field === undefined ||
    typeof field === 'string' ||
    typeof field.accessor !== 'function'
  ) {
    throw new Error(`Missing scroll query field ${id}`);
  }
  return field.accessor;
}

function recordNamed({
  records,
  name,
}: {
  readonly records: readonly CategorizedItemRow[];
  readonly name: string;
}): CategorizedItemRow {
  const record = records.find((candidate) => candidate.name === name);
  if (record === undefined) throw new Error(`Missing scroll record ${name}`);
  return record;
}

describe('Scrolls facets and tier search', () => {
  it('maps published equipment labels to the three pills', () => {
    const records = groupedRows();
    const pill = queryAccessor({ id: 'scrollPills' });
    expect(pill(recordNamed({ records, name: 'One Handed Sword' }))).toEqual([
      'weapons',
    ]);
    expect(pill(recordNamed({ records, name: 'Shield' }))).toEqual(['armor']);
    const cape = records.find((record) => record.targetLabel === 'cape');
    if (cape === undefined) throw new Error('Missing cape record');
    expect(pill(cape)).toEqual(['accessories-and-pets']);
    expect(
      pill(recordNamed({ records, name: 'unresolved Practice Scroll' })),
    ).toEqual([]);
  });

  it('offers pills and equipment and stat filters only for values on cards', () => {
    const rows = groupedRows();
    const facets = scrolls.card.facets({
      rows,
      coverage: undefined,
      relations: {},
    });
    expect(facets).toEqual([
      expect.objectContaining({
        label: 'Equipment type',
        placement: 'results',
        options: [
          { value: 'weapons', label: 'Weapons' },
          { value: 'armor', label: 'Armor' },
          { value: 'accessories-and-pets', label: 'Accessories and pets' },
        ],
      }),
      expect.objectContaining({
        label: 'Equipment',
        options: [
          { value: 'cape', label: 'Cape' },
          { value: 'one-handed-sword', label: 'One Handed Sword' },
          { value: 'shield', label: 'Shield' },
        ],
      }),
      {
        id: 'scroll-stat',
        field: 'scrollStats',
        label: 'Stat',
        kind: 'multi-select',
        options: [
          { value: 'accuracy', label: 'Accuracy' },
          { value: 'magicDefense', label: 'Magic defense' },
          { value: 'speed', label: 'Speed' },
          { value: 'weaponAttack', label: 'Weapon attack' },
          { value: 'weaponDefense', label: 'Weapon defense' },
        ],
      },
    ]);

    expect(rows).toHaveLength(5);
    const sword = recordNamed({ records: rows, name: 'One Handed Sword' });
    expect(queryAccessor({ id: 'scrollEquipment' })(sword)).toEqual([
      'one-handed-sword',
    ]);
    expect(queryAccessor({ id: 'scrollStats' })(sword)).toEqual([
      'speed',
      'weaponAttack',
    ]);
  });

  it('leaves unresolved equipment under All and matches every tier name', () => {
    const unresolved = groupScrollFamilies({
      rows: [
        row({ id: 'unsorted', targetLabel: null, stats: { accuracy: 1 } }),
      ],
      coverage,
    });
    const facets = scrolls.card.facets({
      rows: unresolved,
      coverage: undefined,
      relations: {},
    });
    expect(facets.map((facet) => facet.label)).toEqual(['Stat']);
    const unresolvedRecord = unresolved[0];
    if (unresolvedRecord === undefined)
      throw new Error('Missing unresolved scroll');
    const fact = scrolls.card.facts(unresolvedRecord, {
      coverage: undefined,
      relations: {},
    })[0];
    expect(fact?.label).toBe('Stat changes');

    const sword = groupedRows().find(
      (record) => record.name === 'One Handed Sword',
    );
    if (sword === undefined) throw new Error('Missing sword family');
    expect(sword.names).toContain('Lesser Training Sword Scroll');
    expect(scrolls.card.queryFields()).toContainEqual({
      id: 'names',
      accessor: 'names',
      sortable: false,
    });
  });
});
