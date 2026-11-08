import type { ItemBrowseClass, ItemRow } from '../project';

export const ITEM_SCOPE_SLUGS = ['all', 'use', 'etc', 'setup', 'cash'] as const;
export type ItemScopeSlug = (typeof ITEM_SCOPE_SLUGS)[number];

export interface ItemPositiveChild {
  readonly kind: 'positive';
  readonly slug: string;
  readonly label: string;
  readonly matches: (row: ItemRow) => boolean;
  readonly iconContentIds?: readonly string[];
}

export interface ItemOtherChild {
  readonly kind: 'other';
  readonly slug: string;
  readonly label: string;
  readonly iconContentIds?: readonly string[];
}

export type ItemCategoryChild = ItemPositiveChild | ItemOtherChild;

export interface ItemCategoryScope {
  readonly slug: ItemScopeSlug;
  readonly label: string;
  readonly itemClasses: readonly ItemBrowseClass[];
  readonly children: readonly ItemCategoryChild[];
}
