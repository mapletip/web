import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ItemBrowseCard } from '../ItemBrowseCard';
import type { ItemRow } from '../project';

const row: ItemRow = {
  key: 'item:02000000',
  sourceId: '02000000',
  name: 'Red Potion',
  itemClass: 'consume',
};

describe('ItemBrowseCard', () => {
  it('shows the item name without displaying its internal ID', () => {
    render(
      <MantineProvider theme={theme}>
        <ItemBrowseCard record={row} />
      </MantineProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Red Potion' })).toBeVisible();
    expect(screen.queryByText('ID', { exact: true })).not.toBeInTheDocument();
    expect(
      screen.queryByText('02000000', { exact: true }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('definition')).not.toBeInTheDocument();
  });
});
