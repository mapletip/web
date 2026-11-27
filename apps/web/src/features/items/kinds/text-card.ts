import { formatGameText } from '../browse/game-text';
import { formatSellPrice } from '../browse/sell-price';

import type { ItemCardDescription } from './types';

export function textCard(): ItemCardDescription {
  return {
    layout: 'short',
    columns: { base: 1, md: 2, lg: 2 },
    secondaryLineClamp: 2,
    lead: (row, { descriptions }) => {
      const description = descriptions?.[row.sourceId];
      if (description !== undefined) {
        const segments = formatGameText({ text: description });
        if (segments.length > 0) return segments;
      }
      return formatSellPrice({ sellPrice: row.sellPrice });
    },
  };
}
