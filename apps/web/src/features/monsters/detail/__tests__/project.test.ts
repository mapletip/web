import { describe, expect, it } from 'vitest';

import { UNNAMED_MONSTER_LABEL } from '../../browse/project';
import { projectMonsterDetail } from '../project';

import { monsterPageFixture } from './monsterPageFixture';

describe('projectMonsterDetail', () => {
  it('projects identity fields and unprefixed canonical path for default build', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        publicId: '36z2h01p',
        slug: 'sentinel-snail',
        name: { state: 'known', value: 'Sentinel Snail' },
      }),
      'cw-launch',
    );

    expect(view).toEqual({
      publicId: '36z2h01p',
      slug: 'sentinel-snail',
      name: 'Sentinel Snail',
      buildId: 'cw-launch',
      canonicalPath: '/maplestory/monsters/sentinel-snail-36z2h01p',
    });
  });

  it('projects prefixed canonical path for alternate builds', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        publicId: 'jp565851',
        slug: 'pianus',
        name: { state: 'known', value: 'Pianus' },
        scope: { build_id: 'gms-v83', family_id: 'gms' },
      }),
      'gms-v83',
    );

    expect(view.buildId).toBe('gms-v83');
    expect(view.canonicalPath).toBe(
      '/maplestory/gms-v83/monsters/pianus-jp565851',
    );
  });

  it('falls back to UNNAMED_MONSTER_LABEL when name is non-known', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        name: { state: 'absent', coverageKey: 'monster:name' },
      }),
      'cw-launch',
    );

    expect(view.name).toBe(UNNAMED_MONSTER_LABEL);
  });
});
