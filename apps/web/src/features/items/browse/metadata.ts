import { BUILDS, type BuildId } from '@/config/maplekit';
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

interface ItemPageMetadataOptions {
  readonly buildId: BuildId;
  readonly category: ItemCategorySelection;
  readonly search?: ItemBrowseSearch | undefined;
  readonly count?: number | undefined;
}

export function itemCategoryPath(
  buildId: BuildId,
  category: ItemCategorySelection,
): string {
  const buildPrefix = buildId === 'cw-launch' ? '' : `/${buildId}`;
  if (category.scope.slug === 'all') {
    return `/maplestory${buildPrefix}/items`;
  }
  if (category.child) {
    return `/maplestory${buildPrefix}/items/${category.scope.slug}/${category.child.slug}`;
  }
  return `/maplestory${buildPrefix}/items/${category.scope.slug}`;
}

function getItemDescription(
  buildLabel: string,
  category: ItemCategorySelection,
): string {
  const childSlug = category.child?.slug;
  if (childSlug === 'upgrade-scrolls') {
    return `Browse and compare MapleStory ${buildLabel} upgrade scrolls, success rates, stat bonuses, and destruction risks.`;
  }
  if (childSlug === 'recovery') {
    return `Browse and compare MapleStory ${buildLabel} recovery potions and items by HP and MP restoration.`;
  }
  if (childSlug === 'throwing-stars') {
    return `Browse and compare MapleStory ${buildLabel} throwing stars by weapon attack.`;
  }
  if (childSlug === 'arrows') {
    return `Browse MapleStory ${buildLabel} arrows for bows and crossbows.`;
  }
  if (childSlug === 'bullets') {
    return `Browse MapleStory ${buildLabel} bullets and gun ammunition.`;
  }
  if (childSlug === 'pet-food') {
    return `Browse and compare MapleStory ${buildLabel} pet food by fullness and closeness effects.`;
  }
  if (childSlug === 'chairs') {
    return `Browse and compare MapleStory ${buildLabel} chairs by HP Recovered / 10s and MP Recovered / 10s.`;
  }
  if (childSlug === 'quest-items') {
    return `Browse MapleStory ${buildLabel} quest items and requirements.`;
  }
  if (childSlug === 'crafting') {
    return `Browse MapleStory ${buildLabel} crafting materials, recipes, and ingredients.`;
  }
  if (childSlug === 'pets') {
    return `Browse MapleStory ${buildLabel} pets.`;
  }
  if (childSlug === 'cash-items') {
    return `Browse MapleStory ${buildLabel} cash items.`;
  }
  const topic =
    category.child?.label ??
    (category.scope.slug === 'all' ? 'items' : `${category.scope.label} items`);
  return `Browse ${buildLabel} ${topic.toLowerCase()} in MapleStory.`;
}

export function isCleanItemSearch(search?: ItemBrowseSearch): boolean {
  if (!search) return true;

  if (typeof search.q === 'string' && search.q.trim().length > 0) {
    return false;
  }

  const page = search.page;
  if (page !== undefined && Number(page) > 1) {
    return false;
  }

  const pageSize = search.pageSize;
  if (pageSize !== undefined && Number(pageSize) !== 50) {
    return false;
  }

  const sort = search.sort;
  if (sort !== undefined && sort !== '' && sort !== 'name-asc') {
    return false;
  }

  for (const [key, value] of Object.entries(search)) {
    if (['q', 'page', 'pageSize', 'sort'].includes(key)) continue;
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    return false;
  }

  return true;
}

export function itemPageMetadata({
  buildId,
  category,
  search,
  count,
}: ItemPageMetadataOptions): ItemPageMetadata {
  const { label: buildLabel } = BUILDS[buildId];
  const topic =
    category.child?.label ??
    (category.scope.slug === 'all' ? 'Items' : `${category.scope.label} Items`);

  const canonicalUrl = `${SITE_ORIGIN}${itemCategoryPath(buildId, category)}`;
  const isClean = isCleanItemSearch(search);
  const isZeroMember = count === 0;

  const robots: 'index,follow' | 'noindex,follow' =
    isClean && !isZeroMember ? 'index,follow' : 'noindex,follow';

  return {
    heading: `MapleStory ${buildLabel} ${topic}`,
    title: `MapleStory ${buildLabel} ${topic} – MapleTip`,
    description: getItemDescription(buildLabel, category),
    canonicalUrl,
    robots,
  };
}
