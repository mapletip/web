import { describe, expect, it } from 'vitest';

import { ITEM_SCOPES } from '../categories';
import { itemPageMetadata } from '../metadata';
import { itemBrowseSearchSchema } from '../search-params';

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
      robots: 'noindex,follow',
    });
  });

  it('generates versioned child metadata', () => {
    const child = ITEM_SCOPES.use.children.find((c) => c.slug === 'buffs');
    expect(child).toBeDefined();
    if (!child) return;
    const meta = itemPageMetadata({
      buildId: 'gms-v83',
      category: { scope: ITEM_SCOPES.use, child },
    });
    expect(meta).toEqual({
      heading: 'MapleStory GMS v83 Buffs',
      title: 'MapleStory GMS v83 Buffs – MapleTip',
      description: 'Browse GMS v83 buffs in MapleStory.',
      canonicalUrl: 'https://mapletip.com/maplestory/gms-v83/items/use/buffs',
      robots: 'noindex,follow',
    });
  });

  it('generates canonical child metadata', () => {
    const child = ITEM_SCOPES.setup.children.find((c) => c.slug === 'chairs');
    expect(child).toBeDefined();
    if (!child) return;
    const meta = itemPageMetadata({
      buildId: 'cw-launch',
      category: { scope: ITEM_SCOPES.setup, child },
    });
    expect(meta).toEqual({
      heading: 'MapleStory Classic World Chairs',
      title: 'MapleStory Classic World Chairs – MapleTip',
      description: 'Browse Classic World chairs in MapleStory.',
      canonicalUrl: 'https://mapletip.com/maplestory/items/setup/chairs',
      robots: 'index,follow',
    });
  });

  it('noindexes search results and keeps the clean category as canonical', () => {
    const meta = itemPageMetadata({
      buildId: 'cw-launch',
      category: { scope: ITEM_SCOPES.use },
      search: itemBrowseSearchSchema.parse({ q: 'potion' }),
    });

    expect(meta.canonicalUrl).toBe('https://mapletip.com/maplestory/items/use');
    expect(meta.robots).toBe('noindex,follow');
  });
});
