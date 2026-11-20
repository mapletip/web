import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MarkerLegend } from '../MapDetail/MarkerLegend';
import type { MapDetailEntityView } from '../project';

const entity: MapDetailEntityView = {
  focusKey: 'monster-aaaaaaaa',
  kind: 'monster',
  name: 'Twin Sprout',
  kindLabel: 'Monster',
};

function renderLegend(entities: readonly MapDetailEntityView[] = [entity]) {
  const onActivate = vi.fn();
  render(
    <MantineProvider>
      <MarkerLegend
        entities={entities}
        focus={undefined}
        onActivate={onActivate}
      />
    </MantineProvider>,
  );
  return onActivate;
}

describe('MarkerLegend', () => {
  it('keeps a mixed legend of twelve entities or fewer tabless in the scroll area', () => {
    const entities = Array.from({ length: 12 }, (_, index) => ({
      ...entity,
      focusKey: `monster-${String(index).padStart(8, '0')}`,
      name: `Monster ${index + 1}`,
      ...(index === 11 ? { kind: 'npc' as const, kindLabel: 'NPC' } : {}),
    }));
    renderLegend(entities);

    expect(
      screen.queryByRole('tablist', { name: 'Map legend kinds' }),
    ).not.toBeInTheDocument();
    expect(
      within(
        screen.getByRole('region', { name: 'Scrollable map legend' }),
      ).getAllByRole('checkbox'),
    ).toHaveLength(12);
  });

  it('shows tabs for more than twelve mixed entities and keeps chips in the scroll area', () => {
    const entities = Array.from({ length: 13 }, (_, index) => ({
      ...entity,
      focusKey: `monster-${String(index).padStart(8, '0')}`,
      name: `Monster ${index + 1}`,
      ...(index === 12 ? { kind: 'npc' as const, kindLabel: 'NPC' } : {}),
    }));
    renderLegend(entities);

    expect(
      within(screen.getByRole('tablist', { name: 'Map legend kinds' }))
        .getAllByRole('tab')
        .map((tab) => tab.textContent),
    ).toEqual(['All (13)', 'Monsters (12)', 'NPCs (1)']);
    expect(
      within(
        screen.getByRole('region', { name: 'Scrollable map legend' }),
      ).getAllByRole('checkbox'),
    ).toHaveLength(13);
  });

  it('keeps a dense single-kind legend tabless inside the scroll area', () => {
    const entities = Array.from({ length: 13 }, (_, index) => ({
      ...entity,
      focusKey: `monster-${String(index).padStart(8, '0')}`,
      name: `Monster ${index + 1}`,
    }));
    renderLegend(entities);

    expect(
      screen.queryByRole('tablist', { name: 'Map legend kinds' }),
    ).not.toBeInTheDocument();
    expect(
      within(
        screen.getByRole('region', { name: 'Scrollable map legend' }),
      ).getAllByRole('checkbox'),
    ).toHaveLength(13);
  });

  it('activates once without a modifier on a plain click', () => {
    const onActivate = renderLegend();
    const label = screen.getByText('Twin Sprout');
    fireEvent.click(label);
    expect(onActivate.mock.calls).toEqual([['monster-aaaaaaaa', false]]);
  });

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Cmd', { metaKey: true }],
  ])('activates once as modified on a %s-click on the label', (_, keys) => {
    const onActivate = renderLegend();
    const label = screen.getByText('Twin Sprout');
    fireEvent.click(label, keys);
    expect(onActivate.mock.calls).toEqual([['monster-aaaaaaaa', true]]);
  });

  it('activates as modified on Ctrl+Space without relying on the click modifier', () => {
    const onActivate = renderLegend();
    const input = screen.getByRole('checkbox', {
      name: 'Twin Sprout, Monster',
    });
    const keyDown = fireEvent.keyDown(input, { key: ' ', ctrlKey: true });
    expect(keyDown).toBe(false);
    expect(onActivate.mock.calls).toEqual([['monster-aaaaaaaa', true]]);
  });

  it('leaves a plain Space to the input click', () => {
    const onActivate = renderLegend();
    const input = screen.getByRole('checkbox', {
      name: 'Twin Sprout, Monster',
    });
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
