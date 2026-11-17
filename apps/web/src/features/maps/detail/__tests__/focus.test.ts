import { describe, expect, it } from 'vitest';

import {
  formatMapDetailFocus,
  mapDetailFocusMarkerIds,
  mapDetailSearchSchema,
  parseMapDetailFocus,
  resolveMapDetailFocus,
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
