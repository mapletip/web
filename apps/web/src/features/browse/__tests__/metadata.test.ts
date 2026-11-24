import { describe, expect, it } from 'vitest';

import { browsePageMetadata } from '../metadata';

describe('browsePageMetadata', () => {
  it('indexes the default build default view with the canonical path', () => {
    expect(
      browsePageMetadata({
        buildId: 'cw-launch',
        topic: 'Maps',
        path: '/maplestory/maps',
      }),
    ).toEqual({
      heading: 'MapleStory Classic World Maps',
      title: 'MapleStory Classic World Maps – MapleTip',
      description: 'Browse Classic World maps in MapleStory.',
      canonicalUrl: 'https://mapletip.com/maplestory/maps',
      robots: 'index,follow',
    });
  });

  it('does not index a non-default view and keeps the page canonical', () => {
    const meta = browsePageMetadata({
      buildId: 'cw-launch',
      topic: 'Maps',
      path: '/maplestory/maps',
      isDefaultView: false,
    });

    expect(meta.robots).toBe('noindex,follow');
    expect(meta.canonicalUrl).toBe('https://mapletip.com/maplestory/maps');
  });

  it('does not index other builds and accepts domain copy', () => {
    const meta = browsePageMetadata({
      buildId: 'gms-v83',
      topic: 'Monsters',
      path: '/maplestory/gms-v83/monsters',
      description: 'Custom.',
    });

    expect(meta.robots).toBe('noindex,follow');
    expect(meta.description).toBe('Custom.');
  });
});
