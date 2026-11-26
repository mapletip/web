import { Box, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { Thumbnail } from '@mapletip/component-library';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useState, type ReactElement } from 'react';

import {
  DropCertaintyDisclosure,
  DropCertaintyLegend,
  getMonsterDropCategoryId,
  MONSTER_DROP_CATEGORIES,
} from '@/features/monsters/shared';

import type { MonsterBrowseRow, MonsterDropEntry } from '../../project';
import { closeDropsPanelOnEscape } from '../escape';
import classes from '../MonsterDrops.module.css';

function itemReferenceLabel(state: string): string | undefined {
  if (state === 'resolved') return undefined;
  if (state === 'unresolved') return 'Unresolved item reference';
  if (state === 'ambiguous') return 'Ambiguous item reference';
  if (state === 'absent') return '-';
  if (state === 'unsupported') return 'Item reference unsupported';
  return 'Item reference unknown';
}

function matchesDropSearch(entry: MonsterDropEntry, query: string): boolean {
  const searchable = [entry.itemName, entry.itemCategory, entry.itemRefState]
    .filter((value): value is string => value !== undefined)
    .join(' ')
    .toLocaleLowerCase();
  return searchable.includes(query);
}

export function MonsterDropEntries({
  record,
  onClose,
}: {
  readonly record: MonsterBrowseRow;
  readonly onClose?: () => void;
}): ReactElement {
  const [search, setSearch] = useState('');

  if (record.drops.entries.length === 0) {
    return <Text size="sm">No drops have been recorded for this monster</Text>;
  }

  const query = search.trim().toLocaleLowerCase();
  const filteredEntries = record.drops.entries.filter((entry) =>
    matchesDropSearch(entry, query),
  );
  const groupedEntries = new Map<
    (typeof MONSTER_DROP_CATEGORIES)[number]['id'],
    MonsterDropEntry[]
  >();
  for (const entry of filteredEntries) {
    const category = getMonsterDropCategoryId(entry.itemCategory);
    const group = groupedEntries.get(category) ?? [];
    group.push(entry);
    groupedEntries.set(category, group);
  }

  const orderedGroups = MONSTER_DROP_CATEGORIES.flatMap((category) => {
    const entries = groupedEntries.get(category.id);
    return entries === undefined
      ? []
      : [[category.browseLabel, entries] as const];
  });

  return (
    <Stack gap="sm">
      <TextInput
        aria-label="Search items"
        className={classes['search']}
        placeholder="Search Items"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        onKeyDown={(event) => closeDropsPanelOnEscape(event, onClose)}
        leftSection={<MagnifyingGlass aria-hidden="true" size={16} />}
        size="sm"
      />
      <DropCertaintyLegend />
      {orderedGroups.length === 0 ? (
        <Text size="sm" c="dimmed">
          No drop entries match “{search.trim()}”.
        </Text>
      ) : (
        <Stack gap="sm">
          {orderedGroups.map(([category, entries]) => (
            <section className={classes['category']} key={category}>
              <Title className={classes['categoryTitle']} order={4} size="sm">
                {category}
              </Title>
              <div className={classes['items']}>
                {entries.map((entry, index) => {
                  const reference = itemReferenceLabel(entry.itemRefState);
                  return (
                    <Box
                      className={classes['item']}
                      key={`${entry.itemKey ?? entry.itemName}:${index}`}
                    >
                      <Group
                        className={classes['itemRow']}
                        gap="xs"
                        justify="space-between"
                        wrap="nowrap"
                      >
                        <Group
                          className={classes['itemIdentity']}
                          gap="xs"
                          wrap="nowrap"
                        >
                          {entry.itemIconUrl === undefined ? null : (
                            <Thumbnail
                              src={entry.itemIconUrl}
                              size={32}
                              alt=""
                            />
                          )}
                          <Text size="sm" className={classes['itemName']}>
                            {entry.itemName}
                          </Text>
                        </Group>
                        <DropCertaintyDisclosure
                          itemName={entry.itemName}
                          confirmed={entry.confirmed}
                          sources={entry.sources}
                          onEscape={(event) =>
                            closeDropsPanelOnEscape(event, onClose)
                          }
                        />
                      </Group>
                      {reference ? (
                        <Text size="xs" c="dimmed">
                          {reference}
                        </Text>
                      ) : null}
                    </Box>
                  );
                })}
              </div>
            </section>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
