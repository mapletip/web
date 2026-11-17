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
});
