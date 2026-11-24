import { MantineProvider } from '@mantine/core';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { routeTree } from '@/routeTree.gen';

import { LocationCardList } from '../LocationCardList';
import type {
  MonsterDetailLocationMapView,
  MonsterDetailLocationsView,
} from '../project';

function map(index: number): MonsterDetailLocationMapView {
  return {
    key: `fixture:map:${index}`,
    name: `Practice Map ${String(index).padStart(2, '0')}`,
    secondaryLine: `Practice Street ${index}`,
    ...(index === 1 ? { minimapUrl: '/synthetic-minimap.png' } : {}),
    ...(index === 1
      ? { destination: { href: '/maplestory/maps/practice-map-01-abc12345' } }
      : {}),
    footerParts: [
      {
        value: index.toLocaleString('en-US'),
        label: index === 1 ? 'spawn' : 'spawns',
      },
    ],
    placementCount: index,
  };
}

function present(count = 12): MonsterDetailLocationsView {
  return {
    state: 'present',
    count,
    maps: Array.from({ length: count }, (_, index) => map(index + 1)),
  };
}

function StatefulLocations({
  locations,
}: {
  readonly locations: MonsterDetailLocationsView;
}) {
  const [drawerOpened, setDrawerOpened] = useState(false);
  return (
    <LocationCardList
      locations={locations}
      monsterName="Practice Shellback"
      monsterSpriteUrl="/synthetic-monster.png"
      drawerOpened={drawerOpened}
      onDrawerOpen={() => setDrawerOpened(true)}
      onDrawerClose={() => setDrawerOpened(false)}
    />
  );
}

function mount(locations: MonsterDetailLocationsView) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/maplestory/monsters'] }),
  });
  const renderLocations = (nextLocations: MonsterDetailLocationsView) => (
    <RouterContextProvider router={router}>
      <MantineProvider>
        <StatefulLocations locations={nextLocations} />
      </MantineProvider>
    </RouterContextProvider>
  );
  const result = render(renderLocations(locations));
  return {
    ...result,
    rerenderLocations: (nextLocations: MonsterDetailLocationsView) =>
      result.rerender(renderLocations(nextLocations)),
  };
}

describe('LocationCardList', () => {
  it('shows honest absent and unavailable states', () => {
    const { rerenderLocations } = mount({ state: 'no-locations', count: 0 });
    expect(
      screen.getByText('No locations are listed for this monster.'),
    ).toBeVisible();

    rerenderLocations({ state: 'unavailable', count: 'unknown' });
    expect(
      screen.getByText('Location information is unavailable.'),
    ).toBeVisible();
  });

  it('searches and sorts the whole list and opens all maps in a drawer', async () => {
    const user = userEvent.setup();
    mount(present());

    const cards = screen.getAllByTestId('monster-location-card');
    expect(cards).toHaveLength(10);
    expect(within(cards[0]!).queryByRole('link')).toBeNull();
    expect(
      within(cards[0]!).getByRole('heading', { name: 'Practice Map 12' }),
    ).toBeVisible();
    const expandButtons = screen.getAllByRole('button', {
      name: 'View all 12 maps',
    });
    expect(expandButtons.length).toBe(2);
    const firstSpawnCount = screen.getAllByTestId('map-card-footer')[0]!;
    expect(firstSpawnCount).toBeVisible();
    expect(firstSpawnCount).toHaveTextContent('12 spawns');

    const search = screen.getByRole('textbox', { name: 'Find a map' });
    await user.type(search, 'Map 01');
    expect(screen.getAllByTestId('monster-location-card')).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: /Practice Map 01/u }),
    ).toHaveAttribute('href', '/maplestory/maps/practice-map-01-abc12345');
    expect(
      screen.getByRole('heading', { name: 'Practice Map 01' }),
    ).toBeVisible();
    await user.clear(search);

    const trigger = screen.getAllByRole('button', {
      name: 'View all 12 maps',
    })[0]!;
    await user.click(trigger);
    await screen.findByRole('dialog', { name: /^All maps/u });
    const drawer = screen.getByRole('dialog');
    await waitFor(() => expect(drawer).toBeVisible());
    const drawerCards = within(drawer).getAllByTestId('monster-location-card');
    expect(drawerCards).toHaveLength(12);
    expect(
      within(drawer).getByRole('img', { name: 'Practice Map 01 minimap' }),
    ).toBeVisible();

    const searchIds = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[id$="-map-search"]'),
      (input) => input.id,
    );
    expect(searchIds).toHaveLength(2);
    expect(new Set(searchIds).size).toBe(2);
    const controlInputIds = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        '[data-location-controls] input',
      ),
      (input) => input.id,
    );
    expect(controlInputIds).toHaveLength(6);
    expect(new Set(controlInputIds).size).toBe(6);

    const drawerSort = within(drawer).getByRole('radio', { name: 'Map name' });
    await user.click(drawerSort);
    const sortedDrawerCards = within(drawer).getAllByTestId(
      'monster-location-card',
    );
    expect(
      within(sortedDrawerCards[0]!).getByRole('heading', {
        name: 'Practice Map 01',
      }),
    ).toBeVisible();
    expect(screen.getAllByRole('radio', { name: 'Map name' })[0]).toBeChecked();
    expect(
      within(screen.getAllByTestId('monster-location-card')[0]!).getByRole(
        'heading',
        { name: 'Practice Map 01' },
      ),
    ).toBeVisible();

    const drawerSearch = within(drawer).getByRole('textbox', {
      name: 'Find a map',
    });
    await user.type(drawerSearch, 'Practice Map 12');
    expect(screen.getByRole('dialog', { name: /^All maps/u })).toBeVisible();
    expect(
      screen.getAllByRole('textbox', { name: 'Find a map' })[0],
    ).toHaveValue('Practice Map 12');
    expect(screen.getAllByTestId('monster-location-card')).toHaveLength(2);
    expect(
      within(drawer).getByRole('heading', { name: 'Practice Map 12' }),
    ).toBeVisible();
    await user.clear(drawerSearch);
    await user.type(drawerSearch, 'not on this list');
    expect(within(drawer).getByRole('status')).toHaveTextContent(
      'No maps match your search.',
    );
    expect(
      within(drawer).queryAllByTestId('monster-location-card'),
    ).toHaveLength(0);
    await user.clear(drawerSearch);
    expect(within(drawer).getAllByTestId('monster-location-card')).toHaveLength(
      12,
    );

    expect(
      screen.queryByText(/per (?:hour|minute)|(?:spawn )?rate/iu),
    ).toBeNull();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /^All maps/u })).toBeNull(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(
      within(screen.getAllByTestId('monster-location-card')[0]!).getByRole(
        'heading',
        { name: 'Practice Map 01' },
      ),
    ).toBeVisible();
  }, 10_000);

  it('omits search and sort controls for three maps or fewer and reports an empty search', async () => {
    const user = userEvent.setup();
    const { rerenderLocations } = mount(present(3));

    expect(screen.queryByRole('textbox', { name: 'Find a map' })).toBeNull();
    expect(
      screen.queryByRole('radiogroup', { name: 'Order locations' }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: /View all/u })).toBeNull();

    rerenderLocations(present(4));
    const search = screen.getByRole('textbox', { name: 'Find a map' });
    await user.type(search, 'not on this list');
    expect(screen.getByRole('status')).toHaveTextContent(
      'No maps match your search.',
    );
    expect(screen.queryAllByTestId('monster-location-card')).toHaveLength(0);

    rerenderLocations(present(3));
    expect(screen.queryByRole('textbox', { name: 'Find a map' })).toBeNull();
  });
});
