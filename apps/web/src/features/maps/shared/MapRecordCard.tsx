import { HoverCard, Image, Text, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  RecordCard,
  StaticMap,
  type InteractiveMapMarker,
} from '@mapletip/component-library';
import type { ReactElement } from 'react';

import { recordCardLinkRenderer } from '@/components/RouterLinks';

import classes from './MapRecordCard.module.css';
import { MonsterDot } from './MonsterDot';

export const MAP_RECORD_CARD_DENSITY = { base: 1, sm: 2 } as const;

export interface MapRecordCardFooterPart {
  readonly value: string;
  readonly label: string;
}

export interface MapRecordCardDestination {
  readonly href: string;
}

/** Display-ready values shared by map cards on detail pages. */
export interface MapRecordCardView {
  readonly key: string;
  readonly name: string;
  readonly secondaryLine?: string;
  readonly minimapUrl?: string;
  readonly minimapStage?: {
    readonly width: number;
    readonly height: number;
    readonly spawnPoints: readonly { readonly x: number; readonly y: number }[];
  };
  readonly minimapUnavailableLabel?: string;
  readonly footerParts: readonly MapRecordCardFooterPart[];
  readonly destination?: MapRecordCardDestination;
}

export interface MapRecordCardProps {
  readonly map: MapRecordCardView;
}

function renderFooterParts(
  parts: readonly MapRecordCardFooterPart[],
): ReactElement {
  return (
    <span className={classes['spawnCount']} data-testid="map-card-footer">
      {parts.map((part, index) => (
        <span key={`${part.value}:${part.label}`}>
          {index === 0 ? null : ' · '}
          <strong>{part.value}</strong> {part.label}
        </span>
      ))}
    </span>
  );
}

/** Map-specific card with the optional minimap hover preview. */
export function MapRecordCard({ map }: MapRecordCardProps): ReactElement {
  const theme = useMantineTheme();
  const canHoverMinimap = useMediaQuery(
    `(min-width: ${theme.breakpoints.sm}) and (hover: hover) and (pointer: fine)`,
    false,
  );
  const stage = map.minimapStage;
  const stageImage =
    map.minimapUrl !== undefined && stage !== undefined
      ? {
          src: map.minimapUrl,
          width: stage.width,
          height: stage.height,
          alt: `${map.name} minimap`,
        }
      : undefined;
  const expandedStageImage =
    stageImage === undefined
      ? undefined
      : { ...stageImage, alt: `${map.name} minimap enlarged` };
  const markers: readonly InteractiveMapMarker[] =
    stageImage === undefined || stage === undefined
      ? []
      : stage.spawnPoints.map(({ x, y }, index) => ({
          id: `${index}`,
          x,
          y,
          label: 'Spawn point',
          content: <MonsterDot />,
        }));

  let minimap: ReactElement | undefined;
  if (map.minimapUrl !== undefined) {
    minimap =
      stageImage === undefined ? (
        <div className={classes['minimapWell']} data-map-minimap="true">
          <Image
            src={map.minimapUrl}
            alt={`${map.name} minimap`}
            w="100%"
            h="100%"
            fit="contain"
            loading="lazy"
          />
        </div>
      ) : (
        <div className={classes['minimapFrame']} data-map-minimap="true">
          <StaticMap
            className={classes['locationMinimap']}
            image={stageImage}
            markers={markers}
            loading="lazy"
            unavailableMessage="Minimap unavailable"
          />
        </div>
      );
  } else if (map.minimapUnavailableLabel !== undefined) {
    minimap = (
      <div
        className={classes['minimapWell']}
        data-map-minimap="true"
        role="img"
        aria-label={map.minimapUnavailableLabel}
      >
        <Text className={classes['minimapUnavailable']} size="sm" c="dimmed">
          {map.minimapUnavailableLabel}
        </Text>
      </div>
    );
  }

  const media =
    minimap === undefined ||
    !canHoverMinimap ||
    map.minimapUrl === undefined ? (
      minimap
    ) : (
      <HoverCard
        openDelay={350}
        closeDelay={120}
        position="top"
        offset={8}
        withinPortal
        shadow="lg"
        role="tooltip"
      >
        <HoverCard.Target>
          <button
            type="button"
            className={classes['minimapTrigger']}
            aria-label={`Enlarge ${map.name} minimap`}
          >
            {minimap}
          </button>
        </HoverCard.Target>
        <HoverCard.Dropdown
          className={classes['minimapPopover']}
          aria-label={`${map.name} full-size minimap preview`}
        >
          {expandedStageImage === undefined ? (
            <Image
              src={map.minimapUrl}
              alt={`${map.name} minimap enlarged`}
              className={classes['expandedMinimap']}
            />
          ) : (
            <StaticMap
              className={classes['expandedStage']}
              image={expandedStageImage}
              markers={markers}
              loading="lazy"
              unavailableMessage="Minimap unavailable"
            />
          )}
        </HoverCard.Dropdown>
      </HoverCard>
    );

  const destination = map.destination;
  return (
    <RecordCard
      layout="mediaAside"
      title={map.name}
      secondaryLine={map.secondaryLine}
      media={media}
      footer={
        map.footerParts.length === 0
          ? undefined
          : renderFooterParts(map.footerParts)
      }
      {...(destination === undefined
        ? {}
        : {
            destination: { href: destination.href },
            renderLink: recordCardLinkRenderer,
          })}
    />
  );
}
