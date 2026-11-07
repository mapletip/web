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
  it('renders icon, name, ID, and facts from context columns', () => {
    const scrollCategory = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find((c) => c.slug === 'upgrade-scrolls'),
    };
    const row: ItemRow = {
      key: 'scroll-1',
      sourceId: '02040001',
      name: 'Scroll for Helmet for DEF 100%',
      itemClass: 'consume',
      targetLabel: 'hat',
      stats: { weaponDefense: 1 },
      success: 100,
    };

    const { columns } = getItemColumns(scrollCategory, coverage, [row]);

    render(
      <MantineProvider theme={theme}>
        <ItemBrowseCard record={row} columns={columns} />
      </MantineProvider>,
    );

    // Identity
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Scroll for Helmet for DEF 100%',
    );
    expect(screen.getByText('02040001')).toBeInTheDocument();

    // Facts from scroll columns
    expect(screen.getByText('Equipment type')).toBeInTheDocument();
    expect(screen.getByText('Hat')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Weapon DEF +1')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Destruction risk')).toBeInTheDocument();
    expect(screen.getByText('No recorded risk')).toBeInTheDocument();
  });

  it('renders missing states in full words on cards', () => {
    const scrollCategory = {
      scope: ITEM_SCOPES.use,
      child: ITEM_SCOPES.use.children.find((c) => c.slug === 'upgrade-scrolls'),
    };
    // Scroll without deltas/stats
    const rowWithoutStats: ItemRow = {
      key: 'scroll-blank',
      sourceId: '02049999',
      itemClass: 'consume',
      targetLabel: 'claw',
      success: 60,
    };

    const { columns } = getItemColumns(scrollCategory, coverage, [
      rowWithoutStats,
      {
        key: 'other',
        sourceId: '02049998',
        itemClass: 'consume',
        stats: { weaponAttack: 2 },
      },
    ]);

    render(
      <MantineProvider theme={theme}>
        <ItemBrowseCard record={rowWithoutStats} columns={columns} />
      </MantineProvider>,
    );

    // Missing stats rendered as full words "Not recorded"
    expect(screen.getByText('Not recorded')).toBeInTheDocument();
  });

  it('handles unnamed items gracefully', () => {
    const rowUnnamed: ItemRow = {
      key: 'unnamed',
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
    expect(screen.getByText('09999999')).toBeInTheDocument();
  });
});
