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
  RecordSections,
  type RecordSection,
  type MarkerStageView,
} from '@mapletip/component-library';
import { ArrowsOut, ShareNetwork } from '@phosphor-icons/react';
import { useHydrated, useLocation, useRouter } from '@tanstack/react-router';
import { useEffect, type ReactElement } from 'react';
import { z } from 'zod';

import { DetailPageShell } from '@/components/DetailPageShell';
import { AnchorLink } from '@/components/RouterLinks';
import { DetailBreadcrumbs } from '@/features/detail';
import { MAP_DETAIL_ROUTE } from '@/features/maps/shared';
import { MONSTER_DETAIL_ROUTE } from '@/features/monsters/shared';
import { useRouteOverlay } from '@/features/route-overlay/useRouteOverlay';

import {
  activateMapDetailEntity,
  formatMapDetailFocus,
  mapDetailFocusMarkerIds,
  parseMapDetailFocus,
  resolveMapDetailFocus,
  type MapDetailFocus,
} from '../focus';
import { mapDetailOverlayOptions } from '../mapDetailOverlay';
import { mapDetailBreadcrumbs } from '../metadata';
import type { MapDetailEntityView, MapDetailView } from '../project';

import classes from './MapDetail.module.css';
import { MapDetailConnections } from './MapDetailConnections';
import { MapDetailMonsters } from './MapDetailMonsters';
import { MapDetailNpcs } from './MapDetailNpcs';
import { MapDetailOnThisMap } from './MapDetailOnThisMap';
import { MapDetailStagePanel } from './MapDetailStagePanel';
import { EntityIcon } from './markers';

const mapDetailStageViewSchema = z
  .object({
    zoom: z.number().finite().min(0.5).max(8),
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
  readonly onFocusChange?: ((focus: string | undefined) => void) | undefined;
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
  const entitiesByFocusKey = new Map(
    view.entities.map((entity) => [entity.focusKey, entity]),
  );
  const markersById = new Map(
    view.stage.markers.map((marker) => [marker.id, marker]),
  );
  const entityKeys = new Set<string>();
  const entities: MapDetailEntityView[] = [];
  for (const markerId of markerIds) {
    const marker = markersById.get(markerId);
    if (marker === undefined) continue;
    const entity = entitiesByFocusKey.get(marker.focusKey);
    if (entity !== undefined && !entityKeys.has(entity.focusKey)) {
      entityKeys.add(entity.focusKey);
      entities.push(entity);
    }
  }
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
  const exploreFullScreen = !useMediaQuery('(min-width: 48rem)', false);
  const hydrated = useHydrated();
  const router = useRouter();
  const locationState = useLocation({ select: (location) => location.state });
  const historyState = mapDetailHistoryStateSchema.parse(locationState);
  const stageView = hydrated ? historyState.mapDetailStageView : undefined;
  const findText = hydrated ? (historyState.mapDetailFindText ?? '') : '';
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
    readonly stageView?: MarkerStageView | undefined;
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
    if (focusValue !== canonicalFocus) onFocusChange?.(canonicalFocus);
  }, [canonicalFocus, focusValue, onFocusChange]);

  const writeFocus = (nextFocus: MapDetailFocus | undefined) => {
    const resolvedFocus = resolveMapDetailFocus({ focus: nextFocus, view });
    onFocusChange?.(formatMapDetailFocus({ focus: resolvedFocus }));
  };
  const closeExplore = () => {
    if (exploreOverlayState === undefined) return;
    if (canonicalFocus === exploreOverlayState.openedFocus) {
      exploreOverlay.dismiss('explore');
    } else {
      void exploreOverlay.release('explore');
    }
  };
  const activateEntity = (focusKey: string, modified = false) => {
    writeFocus(activateMapDetailEntity({ focus, focusKey, modified, view }));
  };
  const markerFocusKeys = new Map(
    view.stage.markers.map((marker) => [marker.id, marker.focusKey]),
  );
  const activateMarkers = (markerIds: readonly string[]) => {
    const keys = new Set(
      markerIds.flatMap((id) => {
        const key = markerFocusKeys.get(id);
        return key === undefined ? [] : [key];
      }),
    );
    if (keys.size === 1) activateEntity([...keys][0]!);
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
      content: <MapDetailConnections connections={view.connections} />,
    });
  }
  sections.push({
    id: 'monsters',
    title: 'Monsters',
    count: view.monsters.count,
    content: <MapDetailMonsters monsters={view.monsters} />,
  });
  sections.push({
    id: 'npcs',
    title: 'NPCs',
    count: view.npcs.count,
    content: <MapDetailNpcs npcs={view.npcs} />,
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
              <MapDetailStagePanel
                view={view}
                focus={focus}
                selectedIds={selectedIds}
                interactive={interactive}
                stageView={stageView}
                onViewChange={(nextView) =>
                  writeHistoryState({ stageView: nextView })
                }
                findText={findText}
                onFindTextChange={(nextFindText) =>
                  writeHistoryState({ findText: nextFindText })
                }
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
                  onClick={() =>
                    exploreOverlay.open({
                      type: 'explore',
                      openedFocus: canonicalFocus,
                    })
                  }
                >
                  <ArrowsOut size={20} aria-hidden="true" />
                </ActionIcon>
              </Tooltip>
            </div>
          </div>
          <Stack className={classes['informationColumn']} gap="lg">
            <MapDetailOnThisMap
              rows={view.onThisMap}
              focus={focus}
              onToggle={(kind) =>
                writeFocus(
                  focus !== undefined && 'kind' in focus && focus.kind === kind
                    ? undefined
                    : { kind },
                )
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
                          to={MAP_DETAIL_ROUTE}
                          params={fact.destination}
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
        <MapDetailStagePanel
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
          onFindTextChange={(nextFindText) =>
            writeHistoryState({ findText: nextFindText })
          }
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
