import { describe, expect, it } from 'vitest';

import {
  formatMonsterFact,
  projectMonsterBrowseRows,
  UNNAMED_MONSTER_LABEL,
  type MonsterBrowseRow,
  type MonsterFactId,
} from '../project';

import {
  ABSENT_FACT,
  fixtureCatalog,
  fixtureRecord,
  knownFact,
  UNKNOWN_FACT,
  UNSUPPORTED_FACT,
  type FixtureRecordInput,
} from './monsterCatalogFixture';

function firstRow(rows: readonly MonsterBrowseRow[]): MonsterBrowseRow {
  const [row] = rows;
  if (row === undefined) throw new Error('Fixture produced no rows.');
  return row;
}

/**
 * Distinct sentinel per positional slot, so a mis-ordered or guessed mapping
 * cannot pass by coincidence.
 */
function sentinelRecord() {
  return fixtureRecord({
    key: 'fixture:monster:001',
    name: knownFact('Sentinel Snail'),
    stats: [
      knownFact(101), // level
      knownFact(102), // hp
      knownFact(103), // mp
      knownFact(104), // exp
      knownFact(105), // physical attack
      knownFact(106), // physical defense
      knownFact(107), // magic attack
      knownFact(108), // magic defense
      knownFact(109), // accuracy
      knownFact(110), // avoidability
      knownFact(111), // pushed
      knownFact(112), // speed
    ],
    traits: [
      knownFact(true), // boss
      knownFact(false), // undead
      knownFact(true), // body attack
      knownFact(303), // first attack — deliberately not projected
      knownFact(true), // hide level — deliberately not projected
      knownFact(false), // hide name — deliberately not projected
      knownFact(7), // summon type — deliberately not projected
      knownFact(9), // category — deliberately not projected
      knownFact('sentinel-mob-type'), // raw mob type — deliberately not projected
    ],
  });
}

describe('projectMonsterBrowseRows contract-2 tuple mapping', () => {
  it('reads every projected stat and trait from its own positional slot', () => {
    const rows = projectMonsterBrowseRows(fixtureCatalog([sentinelRecord()]));
    const row = firstRow(rows);

    expect(row.key).toBe('fixture:monster:001');
    expect(row.name).toBe('Sentinel Snail');
    // The build is known by the route that loaded the catalog; repeating it on
    // every row would only enlarge the serialized projection.
    expect(row).not.toHaveProperty('buildId');

    expect(row.level).toBe(101);
    expect(row.hp).toBe(102);
    expect(row.mp).toBe(103);
    expect(row.exp).toBe(104);
    // Derived, not positional: `104 / 102 × 100`.
    expect(row.expPer100Hp).toBeCloseTo((104 / 102) * 100);
    expect(formatMonsterFact(row, 'expPer100Hp')).toBe('101.96');
    expect(row.physicalAttack).toBe(105);
    expect(row.physicalDefense).toBe(106);
    expect(row.magicAttack).toBe(107);
    expect(row.magicDefense).toBe(108);
    expect(row.accuracy).toBe(109);
    expect(row.avoidability).toBe(110);
    expect(row.pushed).toBe(111);
    expect(row.speed).toBe(112);

    expect(row.boss).toBe(true);
    expect(row.undead).toBe(false);
    expect(row.bodyAttack).toBe(true);

    expect(row.factStates).toEqual({});
  });

  it('does not project the traits and collections deliberately left out', () => {
    const row = firstRow(
      projectMonsterBrowseRows(fixtureCatalog([sentinelRecord()])),
    );

    for (const omitted of [
      'firstAttack',
      'hideLevel',
      'hideName',
      'summonType',
      'category',
      'mobTypeRaw',
      'elements',
      'relationships',
    ]) {
      expect(row).not.toHaveProperty(omitted);
    }
  });
});

describe('monster fact states', () => {
  const record = fixtureRecord({
    key: 'fixture:monster:002',
    name: UNKNOWN_FACT,
    stats: [
      knownFact(10), // level: known
      UNKNOWN_FACT, // hp
      ABSENT_FACT, // mp
      UNSUPPORTED_FACT, // exp
      knownFact(0), // physical attack: a genuine known zero
      knownFact(0),
      knownFact(0),
      knownFact(0),
      knownFact(0),
      knownFact(0),
      knownFact(0),
      knownFact(0), // speed: a genuine known zero
    ],
    traits: [
      knownFact(false), // boss: a genuine known false
      UNKNOWN_FACT, // undead
      ABSENT_FACT, // body attack
      UNKNOWN_FACT,
      UNKNOWN_FACT,
      UNKNOWN_FACT,
      UNKNOWN_FACT,
      UNKNOWN_FACT,
      UNKNOWN_FACT,
    ],
  });

  const row = firstRow(projectMonsterBrowseRows(fixtureCatalog([record])));

  it('keeps a known false distinct from every non-known state', () => {
    expect(row.boss).toBe(false);
    expect(formatMonsterFact(row, 'boss')).toBe('No');
    expect(row.factStates).not.toHaveProperty('boss');
  });

  it('keeps a known zero distinct from every non-known state', () => {
    expect(row.physicalAttack).toBe(0);
    expect(formatMonsterFact(row, 'physicalAttack')).toBe('0');
    expect(row.speed).toBe(0);
    expect(row.factStates).not.toHaveProperty('physicalAttack');
  });

  it('records each non-known state separately and never invents a value', () => {
    const expectations: readonly [MonsterFactId, string, string][] = [
      ['hp', 'unknown', 'Unknown'],
      ['mp', 'absent', 'Not recorded'],
      ['exp', 'unsupported', 'Not supported'],
      // Derived from the two above, so it cannot be known either. Its
      // unavailable state renders as a dash, not a word.
      ['expPer100Hp', 'unknown', '-'],
      ['undead', 'unknown', 'Unknown'],
      ['bodyAttack', 'absent', 'Not recorded'],
    ];

    for (const [factId, state, label] of expectations) {
      expect(row[factId]).toBeUndefined();
      expect(row.factStates[factId]).toBe(state);
      expect(formatMonsterFact(row, factId)).toBe(label);
      expect(formatMonsterFact(row, factId)).not.toBe('0');
      expect(formatMonsterFact(row, factId)).not.toBe('No');
    }

    expect(
      new Set(
        (['hp', 'mp', 'exp', 'undead', 'bodyAttack'] as const).map((factId) =>
          formatMonsterFact(row, factId),
        ),
      ),
    ).toEqual(new Set(['Unknown', 'Not recorded', 'Not supported']));
  });

  it('falls back to an honest label when the name is not known', () => {
    expect(row.name).toBe(UNNAMED_MONSTER_LABEL);
    expect(row.factStates['name']).toBe('unknown');
    expect(formatMonsterFact(row, 'name')).toBe(UNNAMED_MONSTER_LABEL);
  });
});

describe('derived EXP per 100 HP', () => {
  type StatFact = FixtureRecordInput['stats'][number];

  /** One record whose only interesting facts are HP and EXP. */
  function ratioRow(hp: StatFact, exp: StatFact): MonsterBrowseRow {
    return firstRow(
      projectMonsterBrowseRows(
        fixtureCatalog([
          fixtureRecord({
            key: 'fixture:monster:ratio',
            name: knownFact('Ratio Sentinel'),
            stats: [
              knownFact(10), // level
              hp,
              knownFact(0), // mp
              exp,
              knownFact(0), // physical attack
              knownFact(0), // physical defense
              knownFact(0), // magic attack
              knownFact(0), // magic defense
              knownFact(0), // accuracy
              knownFact(0), // avoidability
              knownFact(0), // pushed
              knownFact(0), // speed
            ],
            traits: [
              knownFact(false),
              knownFact(false),
              knownFact(false),
              knownFact(0),
              knownFact(false),
              knownFact(false),
              knownFact(0),
              knownFact(0),
              knownFact('ratio-fixture'),
            ],
          }),
        ]),
      ),
    );
  }

  it('derives EXP / HP × 100 from known inputs', () => {
    const row = ratioRow(knownFact(200), knownFact(25));

    expect(row.expPer100Hp).toBe(12.5);
    expect(row.factStates).not.toHaveProperty('expPer100Hp');
    expect(formatMonsterFact(row, 'expPer100Hp')).toBe('12.5');
  });

  it('shows a genuine zero EXP ratio as zero, not unknown', () => {
    const row = ratioRow(knownFact(200), knownFact(0));

    expect(row.expPer100Hp).toBe(0);
    expect(row.factStates).not.toHaveProperty('expPer100Hp');
    expect(formatMonsterFact(row, 'expPer100Hp')).toBe('0');
  });

  it('stays unknown when either input is not known', () => {
    for (const [hp, exp] of [
      [UNKNOWN_FACT, knownFact(25)],
      [knownFact(200), UNSUPPORTED_FACT],
      [ABSENT_FACT, ABSENT_FACT],
    ] as const) {
      const row = ratioRow(hp, exp);

      expect(row.expPer100Hp).toBeUndefined();
      expect(row.factStates['expPer100Hp']).toBe('unknown');
      expect(formatMonsterFact(row, 'expPer100Hp')).toBe('-');
    }
  });

  it('stays unknown instead of dividing by a known zero HP', () => {
    const row = ratioRow(knownFact(0), knownFact(25));

    expect(row.hp).toBe(0);
    expect(row.expPer100Hp).toBeUndefined();
    expect(row.factStates['expPer100Hp']).toBe('unknown');
    expect(formatMonsterFact(row, 'expPer100Hp')).toBe('-');
  });

  it('formats numbers with a pinned locale for SSR and hydration', () => {
    const row = ratioRow(knownFact(1_234_567), knownFact(2_469_134));

    expect(formatMonsterFact(row, 'hp')).toBe('1,234,567');
    expect(formatMonsterFact(row, 'expPer100Hp')).toBe('200');

    const large = ratioRow(knownFact(30), knownFact(45_000_000));
    // Same digits in any host locale: the grouping is explicit, not ambient.
    expect(formatMonsterFact(large, 'exp')).toBe('45,000,000');
    expect(formatMonsterFact(large, 'expPer100Hp')).toBe('150,000,000');
  });

  it('reads a ratio below display precision as a threshold, never as zero', () => {
    const row = ratioRow(knownFact(1_000_000), knownFact(10));

    expect(row.expPer100Hp).toBeCloseTo(0.001);
    expect(formatMonsterFact(row, 'expPer100Hp')).toBe('<0.01');
  });
});

describe('full roster projection', () => {
  const records = Array.from({ length: 5 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, '0');
    return fixtureRecord({
      key: `fixture:monster:${suffix}`,
      name: knownFact(`Fixture monster ${suffix}`),
      stats: [
        knownFact(index),
        knownFact(index),
        knownFact(index),
        knownFact(index),
        knownFact(index),
        knownFact(index),
        knownFact(index),
        knownFact(index),
        knownFact(index),
        knownFact(index),
        knownFact(index),
        knownFact(index),
      ],
      traits: [
        knownFact(false),
        knownFact(false),
        knownFact(false),
        knownFact(0),
        knownFact(false),
        knownFact(false),
        knownFact(0),
        knownFact(0),
        knownFact('fixture'),
      ],
    });
  });

  it('projects exactly the declared number of records without slicing', () => {
    const rows = projectMonsterBrowseRows(fixtureCatalog(records));

    expect(rows).toHaveLength(5);
    expect(rows.map((row) => row.key)).toEqual([
      'fixture:monster:001',
      'fixture:monster:002',
      'fixture:monster:003',
      'fixture:monster:004',
      'fixture:monster:005',
    ]);
  });
});
