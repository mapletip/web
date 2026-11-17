import { MantineProvider } from '@mantine/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { DetailCardList } from '../DetailCardList';

const cards = [
  { key: 'c', name: 'Cedar', rank: 1 },
  { key: 'a', name: 'Ash', rank: 3 },
  { key: 'b', name: 'Birch', rank: 2 },
] as const;

function ControlledList({ showSearch }: { readonly showSearch: boolean }) {
  const [query, setQuery] = useState('');

  return (
    <DetailCardList
      items={cards}
      getKey={(card) => card.key}
      renderItem={(card) => <span>{card.name}</span>}
      itemTestId="detail-card"
      {...(showSearch
        ? {
            search: {
              label: 'Find a card',
              placeholder: 'Card name',
              noMatchesMessage: 'No cards match.',
              value: query,
              onChange: setQuery,
              matches: (card: (typeof cards)[number], value: string) =>
                card.name.toLocaleLowerCase('en').includes(value),
              countMessage: (matchingCount, totalCount) =>
                `${matchingCount} of ${totalCount} cards`,
            },
          }
        : {})}
    />
  );
}

function mount(showSearch: boolean) {
  return render(
    <MantineProvider>
      <ControlledList showSearch={showSearch} />
    </MantineProvider>,
  );
}

describe('DetailCardList', () => {
  it('renders the caller-sorted list without optional search UI', () => {
    mount(false);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(
      screen.getAllByTestId('detail-card').map((card) => card.textContent),
    ).toEqual(['Cedar', 'Ash', 'Birch']);
    expect(screen.queryByText('3 of 3 cards')).not.toBeInTheDocument();
  });

  it('filters with controlled search and keeps the caller order', async () => {
    const user = userEvent.setup();
    mount(true);

    const list = screen.getByRole('list');
    expect(
      within(list)
        .getAllByTestId('detail-card')
        .map((card) => card.textContent),
    ).toEqual(['Cedar', 'Ash', 'Birch']);

    await user.type(
      screen.getByRole('textbox', { name: 'Find a card' }),
      'BIR',
    );
    expect(
      within(list)
        .getAllByTestId('detail-card')
        .map((card) => card.textContent),
    ).toEqual(['Birch']);
    expect(screen.getByText('1 of 3 cards')).toBeVisible();
  });
});
