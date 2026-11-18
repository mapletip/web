import { SimpleGrid } from '@mantine/core';
import type { SimpleGridProps } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import classes from './DetailCardList.module.css';

export interface DetailCardListProps<Item> {
  readonly items: readonly Item[];
  readonly getKey: (item: Item) => string;
  readonly renderItem: (item: Item) => ReactNode;
  readonly itemTestId?: string;
  readonly density?: SimpleGridProps['cols'];
  readonly listLabel?: string;
  readonly mobileItemLimit?: number;
}

export const DEFAULT_DETAIL_CARD_LIST_DENSITY = { base: 1, sm: 2 } as const;

/** Render a responsive grid of related record cards. */
export function DetailCardList<Item>({
  items,
  getKey,
  renderItem,
  itemTestId,
  density = DEFAULT_DETAIL_CARD_LIST_DENSITY,
  listLabel,
  mobileItemLimit,
}: DetailCardListProps<Item>): ReactElement | null {
  if (items.length === 0) return null;

  return (
    <SimpleGrid
      component="ul"
      cols={density}
      spacing="sm"
      className={classes['list']}
      data-detail-card-list
      aria-label={listLabel}
    >
      {items.map((item, index) => (
        <li
          className={classes['item']}
          data-testid={itemTestId}
          data-mobile-hidden={
            mobileItemLimit !== undefined && index >= mobileItemLimit
              ? 'true'
              : undefined
          }
          key={getKey(item)}
        >
          {renderItem(item)}
        </li>
      ))}
    </SimpleGrid>
  );
}
