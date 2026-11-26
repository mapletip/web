import { RecordCard, Thumbnail } from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';
import type { ReactElement } from 'react';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { ITEM_KINDS } from '../kinds';

import type { CategorizedItemRow } from './project';

export const ITEM_CARD_COLUMNS = { base: 2, md: 4, lg: 5 } as const;
export const ITEM_KIND_LABELS: ReadonlyMap<string, string> = new Map(
  ITEM_KINDS.map((entry) => [entry.id, entry.label]),
);

export interface RenderItemCardOptions {
  readonly record: CategorizedItemRow;
  readonly openDetails?: (() => void) | undefined;
  readonly isDetailsOpen?: boolean | undefined;
  readonly secondaryLine?: string | undefined;
  readonly showCategoryLabel?: boolean | undefined;
}

/** Shared item card renderer used by category pages, cross-category results, and group shelves. */
export function renderItemCard({
  record,
  openDetails,
  isDetailsOpen,
  secondaryLine,
  showCategoryLabel = true,
}: RenderItemCardOptions): ReactElement {
  return (
    <RecordCard
      layout="picture"
      title={record.name}
      leadLine={
        showCategoryLabel ? ITEM_KIND_LABELS.get(record.kind) : undefined
      }
      {...(secondaryLine === undefined ? {} : { secondaryLine })}
      media={
        <Thumbnail
          src={
            record.icon === undefined
              ? undefined
              : itemIconUrl(MAPLEKIT_RELEASE.baseUrl, record.icon)
          }
          size={80}
          magnify={2}
        />
      }
      {...(openDetails === undefined
        ? {}
        : {
            action: openDetails,
            ...(isDetailsOpen === undefined ? {} : { isDetailsOpen }),
          })}
    />
  );
}
