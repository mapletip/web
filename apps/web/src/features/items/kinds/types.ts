import type {
  BrowseSortOption,
  FacetDefinition,
  QueryFieldDefinition,
} from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import type { CategorizedItemRow, ItemRow } from '../browse/project';
import type {
  ProjectedRelationKind,
  ProjectedRelations,
} from '../browse/relation-projection';

export interface ItemCardContext {
  readonly coverage: ItemBrowseCoverage | undefined;
  readonly relations: ProjectedRelations;
}

export interface ItemCardDescription {
  readonly layout?: 'picture' | 'short';
  readonly lead: (row: ItemRow, context: ItemCardContext) => string | undefined;
  /** Pills and filters for the category page, given only this category's rows. */
  readonly facets?: (
    context: ItemCardContext & { readonly rows: readonly CategorizedItemRow[] },
  ) => readonly FacetDefinition<CategorizedItemRow>[];
  readonly queryFields?: (
    context: ItemCardContext,
  ) => readonly QueryFieldDefinition<CategorizedItemRow>[];
  readonly sortOptions?: readonly BrowseSortOption[];
}

export interface ItemKind {
  readonly id: string;
  readonly group: 'use' | 'etc' | 'setup' | 'cash';
  readonly slug: string;
  readonly label: string;
  readonly iconContentId?: string;
  readonly matches: (row: ItemRow) => boolean;
  readonly relations?: readonly ProjectedRelationKind[];
  readonly card?: ItemCardDescription;
}
