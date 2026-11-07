import { BUILDS, type BuildId } from '@/config/maplekit';

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
  const topic =
    category.child?.label ??
    (category.scope.slug === 'all'
      ? 'Items'
      : `${category.scope.label} Items`);

  return {
    heading: `MapleStory ${buildLabel} ${topic}`,
    title: `MapleStory ${buildLabel} ${topic} – MapleTip`,
    description: `Browse ${buildLabel} ${topic.toLowerCase()} in MapleStory.`,
  };
}
