import type { ItemBrowseClass, ItemRow } from '../project';

export const ITEM_SCOPE_SLUGS = ['all', 'use', 'etc', 'setup', 'cash'] as const;
export type ItemScopeSlug = (typeof ITEM_SCOPE_SLUGS)[number];

export interface ItemPositiveChild<TSlug extends string = string> {
  readonly kind: 'positive';
  readonly slug: TSlug;
  readonly label: string;
  readonly matches: (row: ItemRow) => boolean;
  readonly iconContentIds?: readonly string[];
}

export interface ItemOtherChild<TSlug extends string = string> {
  readonly kind: 'other';
  readonly slug: TSlug;
  readonly label: string;
  readonly iconContentIds?: readonly string[];
}

export type ItemCategoryChild<TSlug extends string = string> =
  ItemPositiveChild<TSlug> | ItemOtherChild<TSlug>;

export interface ItemCategoryScope<
  TSlug extends ItemScopeSlug = ItemScopeSlug,
  TChildren extends readonly ItemCategoryChild[] = readonly ItemCategoryChild[],
> {
  readonly slug: TSlug;
  readonly label: string;
  readonly itemClasses: readonly ItemBrowseClass[];
  readonly children: TChildren;
}
