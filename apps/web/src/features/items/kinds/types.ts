import type {
  BrowseSortOption,
  FacetDefinition,
  QueryFieldDefinition,
} from '@mapletip/component-library';
import type { ItemBrowseCoverage } from '@mapletip/data/items';

import type { CategorizedItemRow, ItemRow } from '../browse/project';

export interface ItemCardDescription {
  readonly layout?: 'picture' | 'short';
  readonly lead: (row: ItemRow) => string | undefined;
  /** Pills and filters for the category page, given only this category's rows. */
  readonly facets?: (context: {
    readonly rows: readonly CategorizedItemRow[];
    readonly coverage: ItemBrowseCoverage | undefined;
  }) => readonly FacetDefinition<CategorizedItemRow>[];
  readonly queryFields?: readonly QueryFieldDefinition<CategorizedItemRow>[];
  readonly sortOptions?: readonly BrowseSortOption[];
}

export interface ItemKind {
  readonly id: string;
  readonly group: 'use' | 'etc' | 'setup' | 'cash';
  readonly slug: string;
  readonly label: string;
  readonly iconContentId?: string;
  readonly matches: (row: ItemRow) => boolean;
  readonly card?: ItemCardDescription;
}
