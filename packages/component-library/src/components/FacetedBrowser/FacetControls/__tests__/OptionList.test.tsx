import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OptionList } from '@/components/FacetedBrowser/FacetControls/OptionList';

describe('OptionList groups', () => {
  it('shows headings in option order and keeps values on their options', () => {
    const onChange = vi.fn();
    render(
      <MantineProvider>
        <OptionList
          label="Equipment slot"
          options={[
            { value: 'hat', label: 'Hat', count: 2, group: 'Armor' },
            { value: 'bow', label: 'Bow', count: 3, group: 'Weapons' },
            { value: 'gloves', label: 'Gloves', count: 1, group: 'Armor' },
          ]}
          value={[]}
          onChange={onChange}
        />
      </MantineProvider>,
    );

    expect(
      screen.getAllByText(/^(Armor|Weapons)$/u).map((node) => node.textContent),
    ).toEqual(['Armor', 'Weapons', 'Armor']);
    expect(
      screen
        .getAllByRole('checkbox')
        .map((checkbox) => checkbox.getAttribute('value')),
    ).toEqual(['hat', 'bow', 'gloves']);
    expect(
      screen.getByRole('checkbox', { name: 'Hat (2)' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Hat (2)' }));
    expect(onChange).toHaveBeenCalledWith(['hat']);
  });

  it('renders options without a group heading', () => {
    render(
      <MantineProvider>
        <OptionList
          label="Category"
          options={[{ value: 'potion', label: 'Potion', count: 4 }]}
          value={[]}
          onChange={() => undefined}
        />
      </MantineProvider>,
    );

    expect(
      screen.getByRole('checkbox', { name: 'Potion (4)' }),
    ).toBeInTheDocument();
  });
});
