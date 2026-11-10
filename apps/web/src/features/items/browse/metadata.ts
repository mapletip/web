import { DEFAULT_BUILD_ID, BUILDS, type BuildId } from '@/config/maplekit';
import { SITE_ORIGIN } from '@/config/site';

import type { ItemCategorySelection } from './routing';
import type { ItemBrowseSearch } from './search-params';

export interface ItemPageMetadata {
  readonly heading: string;
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
  readonly robots: 'index,follow' | 'noindex,follow';
}

export interface ItemPageMetadataOptions {
  readonly buildId: BuildId;
  readonly category: ItemCategorySelection;
  readonly search?: ItemBrowseSearch | undefined;
}

export function itemCategoryPath({
  buildId,
  category,
}: Pick<ItemPageMetadataOptions, 'buildId' | 'category'>): string {
  const buildPrefix = buildId === DEFAULT_BUILD_ID ? '' : `/${buildId}`;
  if (category.scope.slug === 'all') {
    return `/maplestory${buildPrefix}/items`;
  }
  if (category.child) {
    return `/maplestory${buildPrefix}/items/${category.scope.slug}/${category.child.slug}`;
  }
  return `/maplestory${buildPrefix}/items/${category.scope.slug}`;
}

function hasDefaultSearchState(search: ItemBrowseSearch): boolean {
  if (search.q.trim() !== '') return false;
  if (
    search.page !== 1 ||
    search.pageSize !== 50 ||
    search.sort !== 'name-asc'
  ) {
    return false;
  }

  return Object.entries(search).every(([key, value]) => {
    if (['q', 'page', 'pageSize', 'sort'].includes(key)) return true;
    return (
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    );
  });
}

export function itemPageMetadata({
  buildId,
  category,
  search,
}: ItemPageMetadataOptions): ItemPageMetadata {
  const { label: buildLabel } = BUILDS[buildId];
  const topic =
    category.child?.label ??
    (category.scope.slug === 'all' ? 'Items' : `${category.scope.label} Items`);
  const robots =
    buildId === DEFAULT_BUILD_ID &&
    (search === undefined || hasDefaultSearchState(search))
      ? 'index,follow'
      : 'noindex,follow';

  return {
    heading: `MapleStory ${buildLabel} ${topic}`,
    title: `MapleStory ${buildLabel} ${topic} – MapleTip`,
    description: `Browse ${buildLabel} ${topic.toLowerCase()} in MapleStory.`,
    canonicalUrl: `${SITE_ORIGIN}${itemCategoryPath({ buildId, category })}`,
    robots,
  };
}
