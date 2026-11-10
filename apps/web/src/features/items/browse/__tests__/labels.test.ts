import { describe, expect, it } from 'vitest';

import { itemCategoryLabel } from '../labels';

describe('itemCategoryLabel', () => {
  it('uses the Items browse labels for item classes and equipment slots', () => {
    expect(itemCategoryLabel('consume')).toBe('Use');
    expect(itemCategoryLabel('etc')).toBe('ETC');
    expect(itemCategoryLabel('setup')).toBe('Set-up');
    expect(itemCategoryLabel('cash')).toBe('Cash Items');
    expect(itemCategoryLabel('pet')).toBe('Pets');
    expect(itemCategoryLabel('equipment')).toBe('Equipment');
    expect(itemCategoryLabel('unrecognized')).toBe('Other');
    expect(itemCategoryLabel(undefined)).toBe('Other');
  });
});
