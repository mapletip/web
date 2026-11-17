import { describe, expect, it } from 'vitest';

import { projectMapDetail, UNNAMED_MAP_LABEL } from '../project';

import { mapPageRecordFixture } from './mapPageFixture';

describe('projectMapDetail', () => {
  it('projects a named map and default-build canonical path', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });

    expect(view).toMatchObject({
      publicId: record.publicId,
      slug: 'practice-grove',
      name: 'Practice Grove',
      regionLabel: 'Lantern Hills',
      buildId: 'cw-launch',
      canonicalPath: `/maplestory/maps/practice-grove-${record.publicId}`,
    });
    expect(view.subtitle).toBeUndefined();
  });

  it('uses the unnamed label and street name when the map name is unknown', () => {
    const record = mapPageRecordFixture({ mapId: 'unnamed-stage' });
    const view = projectMapDetail({
      record: {
        ...record,
        streetName: { state: 'known', value: 'Quiet Road' },
      },
      buildId: 'cw-launch',
    });

    expect(view.name).toBe(UNNAMED_MAP_LABEL);
    expect(view.subtitle).toBe('Quiet Road');
  });

  it('leaves geography labels absent for an unplaced map', () => {
    const record = mapPageRecordFixture({ mapId: 'quiet-gallery' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });

    expect(view.regionLabel).toBeUndefined();
    expect(view.areaLabel).toBeUndefined();
  });

  it('projects region and area labels for a placed map', () => {
    const record = mapPageRecordFixture({ mapId: 'lantern-square' });
    if (record.geography === undefined || record.geography === null) {
      throw new Error('Expected the fixture Map to have geography.');
    }
    const view = projectMapDetail({
      record: {
        ...record,
        geography: {
          ...record.geography,
          areaKey: 'fixture:market',
          areaLabel: 'Lantern Market',
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.regionLabel).toBe('Lantern Hills');
    expect(view.areaLabel).toBe('Lantern Market');
  });

  it('projects known activity and non-blank description without placeholders', () => {
    const record = mapPageRecordFixture({ mapId: 'lantern-square' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });

    expect(view.activity).toBe('Market');
    expect(view.description).toBe('A gathering place beneath paper lanterns.');

    const absent = projectMapDetail({
      record: {
        ...record,
        activity: { state: 'absent', coverageKey: 'activity' },
        description: { state: 'known', value: '  ' },
      },
      buildId: 'cw-launch',
    });
    expect(absent.activity).toBeUndefined();
    expect(absent.description).toBeUndefined();
  });

  it('projects known facts in order and gives map references canonical destinations', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const returnMap = record.information.returnMap;
    if (returnMap.state !== 'known') {
      throw new Error('Expected fixture return map to be known.');
    }

    const view = projectMapDetail({
      record: {
        ...record,
        information: {
          music: { state: 'known', value: 'Floral Life' },
          returnMap,
          forcedReturnMap: { state: 'known', value: returnMap.value },
          timeLimitSeconds: { state: 'known', value: 600 },
          levelLimit: { state: 'known', value: 30 },
          hpDrain: { state: 'known', value: 25 },
          hpDrainProtectionItem: { state: 'known', value: 'Float Ring' },
          swimming: { state: 'known', value: true },
          flying: { state: 'known', value: true },
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.facts.map(({ label }) => label)).toEqual([
      'Music',
      'Return map',
      'Forced return',
      'Time limit',
      'Level limit',
      'HP drain',
      'HP drain protection',
      'Swimming',
      'Flying',
    ]);
    expect(view.facts.map(({ value }) => value)).toEqual([
      'Floral Life',
      'Lantern Square',
      'Lantern Square',
      '10 min',
      'Lv 30',
      '25 HP',
      'Float Ring',
      'Allowed',
      'Allowed',
    ]);
    expect(view.facts[1]?.destination).toEqual({
      slugId: `lantern-square-${returnMap.value.publicId}`,
    });
    expect(view.facts[1]?.explanation).toBe(
      'Ordinary revival and generic Return Scrolls can send you to this map. Some items and activities use another destination.',
    );
  });

  it('keeps a known return map when its name is unknown', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const returnMap = record.information.returnMap;
    if (returnMap.state !== 'known') {
      throw new Error('Expected fixture return map to be known.');
    }

    const view = projectMapDetail({
      record: {
        ...record,
        information: {
          ...record.information,
          returnMap: {
            ...returnMap,
            value: {
              ...returnMap.value,
              name: { state: 'unknown' },
            },
          },
          forcedReturnMap: { state: 'unknown' },
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.facts).toEqual([
      {
        label: 'Return map',
        value: UNNAMED_MAP_LABEL,
        explanation:
          'Ordinary revival and generic Return Scrolls can send you to this map. Some items and activities use another destination.',
        destination: {
          slugId: `${returnMap.value.slug}-${returnMap.value.publicId}`,
        },
      },
    ]);
  });

  it('omits absent, unknown, blank, and known-false facts', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({
      record: {
        ...record,
        information: {
          music: { state: 'absent', coverageKey: 'music' },
          returnMap: { state: 'unknown' },
          forcedReturnMap: { state: 'unsupported' },
          timeLimitSeconds: { state: 'unknown' },
          levelLimit: { state: 'absent', coverageKey: 'level-limit' },
          hpDrain: { state: 'unknown' },
          hpDrainProtectionItem: { state: 'known', value: '   ' },
          swimming: { state: 'known', value: false },
          flying: { state: 'known', value: false },
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.facts).toEqual([]);
  });

  it.each([
    { seconds: 600, value: '10 min' },
    { seconds: 90, value: '90 sec' },
  ])('formats $seconds seconds as $value', ({ seconds, value }) => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({
      record: {
        ...record,
        information: {
          ...record.information,
          returnMap: { state: 'unknown' },
          timeLimitSeconds: { state: 'known', value: seconds },
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.facts).toEqual([
      {
        label: 'Time limit',
        value,
        explanation:
          'Check the activity rules for when the timer starts and what happens when it runs out.',
      },
    ]);
  });

  it('includes swimming and flying only when each is known true', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({
      record: {
        ...record,
        information: {
          ...record.information,
          returnMap: { state: 'unknown' },
          swimming: { state: 'known', value: true },
          flying: { state: 'known', value: false },
        },
      },
      buildId: 'cw-launch',
    });

    expect(view.facts.map(({ label }) => label)).toEqual(['Swimming']);
  });
});
