import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import { itemPageMetadata } from '../metadata';

describe('itemPageMetadata', () => {
  it('generates canonical all items metadata', () => {
    const meta = itemPageMetadata({
      buildId: 'cw-launch',
      category: { scope: ITEM_SCOPES.all },
    });
    expect(meta).toEqual({
      heading: 'MapleStory Classic World Items',
      title: 'MapleStory Classic World Items – MapleTip',
      description: 'Browse Classic World items in MapleStory.',
      canonicalUrl: 'https://mapletip.com/maplestory/items',
      robots: 'index,follow',
    });
  });

  it('generates versioned scope metadata', () => {
    const meta = itemPageMetadata({
      buildId: 'gms-v83',
      category: { scope: ITEM_SCOPES.use },
    });
    expect(meta).toEqual({
      heading: 'MapleStory GMS v83 Use Items',
      title: 'MapleStory GMS v83 Use Items – MapleTip',
      description: 'Browse GMS v83 use items in MapleStory.',
      canonicalUrl: 'https://mapletip.com/maplestory/gms-v83/items/use',
      robots: 'index,follow',
    });
  });

  it('generates versioned child metadata', () => {
    const child = ITEM_SCOPES.use.children.find((c) => c.slug === 'potions');
    expect(child).toBeDefined();
    if (!child) return;
    const meta = itemPageMetadata({
      buildId: 'gms-v83',
      category: {
        scope: ITEM_SCOPES.use,
        child,
      },
    });
    expect(meta).toEqual({
      heading: 'MapleStory GMS v83 Potions',
      title: 'MapleStory GMS v83 Potions – MapleTip',
      description: 'Browse GMS v83 potions in MapleStory.',
      canonicalUrl: 'https://mapletip.com/maplestory/gms-v83/items/use/potions',
      robots: 'index,follow',
    });
  });

  it('generates canonical child metadata with specific player description', () => {
    const child = ITEM_SCOPES.setup.children.find((c) => c.slug === 'chairs');
    expect(child).toBeDefined();
    if (!child) return;
    const meta = itemPageMetadata({
      buildId: 'cw-launch',
      category: {
        scope: ITEM_SCOPES.setup,
        child,
      },
    });
    expect(meta).toEqual({
      heading: 'MapleStory Classic World Chairs',
      title: 'MapleStory Classic World Chairs – MapleTip',
      description:
        'Browse and compare MapleStory Classic World chairs by HP Recovered / 10s and MP Recovered / 10s.',
      canonicalUrl: 'https://mapletip.com/maplestory/items/setup/chairs',
      robots: 'index,follow',
    });
  });

  it('sets noindex on zero-member categories', () => {
    const bulletsChild = ITEM_SCOPES.use.children.find(
      (c) => c.slug === 'bullets',
    );
    expect(bulletsChild).toBeDefined();
    if (!bulletsChild) return;
    const meta = itemPageMetadata({
      buildId: 'cw-launch',
      category: { scope: ITEM_SCOPES.use, child: bulletsChild },
      search: {},
      count: 0,
    });
    expect(meta.robots).toBe('noindex,follow');
    expect(meta.canonicalUrl).toBe(
      'https://mapletip.com/maplestory/items/use/bullets',
    );
  });

  it('sets noindex on filtered, searched, sorted or paged permutations', () => {
    const child = ITEM_SCOPES.use.children.find(
      (c) => c.slug === 'throwing-stars',
    );
    expect(child).toBeDefined();
    if (!child) return;

    // Search query
    const searchMeta = itemPageMetadata({
      buildId: 'cw-launch',
      category: { scope: ITEM_SCOPES.use, child },
      search: { q: 'ilbi' },
      count: 1,
    });
    expect(searchMeta.robots).toBe('noindex,follow');
    expect(searchMeta.canonicalUrl).toBe(
      'https://mapletip.com/maplestory/items/use/throwing-stars',
    );

    // Page > 1
    const pagedMeta = itemPageMetadata({
      buildId: 'cw-launch',
      category: { scope: ITEM_SCOPES.use, child },
      search: { page: 2 },
      count: 100,
    });
    expect(pagedMeta.robots).toBe('noindex,follow');

    // Custom sort
    const sortedMeta = itemPageMetadata({
      buildId: 'cw-launch',
      category: { scope: ITEM_SCOPES.use, child },
      search: { sort: 'attack-desc' },
      count: 100,
    });
    expect(sortedMeta.robots).toBe('noindex,follow');

    // Clean page is indexable
    const cleanMeta = itemPageMetadata({
      buildId: 'cw-launch',
      category: { scope: ITEM_SCOPES.use, child },
      search: {},
      count: 100,
    });
    expect(cleanMeta.robots).toBe('index,follow');
  });
});
