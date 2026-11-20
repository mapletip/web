import { SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import type { SimpleGridProps } from '@mantine/core';
import { MagnifyingGlass } from '@phosphor-icons/react';
import type { ReactElement, ReactNode } from 'react';

import classes from './DetailCardList.module.css';

export interface DetailCardListSearch<Item> {
  readonly label: string;
  readonly placeholder: string;
  readonly noMatchesMessage: string;
  readonly matches: (item: Item, normalizedQuery: string) => boolean;
  readonly countMessage?: (
    matchingCount: number,
    totalCount: number,
  ) => ReactNode;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export interface DetailCardListProps<Item> {
  readonly items: readonly Item[];
  readonly getKey: (item: Item) => string;
  readonly renderItem: (item: Item) => ReactNode;
  readonly search?: DetailCardListSearch<Item>;
  readonly itemTestId?: string;
  readonly density?: SimpleGridProps['cols'];
  readonly equalHeightRows?: boolean;
  readonly listLabel?: string;
  readonly mobileItemLimit?: number;
}

export const DEFAULT_DETAIL_CARD_LIST_DENSITY = { base: 1, sm: 2 } as const;

/** Search and render a reusable list of detail cards. */
export function DetailCardList<Item>({
  items,
  getKey,
  renderItem,
  search,
  itemTestId,
  density = DEFAULT_DETAIL_CARD_LIST_DENSITY,
  equalHeightRows = false,
  listLabel,
  mobileItemLimit,
}: DetailCardListProps<Item>): ReactElement {
  const query = search?.value ?? '';
  const normalizedQuery = query.trim().toLocaleLowerCase('en');

  const matchingItems = items.filter(
    (item) => search?.matches(item, normalizedQuery) ?? true,
  );
  let listContent: ReactNode = null;
  if (matchingItems.length === 0) {
    if (search !== undefined) {
      listContent = <Text role="status">{search.noMatchesMessage}</Text>;
    }
  } else {
    listContent = (
      <SimpleGrid
        component="ul"
        cols={density}
        spacing="sm"
        className={classes['list']}
        data-detail-card-equal-rows={equalHeightRows ? 'true' : undefined}
        data-detail-card-list
        aria-label={listLabel}
      >
        {matchingItems.map((item, index) => (
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

  return (
    <Stack className={classes['root']} gap="md">
      {search === undefined ? null : (
        <TextInput
          label={search.label}
          placeholder={search.placeholder}
          leftSection={<MagnifyingGlass aria-hidden="true" size={16} />}
          value={query}
          onChange={(event) => search.onChange(event.currentTarget.value)}
        />
      )}
      {search?.countMessage?.(matchingItems.length, items.length) ?? null}
      {listContent}
    </Stack>
  );
}
