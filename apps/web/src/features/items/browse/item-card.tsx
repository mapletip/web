import { RecordCard, Thumbnail } from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';
import type { ReactElement } from 'react';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { ITEM_KINDS_BY_ID } from '../kinds';
import type { ItemCardContext, ItemKind } from '../kinds/types';

import { GameText } from './GameText';
import type { CategorizedItemRow } from './project';

// Cards with the picture beside the text: 1 phone, 2 tablet; short value cards fit 4 wide,
// identity cards with fact or tier rows need 3 (shelf CSS in ItemsGroupPage.module.css follows).
const SHORT_CARD_COLUMNS = { base: 1, sm: 2, lg: 4 } as const;
const IDENTITY_CARD_COLUMNS = { base: 1, sm: 2, lg: 3 } as const;

/** Grid columns for a category's cards. */
export function itemCardColumns({
  kind,
}: {
  readonly kind: ItemKind | undefined;
}): {
  readonly base: number;
  readonly sm?: number;
  readonly md?: number;
  readonly lg: number;
} {
  if (kind?.card?.columns !== undefined) return kind.card.columns;
  return kind?.card?.layout === 'identity' ||
    kind?.card?.layout === 'quietIdentity'
    ? IDENTITY_CARD_COLUMNS
    : SHORT_CARD_COLUMNS;
}
export const ITEM_KIND_LABELS: ReadonlyMap<string, string> = new Map(
  [...ITEM_KINDS_BY_ID].map(([id, kind]) => [id, kind.label]),
);

interface RenderItemCardOptions {
  readonly record: CategorizedItemRow;
  readonly openDetails?: (() => void) | undefined;
  readonly isDetailsOpen?: boolean | undefined;
  readonly secondaryLine?: string | undefined;
  /** Cross-category results use the category and primary fact as their quiet line. */
  readonly crossCategory?: boolean | undefined;
  readonly context?: ItemCardContext | undefined;
  readonly openItemDetails?: ((sourceId: string) => void) | undefined;
}

// 32px item icons, magnified to fill the aside media slot.
const ASIDE_THUMBNAIL = { size: 48, magnify: 1.5 } as const;

/** Shared item card renderer used by category pages, cross-category results, and group shelves. */
export function renderItemCard({
  record,
  openDetails,
  isDetailsOpen,
  secondaryLine,
  crossCategory = false,
  context = { coverage: undefined, relations: {} },
  openItemDetails,
}: RenderItemCardOptions): ReactElement {
  const kind: ItemKind | undefined = ITEM_KINDS_BY_ID.get(record.kind);
  // Category cards only on their own category page and shelf.
  const card = crossCategory ? undefined : kind?.card;
  const layout = card?.layout ?? 'short';
  const value = card?.value?.(record, context);
  const fact = crossCategory
    ? [ITEM_KIND_LABELS.get(record.kind), secondaryLine]
        .filter((part): part is string => part !== undefined)
        .join(' · ')
    : (secondaryLine ?? card?.lead?.(record, context));
  const renderedFact =
    fact === undefined || typeof fact === 'string' ? (
      fact
    ) : (
      <GameText segments={fact} />
    );
  const footer = card?.footer?.(record, context);
  const media = card?.media?.(record, context) ?? (
    <Thumbnail
      src={
        record.icon === undefined
          ? undefined
          : itemIconUrl(MAPLEKIT_RELEASE.baseUrl, record.icon)
      }
      {...ASIDE_THUMBNAIL}
    />
  );
  const shared = {
    title: record.name,
    media,
    ...(openDetails === undefined
      ? {}
      : {
          action: openDetails,
          ...(isDetailsOpen === undefined ? {} : { isDetailsOpen }),
        }),
  };
  if (layout === 'quietIdentity') {
    return (
      <RecordCard
        layout="quietIdentity"
        {...(renderedFact === undefined ? {} : { leadLine: renderedFact })}
        {...(card?.inlineLabels === undefined
          ? {}
          : { inlineLabels: card.inlineLabels(record, context) })}
        {...(card?.detailLine === undefined
          ? {}
          : { detailLine: card.detailLine(record, context) })}
        {...(card?.detailFirst === undefined
          ? {}
          : { detailFirst: card.detailFirst })}
        {...shared}
      />
    );
  }
  if (layout === 'identity') {
    const facts = card?.facts?.(record, {
      ...context,
      ...(openItemDetails ? { openItemDetails } : {}),
    });
    return (
      <RecordCard
        layout="identity"
        {...(renderedFact === undefined ? {} : { leadLine: renderedFact })}
        {...(facts === undefined ? {} : { facts })}
        {...shared}
      />
    );
  }
  return (
    <RecordCard
      layout="compactMediaAside"
      {...(value === undefined ? {} : { value })}
      {...(renderedFact === undefined ? {} : { secondaryLine: renderedFact })}
      {...(card?.secondaryLineClamp === undefined
        ? {}
        : { secondaryLineClamp: card.secondaryLineClamp })}
      {...(footer === undefined ? {} : { footer })}
      {...shared}
    />
  );
}
