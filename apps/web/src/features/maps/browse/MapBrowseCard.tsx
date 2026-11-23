import { mapMinimapUrl } from '@mapletip/data/maps';
import type { ReactElement } from 'react';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import {
  MapRecordCard,
  projectMapRecordDestination,
  type MapRecordCardFooterPart,
  type MapRecordCardView,
} from '@/features/maps/shared';

import type { MapBrowseRecord } from './records';

export const UNNAMED_MAP = 'Unnamed map';

/** Inhabitants an active filter selected, by directory key. */
export interface MapBrowseHighlight {
  readonly monsters: ReadonlySet<string>;
  readonly npcs: ReadonlySet<string>;
}

export interface MapBrowseCardProps {
  readonly record: MapBrowseRecord;
  readonly buildId: BuildId;
  readonly highlight?: MapBrowseHighlight | undefined;
}

function plural(count: number, one: string, other: string): string {
  return count === 1 ? one : other;
}

function locationLine(record: MapBrowseRecord): string | undefined {
  const parts = [
    record.name === undefined ? record.streetName : undefined,
    record.regionLabel,
    record.areaLabel,
    record.collectionLabel,
  ].filter((part): part is string => part !== undefined);
  return parts.length === 0 ? undefined : parts.join(' · ');
}

function activityLine(record: MapBrowseRecord): string | undefined {
  const { activity, name } = record;
  if (activity === undefined) return undefined;
  return name?.toLowerCase().includes(activity.toLowerCase())
    ? undefined
    : activity;
}

function levelRange(record: MapBrowseRecord): string | undefined {
  const { lowestMonsterLevel: low, highestMonsterLevel: high } = record;
  if (low === undefined || high === undefined) return undefined;
  return low === high ? `Lv. ${low}` : `Lv. ${low}–${high}`;
}

function populationParts(record: MapBrowseRecord): MapRecordCardFooterPart[] {
  const level = levelRange(record);
  const count = (
    value: number | undefined,
    one: string,
    other: string,
  ): MapRecordCardFooterPart[] =>
    value === undefined || value === 0
      ? []
      : [
          {
            value: value.toLocaleString('en-US'),
            label: plural(value, one, other),
          },
        ];
  return [
    ...(level === undefined ? [] : [{ value: level, label: '' }]),
    ...count(record.monsterCount, 'monster', 'monsters'),
    ...count(record.spawnPointCount, 'spawn point', 'spawn points'),
    ...count(record.npcCount, 'NPC', 'NPCs'),
  ];
}

function highlightLine(
  record: MapBrowseRecord,
  highlight: MapBrowseHighlight | undefined,
): string | undefined {
  if (highlight === undefined) return undefined;
  const names = [
    ...record.monsters
      .filter(({ entry }) => highlight.monsters.has(entry.key))
      .map(({ entry, spawnPointCount = 0 }) => {
        const name = entry.name ?? 'Unnamed monster';
        return `${name} (${spawnPointCount.toLocaleString('en-US')} ${plural(spawnPointCount, 'spawn point', 'spawn points')})`;
      }),
    ...record.npcs
      .filter(({ entry }) => highlight.npcs.has(entry.key))
      .map(({ entry }) => entry.name ?? 'Unnamed NPC'),
  ];
  return names.length === 0 ? undefined : names.join(' · ');
}

/** Project one record to the shared map card. */
export function mapBrowseCardView({
  record,
  buildId,
  highlight,
}: MapBrowseCardProps): MapRecordCardView {
  const secondaryLine = locationLine(record);
  const activity = activityLine(record);
  const highlighted = highlightLine(record, highlight);
  return {
    key: record.publicId,
    name: record.name ?? UNNAMED_MAP,
    ...(secondaryLine === undefined ? {} : { secondaryLine }),
    ...(activity === undefined ? {} : { activityLine: activity }),
    ...(highlighted === undefined ? {} : { highlightLine: highlighted }),
    ...(record.minimapId === undefined
      ? { minimapUnavailableLabel: 'Minimap unavailable' }
      : {
          minimapUrl: mapMinimapUrl(MAPLEKIT_RELEASE.baseUrl, record.minimapId),
        }),
    footerParts: populationParts(record),
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
