import { itemIconUrl } from '@mapletip/data/items';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import {
  ALL_ITEMS_COLLECTION_ICONS,
  ItemCollectionIcon,
} from '../ItemCollectionIcon';

describe('ItemCollectionIcon', () => {
  it('renders a decorative 2x2 grid containing the four iconic items', () => {
    const { container } = render(<ItemCollectionIcon />);
    const wrapper = container.firstElementChild as HTMLElement;

    expect(wrapper).not.toBeNull();
    expect(wrapper.tagName).toBe('SPAN');
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');

    const images = Array.from(wrapper.querySelectorAll('img'));
    expect(images).toHaveLength(4);

    images.forEach((img, index) => {
      const config = ALL_ITEMS_COLLECTION_ICONS[index];
      expect(config).toBeDefined();
      expect(img.getAttribute('src')).toBe(
        itemIconUrl(MAPLEKIT_RELEASE.baseUrl, config?.contentId ?? ''),
      );
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('width')).toBe('15');
      expect(img.getAttribute('height')).toBe('15');
      expect(img.getAttribute('decoding')).toBe('async');
    });
  });

  it('preserves custom className on wrapper', () => {
    const { container } = render(
      <ItemCollectionIcon className="custom-test-class" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.classList.contains('custom-test-class')).toBe(true);
  });
});
