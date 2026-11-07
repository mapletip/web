import { BUILDS, type BuildId } from '@/config/maplekit';

import { getItemScope, getItemScopeChild } from './categories';
import type { ItemCategorySelection } from './routing';

export interface ItemPageMetadata {
  readonly heading: string;
  readonly title: string;
  readonly description: string;
}

export function itemPageMetadata(
  buildId: BuildId,
  category: ItemCategorySelection,
): ItemPageMetadata {
  const { label: buildLabel } = BUILDS[buildId];

  if (category.childSlug) {
    const child = getItemScopeChild(category.scope, category.childSlug);
    const childLabel = child?.label ?? category.childSlug;
    return {
      heading: `MapleStory ${buildLabel} ${childLabel}`,
      title: `MapleStory ${buildLabel} ${childLabel} – MapleTip`,
      description: `Browse ${buildLabel} ${childLabel.toLowerCase()} in MapleStory.`,
    };
  }

  if (category.scope !== 'all') {
    const scope = getItemScope(category.scope);
    return {
      heading: `MapleStory ${buildLabel} ${scope.label} Items`,
      title: `MapleStory ${buildLabel} ${scope.label} Items – MapleTip`,
      description: `Browse ${buildLabel} ${scope.label.toLowerCase()} items in MapleStory.`,
    };
  }

  return {
    heading: `MapleStory ${buildLabel} Items`,
    title: `MapleStory ${buildLabel} Items – MapleTip`,
    description: `Browse ${buildLabel} items in MapleStory.`,
  };
}
