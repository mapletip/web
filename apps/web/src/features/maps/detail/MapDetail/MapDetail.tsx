import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Title,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  FactSheet,
  INTERACTIVE_MAP_MAX_ZOOM,
  INTERACTIVE_MAP_MIN_ZOOM,
  RecordSections,
  type RecordSection,
  type InteractiveMapView,
} from '@mapletip/component-library';
import { ArrowsOut, ShareNetwork } from '@phosphor-icons/react';
import { useHydrated, useLocation, useRouter } from '@tanstack/react-router';
import { useEffect, useState, type ReactElement } from 'react';
import { z } from 'zod';

import { DetailPageShell } from '@/components/DetailPageShell';
import { AnchorLink } from '@/components/RouterLinks';
import { DetailBreadcrumbs } from '@/features/detail';
import { MAP_DETAIL_ROUTE } from '@/features/maps/shared';
import { MONSTER_DETAIL_ROUTE } from '@/features/monsters/shared';
import { useRouteOverlay } from '@/features/route-overlay/useRouteOverlay';

import {
  activateMapDetailMarkers,
  activateMapDetailEntity,
  formatMapDetailFocus,
  mapDetailEntitiesForMarkers,
  mapDetailFocusMarkerIds,
  parseMapDetailFocus,
  resolveMapDetailFocus,
  selectMapDetailEntity,
  toggleMapDetailKind,
  type MapDetailFocus,
} from '../focus';
import { mapDetailOverlayOptions } from '../mapDetailOverlay';
import { mapDetailBreadcrumbs } from '../metadata';
import type { MapDetailEntityView, MapDetailView } from '../project';

import { ConnectionCardList } from './ConnectionCardList';
import classes from './MapDetail.module.css';
import { MapPanel } from './MapPanel';
import { EntityIcon } from './markers';
import { MonsterCardList } from './MonsterCardList';
import { NpcCardList } from './NpcCardList';
import { OnThisMapRail } from './OnThisMapRail';

const mapDetailStageViewSchema = z
  .object({
    zoom: z
      .number()
      .finite()
      .min(INTERACTIVE_MAP_MIN_ZOOM)
      .max(INTERACTIVE_MAP_MAX_ZOOM),
    centerX: z.number().finite(),
    centerY: z.number().finite(),
  })
  .strict();

export const mapDetailHistoryStateSchema = z
  .object({
    mapDetailStageView: mapDetailStageViewSchema.optional().catch(undefined),
    mapDetailFindText: z.string().optional().catch(undefined),
  })
  .catch({});

export interface MapDetailProps {
  readonly view: MapDetailView;
  readonly focusValue?: string | undefined;
  readonly onFocusChange?:
    ((focus: string | undefined) => void | Promise<void>) | undefined;
}

function EntityName({
  entity,
}: {
  readonly entity: MapDetailEntityView;
}): ReactElement | string {
  if (entity.link === undefined) return entity.name;
  if (entity.link.to === MONSTER_DETAIL_ROUTE) {
    return (
      <AnchorLink to={MONSTER_DETAIL_ROUTE} params={entity.link.params}>
        {entity.name}
      </AnchorLink>
    );
  }
  return (
    <AnchorLink to={MAP_DETAIL_ROUTE} params={entity.link.params}>
      {entity.name}
    </AnchorLink>
  );
}

function MarkerDetails({
  markerIds,
  view,
  onChoose,
}: {
  readonly markerIds: readonly string[];
  readonly view: MapDetailView;
  readonly onChoose: (focusKey: string) => void;
}): ReactElement | null {
  const entities = mapDetailEntitiesForMarkers({ markerIds, view });
  if (entities.length === 0) return null;
  const shared = entities.length > 1;

  return (
    <Stack role="group" aria-label="Marker details" gap="xs">
      {entities.map((entity) => {
        return (
          <Group key={entity.focusKey} gap="xs" wrap="nowrap">
            <EntityIcon entity={entity} />
            <Stack gap={0} style={{ flex: 1 }}>
              <Text size="sm" fw={600}>
                <EntityName entity={entity} />
              </Text>
              <Text size="xs" c="dimmed">
                {entity.kindLabel}
              </Text>
            </Stack>
            {shared ? (
              <Button
                type="button"
                size="compact-xs"
                variant="subtle"
                aria-label={`Select ${entity.name}`}
                onClick={() => onChoose(entity.focusKey)}
              >
                Select
              </Button>
            ) : null}
          </Group>
        );
      })}
    </Stack>
  );
}

/** Server-rendered identity and map information for one Map. */
export function MapDetail({
  view,
  focusValue,
  onFocusChange,
}: MapDetailProps): ReactElement {
  const theme = useMantineTheme();
  const interactive = useMediaQuery(
    `(min-width: ${theme.breakpoints.md})`,
    false,
  );
  const exploreFullScreen = !useMediaQuery(
    `(min-width: ${theme.breakpoints.sm})`,
    false,
  );
  const hydrated = useHydrated();
  const router = useRouter();
  // The history index survives the replace writes below but changes on push,
  // Back and Forward, so find text re-reads history only on entry changes.
  const historyIndex = useLocation({
    select: (location) => location.state.__TSR_index,
  });
  const locationState = useLocation({ select: (location) => location.state });
  const historyState = mapDetailHistoryStateSchema.parse(locationState);
  const stageView = hydrated ? historyState.mapDetailStageView : undefined;
  const [findState, setFindState] = useState(() => ({
    historyIndex,
    hydrated,
    value: hydrated ? (historyState.mapDetailFindText ?? '') : '',
  }));
  if (
    findState.historyIndex !== historyIndex ||
    findState.hydrated !== hydrated
  ) {
    setFindState({
      historyIndex,
      hydrated,
      value: hydrated ? (historyState.mapDetailFindText ?? '') : '',
    });
  }
  const findText = findState.value;
  const exploreOverlay = useRouteOverlay(mapDetailOverlayOptions);
  const exploreOverlayState =
    exploreOverlay.overlay?.type === 'explore'
      ? exploreOverlay.overlay
      : undefined;
  const exploreOpened = exploreOverlayState !== undefined;
  const parsedFocus = parseMapDetailFocus({ value: focusValue });
  const focus = resolveMapDetailFocus({ focus: parsedFocus, view });
  const canonicalFocus = formatMapDetailFocus({ focus });
  const selectedIds = mapDetailFocusMarkerIds({
    focus,
    markers: view.stage.markers,
  });

  const writeHistoryState = (updates: {
    readonly stageView?: InteractiveMapView | undefined;
    readonly findText?: string | undefined;
  }) => {
    void router.navigate({
      to: '.',
      search: true,
      hash: true,
      replace: true,
      resetScroll: false,
      hashScrollIntoView: false,
      state: (previous) => {
        const nextState = { ...previous } as Record<string, unknown>;
        if ('stageView' in updates) {
          if (updates.stageView === undefined) {
            delete nextState['mapDetailStageView'];
          } else {
            nextState['mapDetailStageView'] = updates.stageView;
          }
        }
        if ('findText' in updates) {
          if (updates.findText === undefined || updates.findText === '') {
            delete nextState['mapDetailFindText'];
          } else {
            nextState['mapDetailFindText'] = updates.findText;
          }
        }
        return nextState;
      },
    });
  };

  useEffect(() => {
    if (focusValue !== canonicalFocus) void onFocusChange?.(canonicalFocus);
  }, [canonicalFocus, focusValue, onFocusChange]);

  const writeFocus = (nextFocus: MapDetailFocus | undefined) => {
    const resolvedFocus = resolveMapDetailFocus({ focus: nextFocus, view });
    return onFocusChange?.(formatMapDetailFocus({ focus: resolvedFocus }));
  };
  const closeExplore = () => void exploreOverlay.release('explore');
  const activateEntity = (focusKey: string, modified = false) => {
    void writeFocus(
      activateMapDetailEntity({
        focus,
        focusKey,
        modified,
        view,
      }),
    );
  };
  const changeFindText = (nextFindText: string) => {
    setFindState((current) => ({ ...current, value: nextFindText }));
    writeHistoryState({ findText: nextFindText });
  };
  const locateMonster = async (focusKey: string) => {
    const nextFocus = selectMapDetailEntity({ focusKey, view });
    await writeFocus(nextFocus);
    exploreOverlay.open({ type: 'explore' });
  };
  const activateMarkers = (markerIds: readonly string[]) => {
    const activation = activateMapDetailMarkers({ focus, markerIds, view });
    if (activation !== undefined) void writeFocus(activation.focus);
  };
  const sections: RecordSection[] = [];
  if (
    view.connections.maps.length > 0 ||
    view.connections.notice !== undefined
  ) {
    sections.push({
      id: 'connections',
      title: 'Connections',
      icon: (
        <ShareNetwork size={16} color="var(--mantine-primary-color-filled)" />
      ),
      count: view.connections.count,
      content: <ConnectionCardList connections={view.connections} />,
    });
  }
  sections.push({
    id: 'monsters',
    title: 'Monsters',
    count: view.monsters.count,
    content: (
      <MonsterCardList
        monsters={view.monsters}
        onLocate={(focusKey) => {
          void locateMonster(focusKey);
        }}
      />
    ),
  });
  sections.push({
    id: 'npcs',
    title: 'NPCs',
    count: view.npcs.count,
    content: <NpcCardList npcs={view.npcs} />,
  });

  return (
    <DetailPageShell>
      <Stack gap="lg">
        <DetailBreadcrumbs
          items={mapDetailBreadcrumbs({ view, buildId: view.buildId })}
        />
        <div>
          <Title order={1}>{view.name}</Title>
          {view.subtitle === undefined ? null : (
            <Text c="dimmed">{view.subtitle}</Text>
          )}
        </div>
        <div className={classes['hero']}>
          <div className={classes['stageColumn']}>
            <div className={classes['stagePanelWithExplore']}>
              <MapPanel
                view={view}
                focus={focus}
                selectedIds={selectedIds}
                interactive={interactive}
                stageView={stageView}
                onViewChange={(nextView) =>
                  writeHistoryState({ stageView: nextView })
                }
                findText={findText}
                onFindTextChange={changeFindText}
                onActivate={activateEntity}
                onActivateMarkers={activateMarkers}
                renderDetails={(markerIds) => (
                  <MarkerDetails
                    markerIds={markerIds}
                    view={view}
                    onChoose={activateEntity}
                  />
                )}
              />
              <Tooltip label="Explore map" withArrow>
                <ActionIcon
                  aria-label="Explore map"
                  className={classes['exploreButton']}
                  size={32}
                  variant="white"
                  disabled={!hydrated}
                  onClick={() =>
                    exploreOverlay.open({
                      type: 'explore',
                    })
                  }
                >
                  <ArrowsOut size={20} aria-hidden="true" />
                </ActionIcon>
              </Tooltip>
            </div>
          </div>
          <Stack className={classes['informationColumn']} gap="lg">
            <OnThisMapRail
              rows={view.onThisMap}
              focus={focus}
              onToggle={(kind) =>
                void writeFocus(toggleMapDetailKind({ focus, kind, view }))
              }
            />
            {view.activity === undefined ? null : (
              <Text>Part of {view.activity}</Text>
            )}
            {view.description === undefined ? null : (
              <Text>{view.description}</Text>
            )}
            {view.facts.length === 0 ? null : (
              <Stack
                component="section"
                aria-labelledby="map-information-heading"
                gap="sm"
              >
                <Title id="map-information-heading" order={2}>
                  Map information
                </Title>
                <FactSheet
                  facts={view.facts.map((fact) => ({
                    label: fact.label,
                    explanation: fact.explanation,
                    value:
                      fact.destination === undefined ? (
                        fact.value
                      ) : (
                        <AnchorLink
                          to={fact.destination.to}
                          params={fact.destination.params}
                        >
                          {fact.value}
                        </AnchorLink>
                      ),
                  }))}
                />
              </Stack>
            )}
          </Stack>
        </div>
        <RecordSections sections={sections} />
      </Stack>
      <Modal
        classNames={{
          body: classes['exploreModalBody'],
          content: classes['exploreModalContent'],
        }}
        closeButtonProps={{ 'aria-label': 'Close map' }}
        fullScreen={exploreFullScreen}
        onClose={closeExplore}
        opened={exploreOpened}
        size={1120}
        title={view.name}
      >
        <MapPanel
          view={view}
          focus={focus}
          selectedIds={selectedIds}
          interactive
          wheelZoom
          expanded
          stageView={stageView}
          onViewChange={(nextView) =>
            writeHistoryState({ stageView: nextView })
          }
          findText={findText}
          onFindTextChange={changeFindText}
          onActivate={activateEntity}
          onActivateMarkers={activateMarkers}
          renderDetails={(markerIds) => (
            <MarkerDetails
              markerIds={markerIds}
              view={view}
              onChoose={activateEntity}
            />
          )}
        />
      </Modal>
    </DetailPageShell>
  );
}
