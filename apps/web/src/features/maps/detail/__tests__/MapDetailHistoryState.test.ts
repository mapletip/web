import { describe, expect, it } from 'vitest';

import { mapDetailHistoryStateSchema } from '../MapDetail/MapDetail';

describe('map detail history state', () => {
  it('reads the stage view and find text while ignoring other keys', () => {
    expect(
      mapDetailHistoryStateSchema.parse({
        mapDetailStageView: { zoom: 2, centerX: 120, centerY: 80 },
        mapDetailFindText: 'sprout',
        mapDetailOverlay: { type: 'explore' },
      }),
    ).toEqual({
      mapDetailStageView: { zoom: 2, centerX: 120, centerY: 80 },
      mapDetailFindText: 'sprout',
    });
  });

  it('returns an empty state when fields are missing', () => {
    expect(mapDetailHistoryStateSchema.parse({})).toEqual({});
  });

  it('ignores malformed values and non-object state', () => {
    expect(
      mapDetailHistoryStateSchema.parse({
        mapDetailStageView: { zoom: 2, centerX: Number.NaN, centerY: 80 },
        mapDetailFindText: 4,
      }),
    ).toEqual({});
    expect(mapDetailHistoryStateSchema.parse(null)).toEqual({});
  });
});
