import { MantineProvider } from '@mantine/core';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import portalImage from '@/assets/maplestory/maps/minimap-portal.png?no-inline';
import { routeTree } from '@/routeTree.gen';

import { MapDetail } from '../MapDetail';
import {
  compareMapDetailMonsters,
  projectMapDetail,
  UNNAMED_MAP_LABEL,
  type MapDetailEntityView,
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

function ControlledMapDetail({
  view,
  initialFocus,
  onFocusChange,
}: {
  readonly view: MapDetailView;
  readonly initialFocus?: string | undefined;
  readonly onFocusChange?: ((focus: string | undefined) => void) | undefined;
}) {
  const [focusValue, setFocusValue] = useState(initialFocus);
  return (
    <MapDetail
      view={view}
      focusValue={focusValue}
      onFocusChange={(focus) => {
        setFocusValue(focus);
        onFocusChange?.(focus);
      }}
    />
  );
}

function renderControlledMapView({
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
        <ControlledMapDetail
          view={view}
          initialFocus={focusValue}
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
  it('uses the same stage panel for inline and Explore views', async () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const user = userEvent.setup();
    renderMapView({ view });

    expect(screen.getAllByTestId('map-detail-stage-panel')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Explore map' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'Practice Grove',
    });
    const explorePanel = within(dialog).getByTestId('map-detail-stage-panel');
    expect(
      within(explorePanel).getByRole('group', { name: 'Map legend' }),
    ).toBeInTheDocument();
    expect(
      within(explorePanel).getByRole('group', { name: 'Practice Grove map' }),
    ).toBeInTheDocument();
    expect(
      within(explorePanel).getByRole('combobox', { name: 'Find on this map' }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('map-detail-stage-panel')).toHaveLength(2);
  });

  it('filters find suggestions in entity order and limits them to ten', async () => {
    const baseView = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const entities: MapDetailEntityView[] = Array.from(
      { length: 12 },
      (_, index) => ({
        focusKey: `monster-${String(index).padStart(8, '0')}`,
        kind: 'monster',
        name: `Sprout ${String(index).padStart(2, '0')}`,
        kindLabel: 'Monster',
      }),
    );
    const view = { ...baseView, entities };
    const user = userEvent.setup();
    renderMapView({ view });

    const input = screen.getByRole('combobox', { name: 'Find on this map' });
    await user.type(input, 'SPROUT');

    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen
        .getAllByRole('option', { hidden: true })
        .map((option) => option.textContent),
    ).toEqual(
      entities
        .slice(0, 10)
        .map(({ name, kindLabel }) => `${name} — ${kindLabel}`),
    );
  });

  it('shows the no-match message without changing the selection', async () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const selected = view.entities.find(({ kind }) => kind === 'monster');
    if (selected === undefined) throw new Error('Expected a fixture Monster.');
    const onFocusChange = vi.fn();
    const user = userEvent.setup();
    renderControlledMapView({
      view,
      focusValue: selected.focusKey,
      onFocusChange,
    });

    await user.type(
      screen.getByRole('combobox', { name: 'Find on this map' }),
      'no map entity has this name',
    );

    expect(screen.getByText('Nothing was found.')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: `${selected.name}, ${selected.kindLabel}`,
      }),
    ).toBeChecked();
    expect(onFocusChange).not.toHaveBeenCalled();
  });

  it('selects a chosen find suggestion through the entity activation path', async () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const sprout = view.entities.find(({ name }) => name === 'Twin Sprout');
    if (sprout === undefined) throw new Error('Expected Twin Sprout.');
    const onFocusChange = vi.fn();
    const user = userEvent.setup();
    renderControlledMapView({ view, onFocusChange });

    const input = screen.getByRole('combobox', { name: 'Find on this map' });
    await user.type(input, 'sprout');
    fireEvent.click(
      screen.getByRole('option', {
        name: 'Twin Sprout — Monster',
        hidden: true,
      }),
    );

    expect(onFocusChange).toHaveBeenLastCalledWith(sprout.focusKey);
    expect(input).toHaveValue('sprout');
    expect(
      screen.getByRole('checkbox', {
        name: `${sprout.name}, ${sprout.kindLabel}`,
      }),
    ).toBeChecked();
  });

  it('toggles the narrow-screen find field with the search button', async () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const user = userEvent.setup();
    const { container } = renderMapView({ view });
    const shell = container.querySelector('[data-mobile-find-open]');
    if (shell === null) throw new Error('Expected the find toolbar.');

    expect(shell).toHaveAttribute('data-mobile-find-open', 'false');
    await user.click(screen.getByRole('button', { name: 'Search map' }));
    expect(shell).toHaveAttribute('data-mobile-find-open', 'true');
    expect(
      screen.getByRole('button', { name: 'Close map search' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close map search' }));
    expect(shell).toHaveAttribute('data-mobile-find-open', 'false');
  });

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

  it('toggles a whole kind from On this map and disables empty kinds', async () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'lantern-square' }),
      buildId: 'cw-launch',
    });
    const onFocusChange = vi.fn();
    const user = userEvent.setup();
    renderControlledMapView({ view, onFocusChange });

    const rail = screen.getByRole('region', { name: 'On this map' });
    const npcs = within(rail).getByRole('button', {
      name: /Highlight NPCs on map/u,
    });
    const monsters = within(rail).getByRole('button', {
      name: /Highlight Monsters on map/u,
    });

    expect(monsters).toBeDisabled();
    expect(monsters).toHaveAttribute('aria-pressed', 'false');
    expect(within(rail).queryByText('Spawns')).not.toBeInTheDocument();

    await user.click(npcs);
    expect(npcs).toHaveAttribute('aria-pressed', 'true');
    expect(onFocusChange).toHaveBeenLastCalledWith('npcs');

    await user.click(npcs);
    expect(npcs).toHaveAttribute('aria-pressed', 'false');
    expect(onFocusChange).toHaveBeenLastCalledWith(undefined);
  });

  it('shows partial counts with plus signs and unresolved counts as question marks', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const town = mapPageRecordFixture({ mapId: 'lantern-square' });
    const partialView = projectMapDetail({
      record: {
        ...record,
        connections: { state: 'partial', items: record.connections.items },
        monsters: { state: 'partial', items: record.monsters.items },
        npcs: { state: 'partial', items: town.npcs.items },
      },
      buildId: 'cw-launch',
    });
    const { unmount } = renderMapView({ view: partialView });
    const rail = screen.getByRole('region', { name: 'On this map' });
    expect(rail).toHaveTextContent('Connections1+');
    expect(rail).toHaveTextContent('Monsters4+');
    expect(rail).toHaveTextContent(
      `Spawns${partialView.monsters.totalSpawns}+`,
    );
    expect(rail).toHaveTextContent('NPCs8+');
    unmount();

    const unknownView = projectMapDetail({
      record: {
        ...record,
        connections: { state: 'unknown', items: [] },
        monsters: { state: 'unknown', items: [] },
        npcs: { state: 'unknown', items: [] },
      },
      buildId: 'cw-launch',
    });
    renderMapView({ view: unknownView });
    const unknownRail = screen.getByRole('region', { name: 'On this map' });
    expect(unknownRail).toHaveTextContent('Connections?');
    expect(unknownRail).toHaveTextContent('Monsters?');
    expect(unknownRail).toHaveTextContent('NPCs?');
    expect(unknownRail).not.toHaveTextContent('NPCs0');
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

  it('selects and clears a legend chip with the marker activation rule', async () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const monster = view.entities.find(({ name }) => name === 'Hollow Husk');
    if (monster === undefined) throw new Error('Expected Hollow Husk.');
    const onFocusChange = vi.fn();
    const user = userEvent.setup();
    renderControlledMapView({ view, onFocusChange });

    const chip = screen.getByRole('checkbox', {
      name: `${monster.name}, ${monster.kindLabel}`,
    });
    const legend = within(screen.getByRole('group', { name: 'Map legend' }));
    await user.click(legend.getByText(monster.name, { exact: true }));
    expect(chip).toBeChecked();
    expect(onFocusChange).toHaveBeenLastCalledWith(monster.focusKey);
    expect(
      screen
        .getByRole('group', { name: 'Practice Grove map' })
        .querySelectorAll('[data-selected="true"]'),
    ).toHaveLength(1);

    await user.click(legend.getByText(monster.name, { exact: true }));
    expect(chip).not.toBeChecked();
    expect(onFocusChange).toHaveBeenLastCalledWith(undefined);
    expect(
      screen
        .getByRole('group', { name: 'Practice Grove map' })
        .querySelectorAll('[data-selected="true"]'),
    ).toHaveLength(0);
  });

  it('replaces a multiple selection with a plain legend chip activation', async () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const [first, second] = view.entities.filter(
      ({ kind }) => kind === 'monster',
    );
    if (first === undefined || second === undefined) {
      throw new Error('Expected multiple fixture Monsters.');
    }
    const onFocusChange = vi.fn();
    const user = userEvent.setup();
    renderControlledMapView({
      view,
      focusValue: `${first.focusKey},${second.focusKey}`,
      onFocusChange,
    });

    const firstChip = screen.getByRole('checkbox', {
      name: `${first.name}, ${first.kindLabel}`,
    });
    const secondChip = screen.getByRole('checkbox', {
      name: `${second.name}, ${second.kindLabel}`,
    });

    await user.click(secondChip);
    expect(onFocusChange).toHaveBeenLastCalledWith(second.focusKey);
    expect(firstChip).not.toBeChecked();
    expect(secondChip).toBeChecked();
  });

  it('selects both markers for a warp legend chip', async () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const warp = view.entities.find(({ kind }) => kind === 'warp');
    if (warp === undefined) throw new Error('Expected a fixture Warp.');
    const onFocusChange = vi.fn();
    const user = userEvent.setup();
    renderControlledMapView({ view, onFocusChange });

    const legend = within(screen.getByRole('group', { name: 'Map legend' }));
    await user.click(legend.getByText(warp.name, { exact: true }));

    expect(onFocusChange).toHaveBeenLastCalledWith(warp.focusKey);
    expect(
      screen
        .getByRole('group', { name: 'Practice Grove map' })
        .querySelectorAll('[data-selected="true"]'),
    ).toHaveLength(2);
  });

  it('checks every chip in a focused whole kind', () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    renderMapView({ view, focusValue: 'monsters' });

    const monsterChips = view.entities.filter(({ kind }) => kind === 'monster');
    expect(monsterChips.length).toBeGreaterThan(1);
    for (const entity of monsterChips) {
      const chip = screen.getByRole('checkbox', {
        name: `${entity.name}, ${entity.kindLabel}`,
      });
      expect(chip).toBeChecked();
    }
    for (const entity of view.entities.filter(
      ({ kind }) => kind !== 'monster',
    )) {
      expect(
        screen.getByRole('checkbox', {
          name: `${entity.name}, ${entity.kindLabel}`,
        }),
      ).not.toBeChecked();
    }
  });

  it('shows four chips without tabs and tabs with kind counts above four', async () => {
    const baseView = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'practice-grove' }),
      buildId: 'cw-launch',
    });
    const fourEntityView = {
      ...baseView,
      entities: baseView.entities.slice(0, 4),
    };
    const fourChipRender = renderMapView({ view: fourEntityView });
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    fourChipRender.unmount();

    const connection = baseView.entities.find(
      ({ kind }) => kind === 'connection',
    );
    const warp = baseView.entities.find(({ kind }) => kind === 'warp');
    const monster = baseView.entities.find(({ kind }) => kind === 'monster');
    if (
      connection === undefined ||
      warp === undefined ||
      monster === undefined
    ) {
      throw new Error(
        'Expected fixture Connection, Warp, and Monster entities.',
      );
    }
    const fiveEntityView: MapDetailView = {
      ...baseView,
      entities: [
        connection,
        warp,
        monster,
        {
          focusKey: 'npc-00000001',
          kind: 'npc',
          name: 'Bellkeeper',
          kindLabel: 'NPC',
        },
        {
          focusKey: 'npc-00000002',
          kind: 'npc',
          name: 'Market Guide',
          kindLabel: 'NPC',
        },
      ],
    };
    const onFocusChange = vi.fn();
    const user = userEvent.setup();
    renderMapView({ view: fiveEntityView, onFocusChange });

    const tabList = screen.getByRole('tablist', { name: 'Map legend kinds' });
    expect(
      within(tabList)
        .getAllByRole('tab')
        .map((tab) => tab.textContent),
    ).toEqual([
      'All (5)',
      'Connections (1)',
      'Warps (1)',
      'Monsters (1)',
      'NPCs (2)',
    ]);
    expect(
      within(tabList).queryByRole('tab', { name: /Spawns/u }),
    ).not.toBeInTheDocument();
    await user.click(within(tabList).getByRole('tab', { name: 'NPCs (2)' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(onFocusChange).not.toHaveBeenCalled();
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

  it('searches Connections from seven and reports matches and no matches', async () => {
    const user = userEvent.setup();
    renderDetail('lantern-square');

    const search = screen.getByRole('textbox', {
      name: 'Search connected maps',
    });
    expect(screen.queryByText('Showing 7 of 7 connected maps')).toBeNull();
    await user.type(search, 'PRACTICE');
    expect(screen.getByText('Showing 1 of 7 connected maps')).toBeVisible();
    expect(screen.getAllByTestId('map-connection-card')).toHaveLength(1);
    expect(
      within(screen.getByTestId('map-connection-card')).getByRole('heading', {
        name: 'Practice Grove',
      }),
    ).toBeVisible();

    await user.clear(search);
    await user.type(search, 'no matching map');
    expect(screen.getByText('Showing 0 of 7 connected maps')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(
      'No connected maps match.',
    );
    expect(screen.queryByTestId('map-connection-card')).not.toBeInTheDocument();
  });

  it('omits the Connections search below seven cards', () => {
    const record = mapPageRecordFixture({ mapId: 'lantern-square' });
    renderDetail('lantern-square', false, {
      ...record.connections,
      items: record.connections.items.slice(0, 6),
    });

    expect(
      screen.queryByRole('textbox', { name: 'Search connected maps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Showing .* connected maps/u),
    ).not.toBeInTheDocument();
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

    const sproutCard = cards.find((card) =>
      card.textContent?.includes('Twin Sprout'),
    );
    if (sproutCard === undefined)
      throw new Error('Expected a Twin Sprout card.');
    expect(
      within(sproutCard).getByRole('button', {
        name: 'Locate 2 Twin Sprout spawns on map',
      }),
    ).toBeVisible();

    const bossCard = cards.find((card) =>
      card.textContent?.includes('Crowned Warden'),
    );
    if (bossCard === undefined) throw new Error('Expected a boss card.');
    expect(within(bossCard).getByText('Boss')).toBeVisible();
  });

  it('projects all three monster sort orders from seven and shows the control', () => {
    const view = projectMapDetail({
      record: mapPageRecordFixture({ mapId: 'synthetic-monster-yard' }),
      buildId: 'cw-launch',
    });
    const monsters = view.monsters.monsters;
    renderDetail('synthetic-monster-yard');
    const sort = screen.getByRole('combobox', { name: 'Sort monsters' });
    const readCardNames = () =>
      screen
        .getAllByTestId('map-monster-card')
        .map((card) => within(card).getByRole('heading').textContent);

    expect(sort).toHaveValue('Level: Low to high');
    expect(readCardNames()).toEqual([
      'Plain Pebble',
      'Twin Sprout',
      'Patchy Records',
      'Zero Yield Drone',
      'Hollow Husk',
      'Big Number Brute',
      'Crowned Warden',
    ]);

    expect(
      [...monsters]
        .sort((left, right) => compareMapDetailMonsters(left, right, 'spawns'))
        .map(({ name }) => name),
    ).toEqual([
      'Zero Yield Drone',
      'Hollow Husk',
      'Twin Sprout',
      'Crowned Warden',
      'Patchy Records',
      'Big Number Brute',
      'Plain Pebble',
    ]);
    expect(
      [...monsters]
        .sort((left, right) => compareMapDetailMonsters(left, right, 'name'))
        .map(({ name }) => name),
    ).toEqual([
      'Big Number Brute',
      'Crowned Warden',
      'Hollow Husk',
      'Patchy Records',
      'Plain Pebble',
      'Twin Sprout',
      'Zero Yield Drone',
    ]);
  });

  it('omits the monster sort below seven cards', () => {
    const record = mapPageRecordFixture({ mapId: 'synthetic-monster-yard' });
    renderDetail('synthetic-monster-yard', false, undefined, {
      ...record.monsters,
      items: record.monsters.items.slice(0, 6),
    });

    expect(
      screen.queryByRole('combobox', { name: 'Sort monsters' }),
    ).not.toBeInTheDocument();
  });

  it('keeps spawn counts as plain text when monsters have no stage positions', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({
      record: {
        ...record,
        monsters: {
          ...record.monsters,
          items: record.monsters.items.map((monster) => ({
            ...monster,
            points: { state: 'absent' as const, items: monster.points.items },
          })),
        },
      },
      buildId: 'cw-launch',
    });
    const sprout = view.monsters.monsters.find(
      ({ name }) => name === 'Twin Sprout',
    );
    if (sprout === undefined) throw new Error('Expected Twin Sprout.');
    expect(sprout.canLocate).toBe(false);
    expect(sprout.locateAccessibleName).toBe(
      'Locate 2 Twin Sprout spawns on map',
    );

    renderMapView({ view });

    const sproutCard = screen
      .getAllByTestId('map-monster-card')
      .find((card) => card.textContent?.includes('Twin Sprout'));
    if (sproutCard === undefined)
      throw new Error('Expected a Twin Sprout card.');
    expect(within(sproutCard).getByText('2 spawns')).toBeVisible();
    expect(within(sproutCard).queryByRole('button')).not.toBeInTheDocument();
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
