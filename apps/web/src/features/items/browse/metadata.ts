import type { BuildId } from '@/config/maplekit';
import {
  browsePageMetadata,
  type BrowsePageMetadata,
} from '@/features/browse/metadata';
import { buildCollectionPath } from '@/features/detail';

import type { ItemCategorySelection } from './routing';
import { itemBrowseSearch, type ItemBrowseSearch } from './search-params';

export type ItemPageMetadata = BrowsePageMetadata;

export interface ItemPageMetadataOptions {
  readonly buildId: BuildId;
  readonly category: ItemCategorySelection;
  readonly search?: ItemBrowseSearch | undefined;
}

export function itemCategoryPath({
  buildId,
  category,
}: Pick<ItemPageMetadataOptions, 'buildId' | 'category'>): string {
  const items = buildCollectionPath('items', buildId);
  if (category.scope.slug === 'all') return items;
  if (category.child) {
    return `${items}/${category.scope.slug}/${category.child.slug}`;
  }
  return `${items}/${category.scope.slug}`;
}

export function itemPageMetadata({
  buildId,
  category,
  search,
}: ItemPageMetadataOptions): ItemPageMetadata {
  return browsePageMetadata({
    buildId,
    topic:
      category.child?.label ??
      (category.scope.slug === 'all'
        ? 'Items'
        : `${category.scope.label} Items`),
    path: itemCategoryPath({ buildId, category }),
    isDefaultView:
      search === undefined || itemBrowseSearch.isDefaultSearch(search),
  });
}
