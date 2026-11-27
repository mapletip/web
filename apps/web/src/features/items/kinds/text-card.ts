import type { ItemRow } from '../browse/project';
import { formatSellPrice } from '../browse/sell-price';

import type { ItemCardDescription } from './types';

export function textCard({
  extraFact,
}: {
  readonly extraFact?: (row: ItemRow) => string | undefined;
} = {}): ItemCardDescription {
  return {
    layout: 'short',
    columns: { base: 1, md: 2, lg: 2 },
    secondaryLineClamp: 2,
    lead: (row, { descriptions }) => {
      const description = descriptions?.[row.sourceId]?.trim();
      return description || formatSellPrice({ sellPrice: row.sellPrice });
    },
    ...(extraFact === undefined ? {} : { footer: (row) => extraFact(row) }),
  };
}
