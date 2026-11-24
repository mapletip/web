import { Image, Modal, Popover, Text, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  RecordCard,
  StaticMap,
  type InteractiveMapMarker,
} from '@mapletip/component-library';
import { useState, type ReactElement } from 'react';

import { recordCardLinkRenderer } from '@/components/RouterLinks';

import classes from './MapRecordCard.module.css';
import { minimapSpriteSize } from './minimapSpriteSize';
import { MonsterDot } from './MonsterDot';
import { SpriteMarker } from './SpriteMarker';

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
  /** Muted line under the secondary line, such as a reviewed activity. */
  readonly activityLine?: string;
  /** Emphasized footer line, such as the inhabitants a filter selected. */
  readonly highlightLine?: string;
  readonly minimapUrl?: string;
  readonly minimapSprite?: {
    readonly url: string;
    readonly width: number;
    readonly height: number;
  };
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
          <strong>{part.value}</strong>
          {part.label === '' ? null : ` ${part.label}`}
        </span>
      ))}
    </span>
  );
}

/** Map-specific card with an optional enlarged minimap. */
export function MapRecordCard({ map }: MapRecordCardProps): ReactElement {
  const theme = useMantineTheme();
  const isDesktop = useMediaQuery(
    `(min-width: ${theme.breakpoints.sm})`,
    false,
  );
  const [opened, setOpened] = useState(false);
  const minimapSprite = map.minimapSprite;
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
  const mapSpawnPoints = ({
    useSprite,
  }: {
    readonly useSprite: boolean;
  }): readonly InteractiveMapMarker[] => {
    if (stageImage === undefined || stage === undefined) return [];

    return stage.spawnPoints.map(({ x, y }, index): InteractiveMapMarker => {
      const marker = {
        id: `${index}`,
        x,
        y,
        label: 'Spawn point',
      };
      if (useSprite && minimapSprite !== undefined) {
        return {
          ...marker,
          size: minimapSpriteSize(minimapSprite),
          anchor: 'bottom',
          content: (
            <SpriteMarker
              spriteUrl={minimapSprite.url}
              visual="monster-sprite"
              className={classes['minimapSprite']}
            />
          ),
        };
      }

      return { ...marker, content: <MonsterDot /> };
    });
  };
  const markers = mapSpawnPoints({ useSprite: false });
  const expandedMarkers = mapSpawnPoints({ useSprite: true });

  const expandedMap =
    expandedStageImage === undefined ? (
      <Image
        src={map.minimapUrl}
        alt={`${map.name} minimap enlarged`}
        className={classes['expandedMinimap']}
      />
    ) : (
      <StaticMap
        className={classes['expandedStage']}
        image={expandedStageImage}
        markers={expandedMarkers}
        selectedIds={expandedMarkers.map(({ id }) => id)}
        loading="lazy"
        unavailableMessage="Minimap unavailable"
      />
    );

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

  const trigger =
    minimap === undefined || map.minimapUrl === undefined ? null : (
      <button
        type="button"
        className={classes['minimapTrigger']}
        aria-label={`Enlarge ${map.name} minimap`}
        onClick={() => setOpened((value) => !value)}
      >
        {minimap}
      </button>
    );

  let media: ReactElement | undefined;
  if (trigger === null) {
    media = minimap;
  } else if (isDesktop) {
    media = (
      <Popover
        opened={opened}
        onChange={setOpened}
        position="top"
        offset={8}
        withinPortal
        trapFocus
        returnFocus
        shadow="lg"
      >
        <Popover.Target>{trigger}</Popover.Target>
        <Popover.Dropdown
          className={classes['minimapPopover']}
          aria-labelledby=""
          aria-label={map.name}
        >
          {expandedMap}
        </Popover.Dropdown>
      </Popover>
    );
  } else {
    media = (
      <>
        {trigger}
        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title={map.name}
          size="40rem"
          classNames={{ body: classes['minimapModalBody'] }}
          closeButtonProps={{ 'aria-label': 'Close enlarged minimap' }}
        >
          {expandedMap}
        </Modal>
      </>
    );
  }

  const destination = map.destination;
  const secondaryLine =
    map.activityLine === undefined ? (
      map.secondaryLine
    ) : (
      <>
        {map.secondaryLine === undefined ? null : (
          <span className={classes['line']}>{map.secondaryLine}</span>
        )}
        <span className={classes['line']} data-testid="map-card-activity">
          {map.activityLine}
        </span>
      </>
    );
  const footerParts =
    map.footerParts.length === 0
      ? undefined
      : renderFooterParts(map.footerParts);
  const footer =
    map.highlightLine === undefined ? (
      footerParts
    ) : (
      <>
        <Text size="sm" fw={600} data-testid="map-card-highlight">
          {map.highlightLine}
        </Text>
        {footerParts}
      </>
    );
  return (
    <RecordCard
      layout="mediaAside"
      title={map.name}
      secondaryLine={secondaryLine}
      media={media}
      footer={footer}
      {...(destination === undefined
        ? {}
        : {
            destination: { href: destination.href },
            renderLink: recordCardLinkRenderer,
          })}
    />
  );
}
