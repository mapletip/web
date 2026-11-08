/**
 * The single category registry for MapleStory Items Browse.
 *
 * Within a scope, every item belongs to EXACTLY ONE child.
 * Positive children form an ordered list where order defines precedence:
 * an item is assigned to the FIRST positive child whose predicate matches.
 * If no positive child matches, it falls through to the scope's Other child
 * (if present).
 *
 * Scopes are disjoint by itemClass. Membership is always scope AND assignment.
 */
import { cashScope } from './cash';
import { etcScope } from './etc';
import { setupScope } from './setup';
import type { ItemCategoryScope, ItemScopeSlug } from './types';
import { useScope } from './use';

export const allScope: ItemCategoryScope = {
  slug: 'all',
  label: 'All Items',
  itemClasses: ['consume', 'etc', 'setup', 'cash', 'pet'],
  children: [],
};

export const ITEM_SCOPES: Readonly<Record<ItemScopeSlug, ItemCategoryScope>> = {
  all: allScope,
  use: useScope,
  etc: etcScope,
  setup: setupScope,
  cash: cashScope,
};

export { ITEM_SCOPE_SLUGS } from './types';
export type {
  ItemCategoryChild,
  ItemCategoryScope,
  ItemOtherChild,
  ItemPositiveChild,
  ItemScopeSlug,
} from './types';
export { cashScope } from './cash';
export { etcScope } from './etc';
export { setupScope } from './setup';
export { useScope } from './use';
