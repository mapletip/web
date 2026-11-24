import { Image, Modal, Popover, Text, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  EntityChip,
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

/** A figure in the footer's text line, such as "2 monsters". */
export interface MapRecordCardFooterFigure {
  readonly value: string;
  readonly label: string;
}

/** A monster or NPC on the map, shown as a chip with an optional count. */
export interface MapRecordCardFooterEntity {
  readonly entity: {
    readonly name: string;
    readonly iconUrl?: string;
    /** Spawn points it has on the map, shown before the chip as "15×". */
    readonly count?: number;
  };
}

export type MapRecordCardFooterPart =
  MapRecordCardFooterFigure | MapRecordCardFooterEntity;

const CHIP_ICON_SIZE = 20;

function isEntity(
  part: MapRecordCardFooterPart,
): part is MapRecordCardFooterEntity {
  return 'entity' in part;
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
  readonly minimapSprite?: {
    readonly url: string;
    readonly width: number;
    readonly height: number;
  };
  readonly minimapStage?: {
    readonly width: number;
    readonly height: number;
    /** Stage pixels per game pixel; without it, spawns are drawn as dots. */
    readonly scale?: number;
    readonly spawnPoints: readonly { readonly x: number; readonly y: number }[];
  };
  readonly minimapUnavailableLabel?: string;
  /**
   * Whether clicking the minimap opens a larger view (default). When false
   * the minimap is part of the card's link, like the rest of the card.
   */
  readonly minimapPreview?: boolean;
  readonly footerParts: readonly MapRecordCardFooterPart[];
  readonly destination?: MapRecordCardDestination;
}

export interface MapRecordCardProps {
  readonly map: MapRecordCardView;
}

function renderFooterParts(
  parts: readonly MapRecordCardFooterPart[],
): ReactElement {
  const entities = parts.filter(isEntity);
  const figures = parts.filter(
    (part): part is MapRecordCardFooterFigure => !isEntity(part),
  );
  return (
    <span className={classes['footer']} data-testid="map-card-footer">
      {entities.map(({ entity }) => {
        const chip = (
          <EntityChip
            name={entity.name}
            iconSrc={entity.iconUrl}
            iconSize={CHIP_ICON_SIZE}
          />
        );
        return entity.count === undefined ? (
          <span key={entity.name}>{chip}</span>
        ) : (
          <span key={entity.name} className={classes['countedChip']}>
            <strong className={classes['chipCount']}>
              {entity.count.toLocaleString('en-US')}×
            </strong>
            {chip}
          </span>
        );
      })}
      {figures.length === 0 ? null : (
        <span className={classes['spawnCount']}>
          {figures.map((part, index) => (
            <span key={`${part.value}:${part.label}`}>
              {index === 0 ? null : ' · '}
              <strong>{part.value}</strong>
              {part.label === '' ? null : ` ${part.label}`}
            </span>
          ))}
        </span>
      )}
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
      if (
        useSprite &&
        minimapSprite !== undefined &&
        stage.scale !== undefined
      ) {
        return {
          ...marker,
          size: minimapSpriteSize({ ...minimapSprite, scale: stage.scale }),
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
    minimap === undefined ||
    map.minimapUrl === undefined ||
    map.minimapPreview === false ? null : (
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
  const footer =
    map.footerParts.length === 0
      ? undefined
      : renderFooterParts(map.footerParts);
  return (
    <RecordCard
      layout="mediaAside"
      title={map.name}
      {...(map.secondaryLine === undefined
        ? {}
        : { secondaryLine: map.secondaryLine })}
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
