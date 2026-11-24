import {
  mapMarkUrl,
  mapMinimapUrl,
  mapNpcSpriteUrl,
} from '@mapletip/data/maps';
import type { ReactElement } from 'react';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import {
  MapRecordCard,
  projectMapRecordDestination,
  type MapRecordCardFooterPart,
  type MapRecordCardView,
} from '@/features/maps/shared';
import { resolveMonsterSpriteUrl } from '@/features/monsters/shared';

import type { MapLocationNode } from './location';
import type { MapBrowseRecord } from './records';

export const UNNAMED_MAP = 'Unnamed map';

/**
 * What the active filters and sort ask the card to show. The card stays as
 * plain as a connection card unless one of them makes a figure the reason
 * the map is listed or ordered.
 */
export interface MapBrowseCardContext {
  /** Monster public IDs and NPC keys an active filter selected. */
  readonly monsters: ReadonlySet<string>;
  readonly npcs: ReadonlySet<string>;
  /** A monster level filter or sort is active. */
  readonly levels: boolean;
  /** The maps are sorted by spawn points. */
  readonly spawns: boolean;
  readonly entryLevel: boolean;
  readonly levelCap: boolean;
}

export const PLAIN_CARD_CONTEXT: MapBrowseCardContext = {
  monsters: new Set(),
  npcs: new Set(),
  levels: false,
  spawns: false,
  entryLevel: false,
  levelCap: false,
};

export interface MapBrowseCardProps {
  readonly record: MapBrowseRecord;
  readonly buildId: BuildId;
  /** The location page being shown; the card omits what its heading says. */
  readonly location: MapLocationNode;
  readonly context: MapBrowseCardContext;
}

function activity(record: MapBrowseRecord): string | undefined {
  const { activity: value, name } = record;
  if (value === undefined) return undefined;
  return name?.toLowerCase().includes(value.toLowerCase()) ? undefined : value;
}

function locationLine(
  record: MapBrowseRecord,
  location: MapLocationNode,
): string | undefined {
  const parts = [
    record.name === undefined ? record.streetName : undefined,
    location.kind === 'region' || location.kind === 'area'
      ? undefined
      : record.regionLabel,
    location.kind === 'area' ? undefined : record.areaLabel,
    location.kind === 'collection' ? undefined : record.collectionLabel,
    activity(record),
  ].filter((part): part is string => part !== undefined);
  return parts.length === 0 ? undefined : parts.join(' · ');
}

function inhabitantParts(
  record: MapBrowseRecord,
  context: MapBrowseCardContext,
): MapRecordCardFooterPart[] {
  const iconUrl = (url: string | undefined) =>
    url === undefined ? {} : { iconUrl: url };
  return [
    ...record.monsters
      .filter(
        ({ entry }) =>
          entry.publicId !== undefined && context.monsters.has(entry.publicId),
      )
      .map(({ entry, spawnPointCount = 0 }) => ({
        entity: {
          name: entry.name ?? 'Unnamed monster',
          count: spawnPointCount,
          ...iconUrl(resolveMonsterSpriteUrl(entry.spriteId)),
        },
      })),
    ...record.npcs
      .filter(({ entry }) => context.npcs.has(entry.key))
      .map(({ entry }) => ({
        entity: {
          name: entry.name ?? 'Unnamed NPC',
          ...iconUrl(
            entry.spriteId === undefined
              ? undefined
              : mapNpcSpriteUrl(MAPLEKIT_RELEASE.baseUrl, entry.spriteId),
          ),
        },
      })),
  ];
}

function levelPart(record: MapBrowseRecord): MapRecordCardFooterPart[] {
  const { lowestMonsterLevel: low, highestMonsterLevel: high } = record;
  if (low === undefined || high === undefined) return [];
  return [
    {
      value: low === high ? `Lv. ${low}` : `Lv. ${low}–${high}`,
      label: 'monsters',
    },
  ];
}

function spawnPart(record: MapBrowseRecord): MapRecordCardFooterPart[] {
  const count = record.spawnPointCount;
  if (count === undefined || count === 0) return [];
  return [
    {
      value: count.toLocaleString('en-US'),
      label: count === 1 ? 'spawn' : 'spawns',
    },
  ];
}

/** Show figures only for facts the current filters or sort ask for. */
function footerParts(
  record: MapBrowseRecord,
  context: MapBrowseCardContext,
): MapRecordCardFooterPart[] {
  let parts: MapRecordCardFooterPart[] = [];
  if (context.monsters.size > 0 || context.npcs.size > 0) {
    parts = inhabitantParts(record, context);
  } else if (context.levels) {
    parts = levelPart(record);
  } else if (context.spawns) {
    parts = spawnPart(record);
  }
  if (context.entryLevel && record.entryLevel !== undefined) {
    parts.push({ value: `Entry Lv. ${record.entryLevel}`, label: '' });
  }
  if (context.levelCap && record.levelCap !== undefined) {
    parts.push({ value: `Lv. cap ${record.levelCap}`, label: '' });
  }
  return parts;
}

/** Project one record to the shared map card. */
export function mapBrowseCardView({
  record,
  buildId,
  location,
  context,
}: MapBrowseCardProps): MapRecordCardView {
  const secondaryLine = locationLine(record, location);
  return {
    key: record.publicId,
    name: record.name ?? UNNAMED_MAP,
    ...(record.markId === undefined
      ? {}
      : { markUrl: mapMarkUrl(MAPLEKIT_RELEASE.baseUrl, record.markId) }),
    ...(secondaryLine === undefined ? {} : { secondaryLine }),
    ...(record.minimapId === undefined
      ? { minimapUnavailableLabel: 'Minimap unavailable' }
      : {
          minimapUrl: mapMinimapUrl(MAPLEKIT_RELEASE.baseUrl, record.minimapId),
        }),
    // The whole card opens Map Detail, whose stage is the larger view.
    minimapPreview: false,
    footerParts: footerParts(record, context),
    destination: projectMapRecordDestination({
      slug: record.slug,
      publicId: record.publicId,
      buildId,
    }),
  };
}

export function MapBrowseCard(props: MapBrowseCardProps): ReactElement {
  return <MapRecordCard map={mapBrowseCardView(props)} />;
}
