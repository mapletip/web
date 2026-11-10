import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../../categories';
import { getItemColumns } from '../../columns';
import type { ItemRow } from '../../project';
import { ItemBrowseCard } from '../index';

const coverage = {
  scrollTier: 'complete' as const,
  relationships: {
    'cash-shop-listing': 'complete' as const,
    'found-in-container': 'complete' as const,
    'made-by-recipe': 'complete' as const,
    'monster-drop': 'complete' as const,
    'needed-for-quest': 'complete' as const,
    'quest-reward': 'complete' as const,
    'used-in-recipe': 'complete' as const,
  },
};

describe('ItemBrowseCard', () => {
  it('renders icon, name, and facts from context columns that have a value', () => {
    const scrollCategory = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find((c) => c.slug === 'scrolls'),
    };
    const row: ItemRow = {
      sourceId: '02040001',
      name: 'Scroll for Helmet for DEF 100%',
      itemClass: 'consume',
      targetLabel: 'hat',
      stats: { weaponDefense: 1 },
      success: 100,
    };

    const { facts } = getItemColumns({
      category: scrollCategory,
      coverage,
      rows: [row],
    });

    render(
      <MantineProvider theme={theme}>
        <ItemBrowseCard record={row} facts={facts} />
      </MantineProvider>,
    );

    // Identity
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Scroll for Helmet for DEF 100%',
    );
    expect(screen.queryByText('02040001')).not.toBeInTheDocument();

    // Facts from scroll columns that have a value
    expect(screen.getByText('Equipment type')).toBeInTheDocument();
    expect(screen.getByText('Hat')).toBeInTheDocument();
    expect(screen.getByText('Stats Improved')).toBeInTheDocument();
    expect(screen.getByText('Weapon DEF +1')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Destruction risk')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('omits facts without values so cards only show recorded facts', () => {
    const recoveryCategory = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find((c) => c.slug === 'recovery'),
    };
    // Potion with only HP, no MP or percents
    const potionRow: ItemRow = {
      sourceId: '02000000',
      name: 'Red Potion',
      itemClass: 'consume',
      hp: 100,
    };

    const { facts } = getItemColumns({
      category: recoveryCategory,
      coverage,
      rows: [
        potionRow,
        {
          sourceId: '02000001',
          itemClass: 'consume',
          mp: 100,
        },
      ],
    });

    render(
      <MantineProvider theme={theme}>
        <ItemBrowseCard record={potionRow} facts={facts} />
      </MantineProvider>,
    );

    expect(screen.getByText('HP Recovered')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.queryByText('MP Recovered')).not.toBeInTheDocument();
    expect(screen.queryByText('Not recorded')).not.toBeInTheDocument();
  });

  it('renders nothing extra when a card has no recorded facts', () => {
    const rowWithoutFacts: ItemRow = {
      sourceId: '04000000',
      name: 'Plain Snail Shell',
      itemClass: 'etc',
    };

    render(
      <MantineProvider theme={theme}>
        <ItemBrowseCard record={rowWithoutFacts} facts={[]} />
      </MantineProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Plain Snail Shell',
    );
    expect(screen.queryByText('04000000')).not.toBeInTheDocument();
    expect(screen.queryByRole('definition')).not.toBeInTheDocument();
  });

  it('handles unnamed items gracefully', () => {
    const rowUnnamed: ItemRow = {
      sourceId: '09999999',
      itemClass: 'etc',
    };

    render(
      <MantineProvider theme={theme}>
        <ItemBrowseCard record={rowUnnamed} />
      </MantineProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Unnamed item',
    );
    expect(screen.queryByText('09999999')).not.toBeInTheDocument();
  });
});
