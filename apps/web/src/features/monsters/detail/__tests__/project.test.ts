import { describe, expect, it } from 'vitest';

import { UNNAMED_MONSTER_LABEL } from '../../shared';
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

    expect(view).toMatchObject({
      publicId: '36z2h01p',
      slug: 'sentinel-snail',
      name: 'Sentinel Snail',
      buildId: 'cw-launch',
      canonicalPath: '/maplestory/monsters/sentinel-snail-36z2h01p',
      spriteUrl: `https://d0.mapletip.com/media/images/aa/${'a'.repeat(64)}.png`,
      spriteWidth: 32,
      spriteHeight: 48,
    });
    expect(view.stats.map(({ label }) => label)).toEqual([
      'Level',
      'HP',
      'MP',
      'EXP',
      'Weapon attack',
      'Magic attack',
      'Weapon defense',
      'Magic defense',
      'Accuracy',
      'Avoidability',
      'Knockback',
      'Speed',
    ]);
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

  it('projects known, non-known, negative, and large stat values in order', () => {
    const fixture = monsterPageFixture();
    const view = projectMonsterDetail(
      monsterPageFixture({
        stats: {
          ...fixture.stats,
          level: { state: 'known', value: 5 },
          hp: { state: 'known', value: 23_000_000 },
          mp: { state: 'unknown' },
          exp: { state: 'absent', coverageKey: 'fixture:exp' },
          paDamage: { state: 'unsupported' },
          maDamage: { state: 'known', value: -65 },
          pdDamage: { state: 'known', value: 2_147_483_647 },
        },
      }),
      'cw-launch',
    );

    expect(view.stats.map(({ value }) => value)).toEqual([
      '5',
      '23,000,000',
      'Unknown',
      '-',
      'Unavailable',
      '-65',
      '2,147,483,647',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
    ]);
    expect(view.stats.map(({ known }) => known)).toEqual([
      true,
      true,
      false,
      false,
      false,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('projects only known element responses and known true traits', () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        boss: { state: 'known', value: true },
        undead: { state: 'unknown' },
        elements: {
          state: 'partial',
          items: [
            {
              code: 'S',
              effect: 2,
              meaning: { state: 'known', value: 'Poison' },
              multiplier: { state: 'known', value: 0 },
              resistance: { state: 'known', value: 'Immune' },
            },
            {
              code: 'H',
              effect: 1,
              meaning: { state: 'known', value: 'Holy' },
              multiplier: { state: 'known', value: 1.5 },
              resistance: { state: 'known', value: 'Weak' },
            },
            {
              code: 'F',
              effect: 0,
              meaning: { state: 'known', value: 'Fire' },
              multiplier: { state: 'unknown' },
              resistance: { state: 'unknown' },
            },
          ],
        },
      }),
      'cw-launch',
    );

    expect(view.boss).toBe(true);
    expect(view.undead).toBeUndefined();
    expect(view.elements).toEqual([
      { code: 'S', element: 'Poison', response: 'Immune' },
      { code: 'H', element: 'Holy', response: 'Weak' },
    ]);
  });
});
