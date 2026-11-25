import { describe, expect, it } from 'vitest';

import {
  activateMapDetailMarkers,
  activateMapDetailEntity,
  formatMapDetailFocus,
  isMapDetailOnThisMapRowSelected,
  mapDetailEntitiesForMarkers,
  mapDetailFocusMarkerIds,
  mapDetailSearchSchema,
  normalizeMapDetailFocusValue,
  parseMapDetailFocus,
  resolveMapDetailFocus,
  selectMapDetailEntity,
  toggleMapDetailKind,
} from '../focus';
import { projectMapDetail, type MapDetailView } from '../project';

import { mapPageRecordFixture } from './mapPageFixture';

function practiceGrove() {
  return projectMapDetail({
    record: mapPageRecordFixture({ mapId: 'practice-grove' }),
    buildId: 'cw-launch',
  });
}

function lanternSquare() {
  return projectMapDetail({
    record: mapPageRecordFixture({ mapId: 'lantern-square' }),
    buildId: 'cw-launch',
  });
}

function entityKey(view: MapDetailView, kind: string): string {
  const entity = view.entities.find((item) => item.kind === kind);
  if (entity === undefined) throw new Error(`Expected a ${kind} entity.`);
  return entity.focusKey;
}

describe('Map Detail focus', () => {
  it.each(['monster', 'npc', 'connection', 'warp'] as const)(
    'parses and resolves a %s key',
    (kind) => {
      const view = kind === 'npc' ? lanternSquare() : practiceGrove();
      const key = entityKey(view, kind);
      const focus = parseMapDetailFocus({ value: key });

      expect(resolveMapDetailFocus({ focus, view })).toEqual({ keys: [key] });
      expect(
        mapDetailFocusMarkerIds({ focus, markers: view.stage.markers }),
      ).toEqual(
        view.stage.markers
          .filter((marker) => marker.focusKey === key)
          .map(({ id }) => id),
      );
      expect(formatMapDetailFocus({ focus })).toBe(key);
    },
  );

  it.each(['monsters', 'npcs', 'connections'] as const)(
    'parses and resolves the whole %s kind',
    (kind) => {
      const view = kind === 'npcs' ? lanternSquare() : practiceGrove();
      const focus = parseMapDetailFocus({ value: kind });

      expect(resolveMapDetailFocus({ focus, view })).toEqual({ kind });
      expect(formatMapDetailFocus({ focus })).toBe(kind);
      expect(
        mapDetailFocusMarkerIds({ focus, markers: view.stage.markers }),
      ).toEqual(
        view.stage.markers
          .filter((marker) =>
            kind === 'connections'
              ? marker.kind === 'connection'
              : marker.kind === (kind === 'monsters' ? 'monster' : 'npc'),
          )
          .map(({ id }) => id),
      );
    },
  );

  it('resolves multiple keys in legend order, independent of input order', () => {
    const base = mapPageRecordFixture({ mapId: 'practice-grove' });
    const npcRecord = mapPageRecordFixture({ mapId: 'lantern-square' });
    const view = projectMapDetail({
      record: {
        ...base,
        npcs: { state: 'known', items: npcRecord.npcs.items.slice(0, 1) },
      },
      buildId: 'cw-launch',
    });
    const keys = view.entities.map(({ focusKey }) => focusKey);
    const resolved = resolveMapDetailFocus({
      focus: { keys: [...keys].reverse() },
      view,
    });

    expect(resolved).toEqual({ keys });
    expect(formatMapDetailFocus({ focus: resolved })).toBe(keys.join(','));
  });

  it('orders keys of the same kind as the page lists them', () => {
    const view = practiceGrove();
    const monsters = view.entities.filter(({ kind }) => kind === 'monster');
    const [first, second] = monsters;
    if (first === undefined || second === undefined) {
      throw new Error('Expected multiple monsters.');
    }

    const resolved = resolveMapDetailFocus({
      focus: { keys: [second.focusKey, first.focusKey] },
      view,
    });
    expect(formatMapDetailFocus({ focus: resolved })).toBe(
      `${first.focusKey},${second.focusKey}`,
    );
  });

  it('adds a modified entity and keeps the legend order', () => {
    const view = practiceGrove();
    const [first, second] = view.entities.filter(
      ({ kind }) => kind === 'monster',
    );
    if (first === undefined || second === undefined) {
      throw new Error('Expected multiple fixture Monsters.');
    }

    const focus = activateMapDetailEntity({
      focus: { keys: [second.focusKey] },
      focusKey: first.focusKey,
      modified: true,
      view,
    });

    expect(focus).toEqual({ keys: [first.focusKey, second.focusKey] });
  });

  it('removes one entity from a modified selection', () => {
    const view = practiceGrove();
    const [first, second] = view.entities.filter(
      ({ kind }) => kind === 'monster',
    );
    if (first === undefined || second === undefined) {
      throw new Error('Expected multiple fixture Monsters.');
    }

    expect(
      activateMapDetailEntity({
        focus: { keys: [first.focusKey, second.focusKey] },
        focusKey: first.focusKey,
        modified: true,
        view,
      }),
    ).toEqual({ keys: [second.focusKey] });
  });

  it('clears focus when the last entity is removed with a modifier', () => {
    const view = practiceGrove();
    const key = entityKey(view, 'monster');

    expect(
      activateMapDetailEntity({
        focus: { keys: [key] },
        focusKey: key,
        modified: true,
        view,
      }),
    ).toBeUndefined();
  });

  it('selects a located monster even when it was already selected', () => {
    const view = practiceGrove();
    const key = entityKey(view, 'monster');

    expect(selectMapDetailEntity({ focusKey: key, view })).toEqual({
      keys: [key],
    });
    expect(selectMapDetailEntity({ focusKey: key, view })).toEqual({
      keys: [key],
    });
  });

  it('toggles a whole kind and clears only the matching whole-kind focus', () => {
    const view = practiceGrove();

    expect(
      toggleMapDetailKind({ focus: undefined, kind: 'monsters', view }),
    ).toEqual({ kind: 'monsters' });
    expect(
      toggleMapDetailKind({
        focus: { kind: 'monsters' },
        kind: 'monsters',
        view,
      }),
    ).toBeUndefined();
    expect(
      toggleMapDetailKind({
        focus: { keys: [entityKey(view, 'monster')] },
        kind: 'monsters',
        view,
      }),
    ).toEqual({ kind: 'monsters' });
  });

  it('shares the Monsters pressed state with the Spawns row', () => {
    const view = practiceGrove();
    const monsters = view.onThisMap.find(({ key }) => key === 'monsters');
    const spawns = view.onThisMap.find(({ key }) => key === 'spawns');
    if (monsters === undefined || spawns === undefined) {
      throw new Error('Expected monster and spawn summary rows.');
    }

    expect(
      isMapDetailOnThisMapRowSelected({
        focus: { kind: 'monsters' },
        row: monsters,
      }),
    ).toBe(true);
    expect(
      isMapDetailOnThisMapRowSelected({
        focus: { kind: 'monsters' },
        row: spawns,
      }),
    ).toBe(true);
    expect(
      isMapDetailOnThisMapRowSelected({ focus: { kind: 'npcs' }, row: spawns }),
    ).toBe(false);
  });

  it('resolves a marker group to unique entities and toggles only a single entity', () => {
    const view = practiceGrove();
    const twinMarkers = view.stage.markers.filter(({ label }) =>
      label.startsWith('Twin Sprout'),
    );
    const markerIds = twinMarkers.map(({ id }) => id);
    const twin = view.entities.find(({ name }) => name === 'Twin Sprout');
    if (twin === undefined) throw new Error('Expected Twin Sprout.');

    expect(mapDetailEntitiesForMarkers({ markerIds, view })).toEqual([twin]);
    expect(
      activateMapDetailMarkers({ focus: undefined, markerIds, view }),
    ).toEqual({ focus: { keys: [twin.focusKey] } });

    const mixedMarkers = [
      markerIds[0],
      view.stage.markers.find((marker) => marker.kind === 'connection')?.id,
    ].filter((id): id is string => id !== undefined);
    expect(
      activateMapDetailMarkers({
        focus: undefined,
        markerIds: mixedMarkers,
        view,
      }),
    ).toBeUndefined();
  });

  it('replaces a multiple selection without a modifier', () => {
    const view = practiceGrove();
    const monsters = view.entities.filter(({ kind }) => kind === 'monster');
    const [first, second, replacement] = monsters;
    if (
      first === undefined ||
      second === undefined ||
      replacement === undefined
    ) {
      throw new Error('Expected three fixture Monsters.');
    }

    expect(
      activateMapDetailEntity({
        focus: { keys: [first.focusKey, second.focusKey] },
        focusKey: replacement.focusKey,
        modified: false,
        view,
      }),
    ).toEqual({ keys: [replacement.focusKey] });
  });

  it('starts a modified selection from a whole kind', () => {
    const view = practiceGrove();
    const key = entityKey(view, 'monster');

    expect(
      activateMapDetailEntity({
        focus: { kind: 'monsters' },
        focusKey: key,
        modified: true,
        view,
      }),
    ).toEqual({ keys: [key] });
  });

  it('drops malformed parts and duplicate keys while parsing', () => {
    const view = practiceGrove();
    const key = entityKey(view, 'monster');
    const focus = parseMapDetailFocus({
      value: `bad,monster-short,${key},${key},connection-m1-${key.slice('monster-'.length)}`,
    });

    expect(focus).toEqual({ keys: [key] });
    expect(parseMapDetailFocus({ value: 'monster-!@#$%^&*' })).toBeUndefined();
    expect(mapDetailSearchSchema.parse({ focus: [] }).focus).toBe('');
  });

  it('preserves a resolved public monster reference and clears an unknown one', () => {
    const view = practiceGrove();
    const monster = view.monsters.monsters[0]!;
    const value = `monster-id-${monster.publicId}`;
    const focus = resolveMapDetailFocus({
      focus: parseMapDetailFocus({ value }),
      view,
    });
    expect(focus).toEqual({ keys: [monster.focusKey] });
    expect(normalizeMapDetailFocusValue({ value, focus })).toBe(value);

    const unknown = 'monster-id-00000000';
    const unresolved = resolveMapDetailFocus({
      focus: parseMapDetailFocus({ value: unknown }),
      view,
    });
    expect(
      normalizeMapDetailFocusValue({ value: unknown, focus: unresolved }),
    ).toBeUndefined();
  });

  it('drops an unknown map entity but keeps a known key', () => {
    const view = practiceGrove();
    const key = entityKey(view, 'monster');
    const resolved = resolveMapDetailFocus({
      focus: parseMapDetailFocus({ value: `${key},npc-00000000` }),
      view,
    });

    expect(resolved).toEqual({ keys: [key] });
    expect(formatMapDetailFocus({ focus: resolved })).toBe(key);
  });
});
