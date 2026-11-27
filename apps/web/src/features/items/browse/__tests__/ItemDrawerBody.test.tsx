import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { formatItemFacts, ItemDrawerBody } from '../ItemDrawerBody';
import type { CategorizedItemRow } from '../project';

function row(overrides: Partial<CategorizedItemRow> = {}): CategorizedItemRow {
  return {
    sourceId: 'fixture-item',
    itemClass: 'consume',
    name: 'Practice Tonic',
    kind: 'potions-and-food',
    kindPath: ['all', 'use', 'potions-and-food'],
    ...overrides,
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
  it('renders the category label and published facts, leaving the name to the drawer title', () => {
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
        />
      </MantineProvider>,
    );

    expect(screen.queryByText('Sample Draught')).toBeNull();
    expect(screen.getByText('Potions & Food')).toBeTruthy();
    expect(screen.getByRole('list')).toBeTruthy();
    expect(screen.getByText('Restores 150 HP')).toBeTruthy();
    expect(screen.getByText('Restores 80 MP')).toBeTruthy();
    expect(screen.getByText('Sells for 1,200 mesos')).toBeTruthy();
  });

  it('omits the facts list when the row carries no published facts', () => {
    render(
      <MantineProvider>
        <ItemDrawerBody
          record={row({ name: 'Quiet Potion' })}
          categoryLabel="Potions & Food"
        />
      </MantineProvider>,
    );

    expect(screen.queryByText('Quiet Potion')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });
});
