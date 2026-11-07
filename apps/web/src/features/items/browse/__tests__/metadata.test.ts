import { describe, expect, it } from 'vitest';

import { itemPageMetadata } from '../metadata';

describe('itemPageMetadata', () => {
  it('generates canonical all items metadata', () => {
    const meta = itemPageMetadata('cw-launch', { scope: 'all' });
    expect(meta).toEqual({
      heading: 'MapleStory Classic World Items',
      title: 'MapleStory Classic World Items – MapleTip',
      description: 'Browse Classic World items in MapleStory.',
    });
  });

  it('generates versioned scope metadata', () => {
    const meta = itemPageMetadata('gms-v83', { scope: 'use' });
    expect(meta).toEqual({
      heading: 'MapleStory GMS v83 Use Items',
      title: 'MapleStory GMS v83 Use Items – MapleTip',
      description: 'Browse GMS v83 use items in MapleStory.',
    });
  });

  it('generates versioned child metadata', () => {
    const meta = itemPageMetadata('gms-v83', {
      scope: 'use',
      childSlug: 'potions',
    });
    expect(meta).toEqual({
      heading: 'MapleStory GMS v83 Potions',
      title: 'MapleStory GMS v83 Potions – MapleTip',
      description: 'Browse GMS v83 potions in MapleStory.',
    });
  });

  it('generates canonical child metadata', () => {
    const meta = itemPageMetadata('cw-launch', {
      scope: 'setup',
      childSlug: 'chairs',
    });
    expect(meta).toEqual({
      heading: 'MapleStory Classic World Chairs',
      title: 'MapleStory Classic World Chairs – MapleTip',
      description: 'Browse Classic World chairs in MapleStory.',
    });
  });
});
