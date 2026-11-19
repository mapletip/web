import { z } from 'zod';

import type {
  MapDetailOnThisMapRowView,
  MapDetailStageMarker,
  MapDetailView,
} from './project';

export const mapDetailSearchSchema = z
  .object({
    // Keep invalid raw values distinguishable from an absent value so the
    // page can remove them from the address after resolving the map.
    focus: z.string().max(2048).optional().catch(''),
  })
  .passthrough();

const MAP_DETAIL_FOCUS_KIND = {
  monsters: 'monster',
  npcs: 'npc',
  connections: 'connection',
} as const;

export type MapDetailFocusKind = keyof typeof MAP_DETAIL_FOCUS_KIND;
export type MapDetailFocus =
  { readonly kind: MapDetailFocusKind } | { readonly keys: readonly string[] };

const ENTITY_KEY_PATTERN = /^(monster|npc|connection|warp)-[a-z0-9]{8}$/u;

/** Parse a whole-kind value or the well-formed parts of an entity list. */
export function parseMapDetailFocus({
  value,
}: {
  readonly value?: string | undefined;
}): MapDetailFocus | undefined {
  if (value === undefined || value === '') return undefined;
  if (Object.hasOwn(MAP_DETAIL_FOCUS_KIND, value)) {
    return { kind: value as MapDetailFocusKind };
  }

  const keys = [
    ...new Set(
      value.split(',').filter((part) => ENTITY_KEY_PATTERN.test(part)),
    ),
  ];
  return keys.length === 0 ? undefined : { keys };
}

/** Keep page entities in the projection's canonical legend order. */
export function resolveMapDetailFocus({
  focus,
  view,
}: {
  readonly focus: MapDetailFocus | undefined;
  readonly view: MapDetailView;
}): MapDetailFocus | undefined {
  if (focus === undefined) return undefined;
  if ('kind' in focus) {
    let count: number | 'unknown';
    switch (focus.kind) {
      case 'connections':
        count = view.connections.count;
        break;
      case 'monsters':
        count = view.monsters.count;
        break;
      case 'npcs':
        count = view.npcs.count;
        break;
    }
    return count === 'unknown' || count > 0 ? focus : undefined;
  }

  const selected = new Set(focus.keys);
  const keys = view.entities
    .filter(({ focusKey }) => selected.has(focusKey))
    .map(({ focusKey }) => focusKey);
  return keys.length === 0 ? undefined : { keys };
}

/** Apply the activation rule for an entity chip, then restore canonical order. */
export function activateMapDetailEntity({
  focus,
  focusKey,
  modified,
  view,
}: {
  readonly focus: MapDetailFocus | undefined;
  readonly focusKey: string;
  readonly modified: boolean;
  readonly view: MapDetailView;
}): MapDetailFocus | undefined {
  let nextFocus: MapDetailFocus | undefined;

  if (modified) {
    if (focus === undefined || 'kind' in focus) {
      nextFocus = { keys: [focusKey] };
    } else if (focus.keys.includes(focusKey)) {
      const keys = focus.keys.filter((key) => key !== focusKey);
      nextFocus = keys.length === 0 ? undefined : { keys };
    } else {
      nextFocus = { keys: [...focus.keys, focusKey] };
    }
  } else {
    nextFocus = isOnlyMapDetailFocusKey({ focus, focusKey })
      ? undefined
      : { keys: [focusKey] };
  }

  return resolveMapDetailFocus({ focus: nextFocus, view });
}

/** Format the already-resolved selection in canonical entity order. */
export function formatMapDetailFocus({
  focus,
}: {
  readonly focus: MapDetailFocus | undefined;
}): string | undefined {
  if (focus === undefined) return undefined;
  return 'kind' in focus ? focus.kind : focus.keys.join(',');
}

/** Resolve a selection to the stage markers that should show their rings. */
export function mapDetailFocusMarkerIds({
  focus,
  markers,
}: {
  readonly focus: MapDetailFocus | undefined;
  readonly markers: readonly MapDetailStageMarker[];
}): readonly string[] {
  if (focus === undefined) return [];
  if ('kind' in focus) {
    const kind = MAP_DETAIL_FOCUS_KIND[focus.kind];
    return markers.filter((marker) => marker.kind === kind).map(({ id }) => id);
  }

  const keys = new Set(focus.keys);
  return markers
    .filter(({ focusKey }) => keys.has(focusKey))
    .map(({ id }) => id);
}

/** Whether activating an entity again should clear the current selection. */
function isOnlyMapDetailFocusKey({
  focus,
  focusKey,
}: {
  readonly focus: MapDetailFocus | undefined;
  readonly focusKey: string;
}): boolean {
  return (
    focus !== undefined &&
    'keys' in focus &&
    focus.keys.length === 1 &&
    focus.keys[0] === focusKey
  );
}

/** Select one entity without applying the activation toggle rule. */
export function selectMapDetailEntity({
  focusKey,
  view,
}: {
  readonly focusKey: string;
  readonly view: MapDetailView;
}): MapDetailFocus | undefined {
  return resolveMapDetailFocus({ focus: { keys: [focusKey] }, view });
}

/** Toggle a whole entity kind using the same rule as its summary row. */
export function toggleMapDetailKind({
  focus,
  kind,
  view,
}: {
  readonly focus: MapDetailFocus | undefined;
  readonly kind: MapDetailFocusKind;
  readonly view: MapDetailView;
}): MapDetailFocus | undefined {
  const nextFocus =
    focus !== undefined && 'kind' in focus && focus.kind === kind
      ? undefined
      : { kind };
  return resolveMapDetailFocus({ focus: nextFocus, view });
}

/** Resolve marker ids to unique entities in their marker order. */
export function mapDetailEntitiesForMarkers({
  markerIds,
  view,
}: {
  readonly markerIds: readonly string[];
  readonly view: MapDetailView;
}) {
  const markersById = new Map(
    view.stage.markers.map((marker) => [marker.id, marker]),
  );
  const entitiesByFocusKey = new Map(
    view.entities.map((entity) => [entity.focusKey, entity]),
  );
  const seen = new Set<string>();
  const entities = [];

  for (const markerId of markerIds) {
    const marker = markersById.get(markerId);
    if (marker === undefined || seen.has(marker.focusKey)) continue;
    seen.add(marker.focusKey);
    const entity = entitiesByFocusKey.get(marker.focusKey);
    if (entity !== undefined) entities.push(entity);
  }

  return entities;
}

/** Apply marker activation only when the activated point represents one entity. */
export function activateMapDetailMarkers({
  focus,
  markerIds,
  view,
}: {
  readonly focus: MapDetailFocus | undefined;
  readonly markerIds: readonly string[];
  readonly view: MapDetailView;
}): { readonly focus: MapDetailFocus | undefined } | undefined {
  const entities = mapDetailEntitiesForMarkers({ markerIds, view });
  if (entities.length !== 1) return undefined;
  return {
    focus: activateMapDetailEntity({
      focus,
      focusKey: entities[0]!.focusKey,
      modified: false,
      view,
    }),
  };
}

/** Whether a legend entity belongs to the current entity or whole-kind focus. */
export function isMapDetailEntityFocused({
  focus,
  focusKey,
  kind,
}: {
  readonly focus: MapDetailFocus | undefined;
  readonly focusKey: string;
  readonly kind: MapDetailStageMarker['kind'];
}): boolean {
  if (focus === undefined) return false;
  if ('kind' in focus) return MAP_DETAIL_FOCUS_KIND[focus.kind] === kind;
  return focus.keys.includes(focusKey);
}

/** Whether a whole-kind focus selects an On this map toggle row. */
export function isMapDetailOnThisMapRowSelected({
  focus,
  row,
}: {
  readonly focus: MapDetailFocus | undefined;
  readonly row: MapDetailOnThisMapRowView;
}): boolean {
  return (
    'focus' in row &&
    focus !== undefined &&
    'kind' in focus &&
    focus.kind === row.focus
  );
}
