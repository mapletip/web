import { MantineProvider } from '@mantine/core';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FacetedBrowser } from '@/components/FacetedBrowser';

const records = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Bravo' },
];

describe('card columns', () => {
  it('lays cards out in a responsive grid that stays a list', () => {
    render(
      <MantineProvider>
        <FacetedBrowser
          title={<h1>Records</h1>}
          records={records}
          idAccessor="id"
          presentation="cards"
          cardColumns={{ base: 1, md: 2 }}
          renderCard={(record) => <p>{record.name}</p>}
        />
      </MantineProvider>,
    );

    const list = screen.getByRole('list', { name: 'records cards' });
    expect(list.className).toContain('SimpleGrid');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });
});
