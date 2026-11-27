import type {
  BrowseSortOption,
  FacetDefinition,
  QueryFieldDefinition,
  RecordFact,
} from '@mapletip/component-library';
import type {
  ItemBrowseCoverage,
  StaticItemBrowseV2_2,
} from '@mapletip/data/items';
import type { ReactNode } from 'react';

import type { CategorizedItemRow, ItemRow } from '../browse/project';
import type {
  ProjectedRelationKind,
  ProjectedRelations,
} from '../browse/relation-projection';

export interface ItemCardContext {
  readonly coverage: ItemBrowseCoverage | undefined;
  readonly relations: ProjectedRelations;
  readonly descriptions?: Readonly<Record<string, string>>;
  readonly scrollTargetIcons?: StaticItemBrowseV2_2['scrollTargetIcons'];
  readonly openItemDetails?: (sourceId: string) => void;
}

export interface ItemCardDescription {
  readonly layout?: 'picture' | 'short' | 'identity';
  readonly columns?: {
    readonly base: number;
    readonly md?: number;
    readonly lg: number;
  };
  readonly media?: (
    row: CategorizedItemRow,
    context: ItemCardContext,
  ) => ReactNode;
  readonly lead: (row: ItemRow, context: ItemCardContext) => string | undefined;
  readonly secondaryLineClamp?: number;
  readonly footer?: (
    row: CategorizedItemRow,
    context: ItemCardContext,
  ) => string | undefined;
  readonly facts?: (
    row: CategorizedItemRow,
    context: ItemCardContext,
  ) => readonly RecordFact[];
  /** Category records to list after projecting the flat item rows. */
  readonly group?: (
    context: ItemCardContext & { readonly rows: readonly CategorizedItemRow[] },
  ) => readonly CategorizedItemRow[];
  readonly groupMembers?: (options: {
    readonly record: CategorizedItemRow;
  }) => readonly CategorizedItemRow[];
  /** Pills and filters for the category page, given only this category's rows. */
  readonly facets?: (
    context: ItemCardContext & { readonly rows: readonly CategorizedItemRow[] },
  ) => readonly FacetDefinition<CategorizedItemRow>[];
  readonly drawerContent?: (options: {
    readonly record: CategorizedItemRow;
    readonly selectedRecordId: string;
    readonly context: ItemCardContext;
    readonly openRecordDetails: (sourceId: string) => void;
  }) => ReactNode;
  readonly queryFields?: (
    context: ItemCardContext,
  ) => readonly QueryFieldDefinition<CategorizedItemRow>[];
  readonly sortOptions?: readonly BrowseSortOption[];
  readonly defaultSort?: BrowseSortOption;
}

export interface ItemKind {
  readonly id: string;
  readonly group: 'use' | 'etc' | 'setup' | 'cash';
  readonly slug: string;
  readonly label: string;
  readonly iconContentId?: string;
  readonly matches: (row: ItemRow) => boolean;
  readonly relations?: readonly ProjectedRelationKind[];
  readonly descriptions?: true;
  readonly card?: ItemCardDescription;
}
