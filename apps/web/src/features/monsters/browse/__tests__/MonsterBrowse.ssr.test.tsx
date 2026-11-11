import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BUILD_ID } from '@/config/maplekit';

import { MonsterBrowse } from '..';
import { projectMonsterBrowseRows } from '../project';

import {
  ABSENT_FACT,
  emptyDropBrowseFixture,
  fixtureCatalog,
  fixtureRecord,
  knownFact,
  UNKNOWN_FACT,
} from './monsterCatalogFixture';

const KNOWN_SPRITE_ID = 'b'.repeat(64);

function knownStats(base: number) {
  return [
    knownFact(base + 1),
    knownFact(base + 2),
    knownFact(base + 3),
    knownFact(base + 4),
    knownFact(base + 5),
    knownFact(base + 6),
    knownFact(base + 7),
    knownFact(base + 8),
    knownFact(base + 9),
    knownFact(base + 10),
    knownFact(base + 11),
    knownFact(base + 12),
  ] as const;
}

const fixtureRecords = [
  fixtureRecord({
    key: 'fixture:monster:001',
    name: knownFact('Sentinel Snail'),
    stats: [...knownStats(0)],
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
    sprite: knownFact(KNOWN_SPRITE_ID),
  }),
  fixtureRecord({
    key: 'fixture:monster:002',
    name: knownFact('Sentinel Slime'),
    stats: [
      knownFact(20),
      UNKNOWN_FACT,
      knownFact(22),
      knownFact(23),
      knownFact(24),
      knownFact(25),
      knownFact(26),
      knownFact(27),
      knownFact(28),
      knownFact(29),
      knownFact(30),
      knownFact(31),
    ],
    traits: [
      UNKNOWN_FACT,
      knownFact(true),
      ABSENT_FACT,
      knownFact(0),
      knownFact(false),
      knownFact(false),
      knownFact(0),
      knownFact(0),
      knownFact('fixture'),
    ],
  }),
  fixtureRecord({
    key: 'fixture:monster:003',
    name: knownFact('Sentinel Mushroom'),
    stats: [...knownStats(40)],
    traits: [
      knownFact(true),
      knownFact(false),
      knownFact(true),
      knownFact(0),
      knownFact(false),
      knownFact(false),
      knownFact(0),
      knownFact(0),
      knownFact('fixture'),
    ],
  }),
];

function renderBrowseHtml(): string {
  const rows = projectMonsterBrowseRows(
    fixtureCatalog({ records: fixtureRecords }),
    emptyDropBrowseFixture(),
  );

  // The page takes its rows as props and uses no router hooks, so plain server
  // rendering is the whole contract; no router scaffolding is needed.
  return renderToString(
    <MantineProvider theme={theme} forceColorScheme="dark">
      <MonsterBrowse
        buildId={DEFAULT_BUILD_ID}
        rows={rows}
        dropItemOptions={[]}
      />
    </MantineProvider>,
  );
}

describe('MonsterBrowse server rendering', () => {
  it('renders real records and the build label', () => {
    const html = renderBrowseHtml();

    expect(html).toContain('MapleStory Classic World Monsters');
    // The count is the genuine total with a short noun, not a page window and
    // not the full build label repeated beside it.
    expect(html).toContain('3 Monsters');
    expect(html).not.toContain('1–3 of');
    expect(html).not.toContain('verified release');
    expect(html).toContain('Sentinel Snail');
    expect(html).toContain('Sentinel Slime');
    expect(html).toContain('Sentinel Mushroom');
    const spriteUrl = `https://d0.mapletip.com/media/images/bb/${KNOWN_SPRITE_ID}.png`;
    expect(html.split(`src="${spriteUrl}"`).length - 1).toBe(2);
    expect(html).toContain('data-fallback="true"');
    // Compact MapleTip browse labels, with the full stat name kept for assistive
    // technology through the column's `fullLabel`.
    expect(html).toContain('W. ATT');
    expect(html).toContain('Weapon attack');
    expect(html).toContain('AVOID');
    expect(html).toContain('Avoidability');
    // The WZ `pushed` fact is the damage threshold needed to knock a monster
    // back, so the header is `KB` and the accessible name is the full meaning.
    expect(html).toContain('Knockback damage threshold');
    expect(html).not.toContain('Physical attack');
    // EXP / 100 HP is derived from the known EXP and HP facts, never read from
    // the catalog; `44 / 42 × 100` rounds to two decimals for display.
    expect(html).toContain('EXP / 100 HP');
    expect(html).toContain('Experience per 100 HP');
    expect(html).toContain('104.76');
    // With three distinct values, the range facet renders exact-value buckets
    // during SSR instead of quantile ranges.
    expect(html).not.toContain('1–40');
    expect(html).not.toContain('41–45');
    // One record has no known HP, so its ratio is unavailable: the numeric
    // column and the mobile card show a bare dash instead of a word.
    expect(html).toContain('>-</td>');
    expect(html).toContain('EXP / 100 HP: -');
    expect(html).toContain('Unknown');
    expect(html).not.toContain('0 native');
  });
});
