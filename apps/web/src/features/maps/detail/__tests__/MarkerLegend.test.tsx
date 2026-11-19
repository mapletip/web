import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MarkerLegend } from '../MapDetail/MarkerLegend';
import type { MapDetailEntityView } from '../project';

const entity: MapDetailEntityView = {
  focusKey: 'monster-aaaaaaaa',
  kind: 'monster',
  name: 'Twin Sprout',
  kindLabel: 'Monster',
};

function renderLegend() {
  const onActivate = vi.fn();
  render(
    <MantineProvider>
      <MarkerLegend
        entities={[entity]}
        focus={undefined}
        onActivate={onActivate}
      />
    </MantineProvider>,
  );
  return {
    onActivate,
    label: screen.getByText('Twin Sprout'),
    input: screen.getByRole('checkbox', { name: 'Twin Sprout, Monster' }),
  };
}

describe('MarkerLegend', () => {
  it('activates once without a modifier on a plain click', () => {
    const { onActivate, label } = renderLegend();
    fireEvent.click(label);
    expect(onActivate.mock.calls).toEqual([['monster-aaaaaaaa', false]]);
  });

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Cmd', { metaKey: true }],
  ])('activates once as modified on a %s-click on the label', (_, keys) => {
    const { onActivate, label } = renderLegend();
    fireEvent.click(label, keys);
    expect(onActivate.mock.calls).toEqual([['monster-aaaaaaaa', true]]);
  });

  it('activates as modified on Ctrl+Space without relying on the click modifier', () => {
    const { onActivate, input } = renderLegend();
    const keyDown = fireEvent.keyDown(input, { key: ' ', ctrlKey: true });
    expect(keyDown).toBe(false);
    expect(onActivate.mock.calls).toEqual([['monster-aaaaaaaa', true]]);
  });

  it('leaves a plain Space to the input click', () => {
    const { onActivate, input } = renderLegend();
    expect(fireEvent.keyDown(input, { key: ' ' })).toBe(true);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('shows no check icon on a selected chip', () => {
    render(
      <MantineProvider>
        <MarkerLegend
          entities={[entity]}
          focus={{ keys: [entity.focusKey] }}
          onActivate={vi.fn()}
        />
      </MantineProvider>,
    );
    const chip = screen.getByRole('checkbox', { name: 'Twin Sprout, Monster' });
    expect(chip).toBeChecked();
    expect(document.querySelector('.mantine-Chip-iconWrapper')).toBeNull();
  });
});
