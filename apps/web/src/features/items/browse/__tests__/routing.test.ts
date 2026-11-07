import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import { parseItemRouteParams } from '../routing';

describe('parseItemRouteParams', () => {
  it('parses unversioned root route params to default build and all items', () => {
    expect(parseItemRouteParams({})).toEqual({
      buildId: 'cw-launch',
      category: { scope: ITEM_SCOPES.all },
    });
  });

  it('parses valid versioned root route params', () => {
    expect(parseItemRouteParams({ buildId: 'gms-v83' })).toEqual({
      buildId: 'gms-v83',
      category: { scope: ITEM_SCOPES.all },
    });
  });

  it('parses valid scope and child params', () => {
    expect(
      parseItemRouteParams({
        buildId: 'gms-v83',
        scope: 'use',
        child: 'buffs',
      }),
    ).toEqual({
      buildId: 'gms-v83',
      category: {
        scope: ITEM_SCOPES.use,
        child: ITEM_SCOPES.use.children.find((c) => c.slug === 'buffs'),
      },
    });

    expect(
      parseItemRouteParams({
        scope: 'setup',
        child: 'chairs',
      }),
    ).toEqual({
      buildId: 'cw-launch',
      category: {
        scope: ITEM_SCOPES.setup,
        child: ITEM_SCOPES.setup.children.find((c) => c.slug === 'chairs'),
      },
    });
  });

  it('throws notFound for explicit default build in URL (/maplestory/cw-launch/items)', () => {
    expect(() => parseItemRouteParams({ buildId: 'cw-launch' })).toThrow();
  });

  it('throws notFound for explicit "all" scope in URL (/maplestory/items/all)', () => {
    expect(() => parseItemRouteParams({ scope: 'all' })).toThrow();
    expect(() =>
      parseItemRouteParams({ buildId: 'gms-v83', scope: 'all' }),
    ).toThrow();
  });

  it('throws notFound for unknown build, scope, or child', () => {
    expect(() => parseItemRouteParams({ buildId: 'unknown-build' })).toThrow();
    expect(() => parseItemRouteParams({ scope: 'unknown-scope' })).toThrow();
    expect(() =>
      parseItemRouteParams({ scope: 'use', child: 'unknown-child' }),
    ).toThrow();
  });

  it('throws notFound for child without scope', () => {
    expect(() => parseItemRouteParams({ child: 'buffs' })).toThrow();
  });
});
