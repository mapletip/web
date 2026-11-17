import { MantineProvider } from '@mantine/core';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import portalImage from '@/assets/maplestory/maps/minimap-portal.png?no-inline';
import { routeTree } from '@/routeTree.gen';

import { MapDetail } from '../MapDetail';
import {
  projectMapDetail,
  UNNAMED_MAP_LABEL,
  type MapDetailView,
} from '../project';

import { mapPageRecordFixture } from './mapPageFixture';

function matchDesktopBreakpoint(): void {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('62'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

function renderMapView({
  view,
  focusValue,
  onFocusChange,
}: {
  readonly view: MapDetailView;
  readonly focusValue?: string | undefined;
  readonly onFocusChange?: ((focus: string | undefined) => void) | undefined;
}) {
  matchDesktopBreakpoint();
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [view.canonicalPath] }),
  });

  return render(
    <RouterContextProvider router={router}>
      <MantineProvider env="test">
        <MapDetail
          view={view}
          focusValue={focusValue}
          {...(onFocusChange === undefined ? {} : { onFocusChange })}
        />
      </MantineProvider>
    </RouterContextProvider>,
  );
}

function renderDetail(
  mapId: string,
  withoutInformation = false,
  connections?: ReturnType<typeof mapPageRecordFixture>['connections'],
  monsters?: ReturnType<typeof mapPageRecordFixture>['monsters'],
  npcs?: ReturnType<typeof mapPageRecordFixture>['npcs'],
) {
  const record = mapPageRecordFixture({ mapId });
  const projectedRecord = withoutInformation
    ? {
        ...record,
        activity: { state: 'unknown' as const },
        description: { state: 'absent' as const, coverageKey: 'description' },
        information: {
          ...record.information,
          returnMap: { state: 'unknown' as const },
        },
      }
    : record;
  const recordWithConnections =
    connections === undefined
      ? projectedRecord
      : { ...projectedRecord, connections };
  const projectedPage =
    monsters === undefined
      ? recordWithConnections
      : { ...recordWithConnections, monsters };
  const projectedMap =
    npcs === undefined ? projectedPage : { ...projectedPage, npcs };
  const view = projectMapDetail({
    record: projectedMap,
    buildId: 'cw-launch',
  });
  return renderMapView({ view });
}

describe('MapDetail information', () => {
  it('shows the map image and markers', () => {
    const { container } = renderDetail('practice-grove');

    expect(
      screen.getByRole('group', { name: 'Practice Grove map' }),
    ).toBeVisible();
    expect(
      screen.getByRole('img', { name: 'Practice Grove map' }),
    ).toBeVisible();
    expect(
      container.querySelectorAll('[data-marker-ids]').length,
    ).toBeGreaterThan(0);
  });

  it('rewrites unknown focus entities out of the address', () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const monster = view.monsters.monsters[0];
    if (monster === undefined) throw new Error('Expected a fixture Monster.');
    const onFocusChange = vi.fn();

    renderMapView({
      view,
      focusValue: `${monster.focusKey},npc-00000000`,
      onFocusChange,
    });

    expect(onFocusChange).toHaveBeenCalledWith(monster.focusKey);
  });

  it('selects and clears one marker entity and links its details to Monster Detail', async () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    const monster = view.monsters.monsters.find(
      ({ name }) => name === 'Hollow Husk',
    );
    if (monster?.destination === undefined) {
      throw new Error('Expected Hollow Husk to have a detail page.');
    }
    const marker = view.stage.markers.find(
      ({ focusKey }) => focusKey === monster.focusKey,
    );
    if (marker === undefined) throw new Error('Expected a Hollow Husk marker.');

    const onFocusChange = vi.fn();
    const user = userEvent.setup();
    const rendered = renderMapView({ view, onFocusChange });
    await user.click(screen.getByRole('button', { name: marker.label }));

    expect(onFocusChange).toHaveBeenCalledWith(monster.focusKey);
    const details = await screen.findByRole('group', {
      name: 'Marker details',
    });
    expect(
      details.querySelector('[data-marker-visual="monster-sprite"]'),
    ).toHaveAttribute(
      'src',
      view.entities.find(({ focusKey }) => focusKey === monster.focusKey)
        ?.spriteUrl,
    );
    expect(
      within(details).getByRole('link', {
        name: 'Hollow Husk',
        hidden: true,
      }),
    ).toHaveAttribute('href', monster.destination.href);

    rendered.unmount();
    onFocusChange.mockClear();
    renderMapView({
      view,
      focusValue: monster.focusKey,
      onFocusChange,
    });
    await user.click(screen.getByRole('button', { name: marker.label }));
    expect(onFocusChange).toHaveBeenCalledWith(undefined);
  });

  it('lets the player choose an entity at a shared position', async () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const twin = view.monsters.monsters.find(
      ({ name }) => name === 'Twin Sprout',
    );
    if (twin === undefined) throw new Error('Expected Twin Sprout.');
    const marker = view.stage.markers.find(
      ({ focusKey }) => focusKey === twin.focusKey,
    );
    if (marker === undefined) throw new Error('Expected a Twin Sprout marker.');
    const onFocusChange = vi.fn();
    const user = userEvent.setup();
    renderMapView({ view, onFocusChange });

    await user.click(
      screen.getByRole('button', { name: /Plain Pebble.*Twin Sprout/u }),
    );
    const details = await screen.findByRole('group', {
      name: 'Marker details',
    });
    fireEvent.click(
      within(details).getByRole('button', {
        name: 'Select Twin Sprout',
        hidden: true,
      }),
    );

    expect(onFocusChange).toHaveBeenCalledWith(twin.focusKey);
  });

  it('links connection marker details to the connected Map', async () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const connection = view.connections?.maps[0];
    if (connection?.destination === undefined) {
      throw new Error('Expected a linked Map connection.');
    }
    const marker = view.stage.markers.find(
      ({ focusKey }) => focusKey === connection.focusKey,
    );
    if (marker === undefined) throw new Error('Expected a connection marker.');
    const user = userEvent.setup();
    renderMapView({ view });

    await user.click(screen.getByRole('button', { name: marker.label }));

    const details = await screen.findByRole('group', {
      name: 'Marker details',
    });
    expect(
      details.querySelector('[data-marker-visual="connection"] img'),
    ).toHaveAttribute('src', portalImage);
    expect(
      within(details).getByRole('link', {
        name: connection.name,
        hidden: true,
      }),
    ).toHaveAttribute('href', connection.destination.href);
  });

  it('shows the no-image message in the stage box', () => {
    renderDetail('quiet-gallery');

    expect(
      screen.getByRole('group', {
        name: "Map image isn't available.",
      }),
    ).toBeVisible();
    expect(screen.getByText("Map image isn't available.")).toBeVisible();
    expect(
      screen.queryByText("Locations on this map aren't available yet."),
    ).not.toBeInTheDocument();
  });

  it('shows an image and the locations notice when positions are unavailable', () => {
    const { container } = renderDetail('stillwater-stage');

    expect(
      screen.getByRole('img', { name: 'Stillwater Stage map' }),
    ).toBeVisible();
    expect(
      screen.getByText("Locations on this map aren't available yet."),
    ).toBeVisible();
    expect(container.querySelectorAll('[data-marker-ids]')).toHaveLength(0);
  });

  it('omits activity, description, and an empty Map information block', () => {
    renderDetail('practice-grove', true);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Practice Grove' }),
    ).toBeVisible();
    expect(screen.queryByText(/^Part of /u)).not.toBeInTheDocument();
    expect(
      screen.queryByText('A gathering place beneath paper lanterns.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Map information' }),
    ).not.toBeInTheDocument();
  });

  it('shows activity, description, and known map information', () => {
    renderDetail('lantern-square');

    expect(screen.getByText('Part of Market')).toBeVisible();
    expect(
      screen.getByText('A gathering place beneath paper lanterns.'),
    ).toBeVisible();

    const information = screen.getByRole('region', {
      name: 'Map information',
    });
    expect(within(information).getByText('Floral Life')).toBeVisible();
    expect(within(information).getByText('10 min')).toBeVisible();
    expect(within(information).getByText('Allowed')).toBeVisible();
    expect(
      within(information).getByRole('link', { name: 'Practice Grove' }),
    ).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/maplestory\/maps\/practice-grove-/u),
    );
    expect(within(information).queryByText('Flying')).not.toBeInTheDocument();
  });

  it('omits known empty Connections while retaining the Monsters section', () => {
    renderDetail('practice-grove', false, { state: 'absent', items: [] });

    expect(
      screen.getByRole('navigation', { name: 'Record sections' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: /Connections/u }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Monsters (4)' })).toBeVisible();
  });

  it('omits Connections for a known zero count while keeping Monsters', () => {
    renderDetail('practice-grove', false, { state: 'known', items: [] });

    expect(
      screen.getByRole('navigation', { name: 'Record sections' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: /Connections/u }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Monsters (4)' })).toBeVisible();
  });

  it('shows an unavailable message and unknown count for unresolved connections', () => {
    renderDetail('practice-grove', false, { state: 'unknown', items: [] });

    expect(
      within(
        screen.getByRole('navigation', { name: 'Record sections' }),
      ).getByRole('link', { name: 'Connections (?)' }),
    ).toHaveAttribute('href', '#connections');
    expect(
      screen.getByRole('heading', { name: 'Connections (?)' }),
    ).toBeVisible();
    expect(
      screen.getByText('Connection information is unavailable.'),
    ).toBeVisible();
  });

  it('links connection cards to their same-build Map Detail address', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const connected = record.connections.items[0];
    if (connected === undefined)
      throw new Error('Expected fixture connection.');
    renderDetail('practice-grove', false, {
      state: 'known',
      items: [
        {
          ...connected,
          name: { state: 'unknown' },
          minimap: {
            state: 'absent',
            coverageKey: 'fixture:connection-minimap',
          },
        },
      ],
    });

    const card = screen.getByTestId('map-connection-card');
    expect(
      within(card).getByRole('heading', { name: UNNAMED_MAP_LABEL }),
    ).toBeVisible();
    expect(
      within(card).getByRole('img', { name: 'Minimap unavailable' }),
    ).toBeVisible();
    expect(within(card).getByRole('link')).toHaveAttribute(
      'href',
      `/maplestory/maps/${connected.slug}-${connected.publicId}`,
    );
  });

  it('shows a monster summary, card facts, boss badge, and Monster Detail link', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const plainPebble = record.monsters.items.find(
      ({ name }) => name.state === 'known' && name.value === 'Plain Pebble',
    );
    if (plainPebble === undefined) {
      throw new Error('Expected Plain Pebble in the fixture map.');
    }
    renderDetail('practice-grove');

    expect(screen.getByText('4 monster types, 5 total spawns')).toBeVisible();
    const cards = screen.getAllByTestId('map-monster-card');
    const pebbleCard = cards.find((card) =>
      card.textContent?.includes('Plain Pebble'),
    );
    if (pebbleCard === undefined)
      throw new Error('Expected a Plain Pebble card.');
    expect(within(pebbleCard).getByText('Lv 1')).toBeVisible();
    expect(within(pebbleCard).getByText('1 spawn')).toBeVisible();
    expect(within(pebbleCard).getByText('No respawn')).toBeVisible();
    expect(within(pebbleCard).getByRole('link')).toHaveAttribute(
      'href',
      `/maplestory/monsters/plain-pebble-${plainPebble.publicId}`,
    );

    const bossCard = cards.find((card) =>
      card.textContent?.includes('Crowned Warden'),
    );
    if (bossCard === undefined) throw new Error('Expected a boss card.');
    expect(within(bossCard).getByText('Boss')).toBeVisible();
  });

  it('shows the known-empty monster message and zero count', () => {
    renderDetail('practice-grove', false, undefined, {
      state: 'known',
      items: [],
    });

    expect(screen.getByRole('link', { name: 'Monsters (0)' })).toHaveAttribute(
      'href',
      '#monsters',
    );
    expect(
      screen.getByText('No monsters are recorded on this map.'),
    ).toBeVisible();
    expect(screen.queryByText(/total spawn/u)).not.toBeInTheDocument();
  });

  it('shows unavailable and partial Monster collection states', () => {
    renderDetail('practice-grove', false, undefined, {
      state: 'unknown',
      items: [],
    });

    expect(screen.getByRole('link', { name: 'Monsters (?)' })).toHaveAttribute(
      'href',
      '#monsters',
    );
    expect(
      screen.getByText('Monster information is unavailable.'),
    ).toBeVisible();
  });

  it('shows a note when Monster information is partial', () => {
    renderDetail('practice-grove', false, undefined, {
      state: 'partial',
      items: [],
    });

    expect(screen.getByRole('heading', { name: 'Monsters (0)' })).toBeVisible();
    expect(
      screen.getByText('Some monster information may be missing.'),
    ).toBeVisible();
  });

  it('shows each NPC collection notice and its section count', () => {
    renderDetail('practice-grove', false, undefined, undefined, {
      state: 'unknown',
      items: [],
    });

    expect(screen.getByRole('link', { name: 'NPCs (?)' })).toHaveAttribute(
      'href',
      '#npcs',
    );
    expect(screen.getByRole('heading', { name: 'NPCs (?)' })).toBeVisible();
    expect(screen.getByText('NPC information is unavailable.')).toBeVisible();
  });

  it('shows the partial NPC information notice', () => {
    renderDetail('practice-grove', false, undefined, undefined, {
      state: 'partial',
      items: [],
    });

    expect(screen.getByRole('heading', { name: 'NPCs (0)' })).toBeVisible();
    expect(
      screen.getByText('Some NPC information may be missing.'),
    ).toBeVisible();
  });

  it('shows the known-empty NPC notice', () => {
    renderDetail('practice-grove', false, undefined, undefined, {
      state: 'known',
      items: [],
    });

    expect(screen.getByRole('heading', { name: 'NPCs (0)' })).toBeVisible();
    expect(screen.getByText('No NPCs are recorded on this map.')).toBeVisible();
  });

  it('shows NPC cards as plain text with the standard missing-image placeholder', () => {
    const record = mapPageRecordFixture({ mapId: 'lantern-square' });
    const bellkeeper = record.npcs.items.find(
      ({ name }) => name.state === 'known' && name.value === 'Bellkeeper',
    );
    if (bellkeeper === undefined) throw new Error('Expected Bellkeeper.');
    renderDetail('lantern-square', false, undefined, undefined, {
      state: 'known',
      items: [bellkeeper],
    });

    const card = screen.getByTestId('map-npc-card');
    expect(
      within(card).getByRole('heading', { name: 'Bellkeeper' }),
    ).toBeVisible();
    expect(within(card).queryByRole('link')).not.toBeInTheDocument();
    expect(card.querySelector('img[data-fallback="true"]')).not.toBeNull();
  });
});
