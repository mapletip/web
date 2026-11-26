import { MantineProvider } from '@mantine/core';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { formatItemFacts, ItemDrawerBody } from '../ItemDrawerBody';
import type { CategorizedItemRow } from '../project';
import type {
  ItemDrawerPack,
  ItemDrawerRelationKind,
  ItemRelationReader,
} from '../relations';

const scope = { family_id: 'classic-world', build_id: 'cw-launch' };

function row(overrides: Partial<CategorizedItemRow> = {}): CategorizedItemRow {
  return {
    key: 'item:fixture:1',
    sourceId: 'fixture-item',
    itemClass: 'consume',
    name: 'Practice Tonic',
    kind: 'potions-and-food',
    kindPath: ['all', 'use', 'potions-and-food'],
    ...overrides,
  };
}

function makeReader(
  options: {
    readonly descriptions?: () => Promise<Readonly<Record<string, string>>>;
    readonly relation?: <K extends ItemDrawerRelationKind>(
      kind: K,
    ) => Promise<ItemDrawerPack<K>>;
  } = {},
): ItemRelationReader {
  return {
    readDescriptions: options.descriptions ?? vi.fn(() => Promise.resolve({})),
    readRelation:
      (options.relation as ItemRelationReader['readRelation']) ??
      vi.fn(() => Promise.reject(new Error('unexpected relation read'))),
    forgetDescriptions: vi.fn(),
    forgetRelation: vi.fn(),
  };
}

describe('formatItemFacts', () => {
  it('formats every published fact in plain US English', () => {
    expect(
      formatItemFacts({
        record: row({
          hp: 150,
          hpPercent: 35,
          mp: 80,
          mpPercent: 20,
          buff: {
            durationSeconds: 600,
            effects: [
              { stat: 'weaponAttack', unit: 'flat', value: 5 },
              { stat: 'criticalRate', unit: 'percent', value: 10 },
            ],
          },
          attack: 27,
          level: 30,
          maxStack: 100,
          sellPrice: 1_200,
        }),
      }),
    ).toEqual([
      'Restores 150 HP',
      'Restores 35% HP',
      'Restores 80 MP',
      'Restores 20% MP',
      '+5 weapon attack, +10% critical rate · Lasts 10 min',
      '+27 attack',
      'Requires level 30',
      'Stacks to 100',
      'Sells for 1,200 mesos',
    ]);
  });

  it('uses singular meso for 1 and omits unpublished facts', () => {
    expect(formatItemFacts({ record: row({ sellPrice: 1 }) })).toEqual([
      'Sells for 1 meso',
    ]);
    expect(formatItemFacts({ record: row() })).toEqual([]);
  });

  it('formats sub-minute and mixed buff durations and omits absent duration', () => {
    expect(
      formatItemFacts({
        record: row({
          buff: {
            durationSeconds: 45,
            effects: [{ stat: 'speed', unit: 'flat', value: 10 }],
          },
        }),
      }),
    ).toEqual(['+10 speed · Lasts 45 sec']);

    expect(
      formatItemFacts({
        record: row({
          buff: {
            durationSeconds: 95,
            effects: [{ stat: 'jump', unit: 'flat', value: 5 }],
          },
        }),
      }),
    ).toEqual(['+5 jump · Lasts 1 min 35 sec']);

    expect(
      formatItemFacts({
        record: row({
          buff: {
            effects: [{ stat: 'magicAttack', unit: 'flat', value: 8 }],
          },
        }),
      }),
    ).toEqual(['+8 magic attack']);
  });
});

describe('ItemDrawerBody', () => {
  it('renders the category label and published facts, leaving the name to the drawer title', async () => {
    render(
      <MantineProvider>
        <ItemDrawerBody
          record={row({
            name: 'Sample Draught',
            hp: 150,
            mp: 80,
            sellPrice: 1_200,
          })}
          categoryLabel="Potions & Food"
          reader={makeReader()}
        />
      </MantineProvider>,
    );

    expect(screen.queryByText('Sample Draught')).toBeNull();
    expect(screen.getByText('Potions & Food')).toBeTruthy();
    expect(screen.getByRole('list')).toBeTruthy();
    expect(screen.getByText('Restores 150 HP')).toBeTruthy();
    expect(screen.getByText('Restores 80 MP')).toBeTruthy();
    expect(screen.getByText('Sells for 1,200 mesos')).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });

  it('omits the facts list when the row carries no published facts', async () => {
    render(
      <MantineProvider>
        <ItemDrawerBody
          record={row({ name: 'Quiet Potion' })}
          categoryLabel="Potions & Food"
          reader={makeReader()}
        />
      </MantineProvider>,
    );

    expect(screen.queryByText('Quiet Potion')).toBeNull();
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('uses the category description projection without reading descriptions again', async () => {
    const readDescriptions = vi.fn(() =>
      Promise.reject(new Error('description read should not repeat')),
    );
    render(
      <MantineProvider>
        <ItemDrawerBody
          record={row()}
          categoryLabel="Other Use"
          reader={makeReader({ descriptions: readDescriptions })}
          descriptions={{
            'fixture-item':
              'A full long description stays available inside the item drawer.',
          }}
        />
      </MantineProvider>,
    );

    await screen.findByText(
      'A full long description stays available inside the item drawer.',
    );
    expect(readDescriptions).not.toHaveBeenCalled();
  });

  it('renders description text codes as emphasized words and spaces', async () => {
    const { container } = render(
      <MantineProvider>
        <ItemDrawerBody
          record={row()}
          categoryLabel="Other Use"
          reader={makeReader()}
          descriptions={{
            'fixture-item':
              '#cDouble-click# the practice box.\\nSee what is inside.',
          }}
        />
      </MantineProvider>,
    );
    await screen.findByText('Double-click');
    expect(container.textContent).toContain(
      'Double-click the practice box. See what is inside.',
    );
    expect(container.textContent).not.toContain('#');
    expect(container.textContent).not.toContain('\\n');
    expect(screen.getByText('Double-click')).toHaveStyle({ fontWeight: '600' });
  });

  it('renders description, quests, recipes, monsters with VOD links, and expands shortened lists', async () => {
    const questsPack: ItemDrawerPack<'needed-for-quest'> = {
      contractVersion: '2.0',
      format: 'item-related-entity-browse/1',
      relationshipKind: 'needed-for-quest',
      scope,
      targets: Array.from({ length: 6 }, (_, index) => ({
        key: `quest:${index + 1}`,
        publicId: `q000000${index + 1}`,
        displayName: `Quest ${index + 1}`,
        startLevel: { state: 'known', value: 10 + index },
        startNpc: { state: 'unknown' },
        recurrence: { state: 'unknown' },
      })),
      records: {
        'item:fixture:1': Array.from({ length: 6 }, (_, index) => ({
          target: index,
          roles: [{ role: 'turned-in', amount: index + 1 }],
        })),
      },
    };
    const monstersPack: ItemDrawerPack<'monster-drop'> = {
      contractVersion: '2.0',
      format: 'item-related-entity-browse/1',
      relationshipKind: 'monster-drop',
      scope,
      evidence: {
        evidenceKinds: [{ key: 'vod', label: 'VOD' }],
        evidenceSources: [
          {
            kind: 'vod',
            build: 'cw-launch',
            date: '2026-02-01',
            url: 'https://video.example/watch?v=fixture',
          },
        ],
      },
      targets: Array.from({ length: 7 }, (_, index) => ({
        key: `monster:${index + 1}`,
        publicId: `m000000${index + 1}`,
        displayName: `Monster ${index + 1}`,
        level: { state: 'known', value: 20 + index },
        sprite: { state: 'unknown' },
      })),
      records: {
        'item:fixture:1': Array.from({ length: 7 }, (_, index) => ({
          target: index,
          evidence: [{ source: 0, startSeconds: 95 }],
        })),
      },
    };

    const reader = makeReader({
      descriptions: () =>
        Promise.resolve({ 'item:fixture:1': 'Full drawer description.' }),
      relation: (kind) =>
        Promise.resolve(
          (kind === 'needed-for-quest' ? questsPack : monstersPack) as never,
        ),
    });

    render(
      <MantineProvider>
        <ItemDrawerBody
          record={row({
            neededForQuestCount: 6,
            monsterDropCount: 7,
          })}
          categoryLabel="Monster Drops"
          reader={reader}
        />
      </MantineProvider>,
    );

    await screen.findByText('Full drawer description.');

    const questSection = screen.getByRole('region', {
      name: 'Required by quests',
    });
    expect(within(questSection).getAllByRole('listitem')).toHaveLength(5);
    fireEvent.click(
      within(questSection).getByRole('button', { name: 'Show all 6' }),
    );
    expect(within(questSection).getAllByRole('listitem')).toHaveLength(6);

    const monsterSection = screen.getByRole('region', {
      name: 'Dropped by monsters',
    });
    expect(within(monsterSection).getAllByRole('listitem')).toHaveLength(6);
    const vodLink = within(monsterSection).getAllByRole('link', {
      name: 'VOD',
    })[0];
    expect(vodLink?.getAttribute('href')).toBe(
      'https://video.example/watch?v=fixture&t=95s',
    );
    expect(vodLink?.getAttribute('target')).toBe('_blank');

    fireEvent.click(
      within(monsterSection).getByRole('button', { name: 'Show all 7' }),
    );
    expect(within(monsterSection).getAllByRole('listitem')).toHaveLength(7);
  });

  it('keeps the item facts on failure with Try again and no diagnostics, then recovers', async () => {
    const readDescriptions = vi
      .fn<() => Promise<Readonly<Record<string, string>>>>()
      .mockRejectedValueOnce(new Error('sha256 mismatch at v2/items/secret'))
      .mockResolvedValue({ 'item:fixture:1': 'Recovered description.' });
    const reader = makeReader({ descriptions: readDescriptions });

    render(
      <MantineProvider>
        <ItemDrawerBody
          record={row({ sellPrice: 35 })}
          categoryLabel="Ores & Gems"
          reader={reader}
        />
      </MantineProvider>,
    );

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(
      'Quests, recipes and monsters could not be loaded.',
    );
    expect(screen.getByText('Ores & Gems')).toBeTruthy();
    expect(screen.getByText('Sells for 35 mesos')).toBeTruthy();
    expect(document.body.textContent).not.toContain('sha256');
    expect(document.body.textContent).not.toContain('v2/items');

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByText('Recovered description.');
  });
});
