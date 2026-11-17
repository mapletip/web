import { HoverCard, Image, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  RecordCard,
  type RecordCardLinkRenderer,
} from '@mapletip/component-library';
import type { ReactElement } from 'react';

import { AnchorLink } from '@/components/RouterLinks';
import type { BuildId } from '@/config/maplekit';

import classes from './MapRecordCard.module.css';

export const MAP_DETAIL_ROUTE = '/maplestory/{-$buildId}/maps/$slugId' as const;

export interface MapRecordCardFooterPart {
  readonly value: string;
  readonly label: string;
}

export interface MapRecordCardDestination {
  readonly href: string;
  readonly params: {
    readonly buildId?: BuildId;
    readonly slugId: string;
  };
}

/** Display-ready values shared by map cards on detail pages. */
export interface MapRecordCardView {
  readonly key: string;
  readonly name: string;
  readonly secondaryLine?: string;
  readonly minimapUrl?: string;
  readonly minimapUnavailableLabel?: string;
  readonly footerParts: readonly MapRecordCardFooterPart[];
  readonly destination?: MapRecordCardDestination;
}

export interface MapRecordCardProps {
  readonly map: MapRecordCardView;
}

function renderMapDetailLink(
  destination: MapRecordCardDestination,
): RecordCardLinkRenderer {
  return (_recordDestination, props) => (
    <AnchorLink
      to={MAP_DETAIL_ROUTE}
      params={destination.params}
      className={props.className}
    >
      {props.children}
    </AnchorLink>
  );
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
  const canHoverMinimap = useMediaQuery(
    '(min-width: 48em) and (hover: hover) and (pointer: fine)',
    false,
  );
  let minimap: ReactElement | undefined;
  if (map.minimapUrl !== undefined) {
    minimap = (
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
          <Image
            src={map.minimapUrl}
            alt={`${map.name} minimap enlarged`}
            className={classes['expandedMinimap']}
          />
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
      footer={renderFooterParts(map.footerParts)}
      {...(destination === undefined
        ? {}
        : {
            destination: { href: destination.href },
            renderLink: renderMapDetailLink(destination),
          })}
    />
  );
}
