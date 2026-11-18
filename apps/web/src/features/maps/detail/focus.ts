import { z } from 'zod';

import type { MapDetailStageMarker, MapDetailView } from './project';

export const mapDetailSearchSchema = z
  .object({
    // Keep invalid raw values distinguishable from an absent value so the
    // page can remove them from the address after resolving the map.
    focus: z.string().max(2048).optional().catch(''),
  })
  .passthrough();

export const MAP_DETAIL_FOCUS_KIND = {
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
    return view.entities.some(
      ({ kind }) => kind === MAP_DETAIL_FOCUS_KIND[focus.kind],
    )
      ? focus
      : undefined;
  }

  const selected = new Set(focus.keys);
  const keys = view.entities
    .filter(({ focusKey }) => selected.has(focusKey))
    .map(({ focusKey }) => focusKey);
  return keys.length === 0 ? undefined : { keys };
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
export function isOnlyMapDetailFocusKey({
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
