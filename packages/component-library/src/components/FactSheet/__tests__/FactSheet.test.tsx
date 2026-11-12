import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import '@/styles.css';
import { FactSheet } from '@/components/FactSheet';
import type { Fact, FactSheetProps } from '@/components/FactSheet';

function mount(props: Partial<FactSheetProps> = {}) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <FactSheet facts={[]} {...props} />
    </MantineProvider>,
  );
}

function rows(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('dl > div')];
}

describe('FactSheet', () => {
  it('renders every fact in the supplied order with its label and value', () => {
    const facts: readonly Fact[] = [
      { label: 'Level', value: '1' },
      { label: 'Health', value: '10' },
      { label: 'Experience', value: '15' },
    ];

    const { container } = mount({ facts });

    expect(rows(container).map((row) => row.textContent)).toEqual([
      'Level1',
      'Health10',
      'Experience15',
    ]);
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(
      ['Level', 'Health', 'Experience'],
    );
    expect(
      screen.getAllByRole('definition').map((value) => value.textContent),
    ).toEqual(['1', '10', '15']);
  });

  it('associates each value with the label in its own description-list row', () => {
    const { container } = mount({
      facts: [
        { label: 'First fact', value: 'Alpha' },
        { label: 'Second fact', value: 'Beta' },
      ],
    });

    for (const row of rows(container)) {
      expect(row.querySelector('dt')?.textContent).toBeTruthy();
      expect(row.querySelector('dd')?.textContent).toBeTruthy();
      expect(row.children).toHaveLength(2);
    }
  });

  it('shows the supplied value exactly as given', () => {
    mount({ facts: [{ label: 'Health', value: '23,000,000' }] });

    expect(screen.getByRole('definition').textContent).toBe('23,000,000');
  });

  it('shows a known zero rather than treating it as missing', () => {
    mount({ facts: [{ label: 'Experience', value: '0' }] });

    expect(screen.getByRole('definition').textContent).toBe('0');
    expect(screen.getByRole('definition')).not.toHaveAttribute(
      'data-not-known',
    );
  });

  it('keeps a supplied icon out of the accessibility tree', () => {
    mount({
      facts: [
        {
          label: 'Level',
          value: '1',
          icon: <svg data-testid="fact-icon" />,
        },
      ],
    });

    const icon = screen.getByTestId('fact-icon');
    expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('marks a fact with an explanation as explainable and focusable', () => {
    mount({
      facts: [
        {
          label: 'Health',
          value: '10',
          explanation: 'Total health before any modifiers.',
        },
      ],
    });

    const label = screen.getByRole('button', { name: 'Health' });
    expect(label).toHaveAttribute('data-explainable', 'true');
    expect(label).toHaveAttribute('type', 'button');
  });

  it('shows the host wording for a not-known fact and marks it as not known', () => {
    mount({
      facts: [
        { label: 'Level', value: '30' },
        { label: 'Drop rate', notKnown: 'Unknown' },
      ],
    });

    const values = screen.getAllByRole('definition');
    expect(values[1]?.textContent).toBe('Unknown');
    expect(values[1]).toHaveAttribute('data-not-known', 'true');
    expect(values[0]).not.toHaveAttribute('data-not-known');
    expect(values[1]?.textContent).not.toBe('');
    expect(values[1]?.textContent).not.toBe('0');
  });

  it('renders nothing when the host supplies no facts', () => {
    const { container } = mount({ facts: [] });

    expect(container.querySelector('dl')).toBeNull();
    expect(screen.queryAllByRole('term')).toHaveLength(0);
    expect(screen.queryAllByRole('definition')).toHaveLength(0);
  });
});
