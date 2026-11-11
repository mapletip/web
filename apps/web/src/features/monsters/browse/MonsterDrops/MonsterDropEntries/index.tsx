import { Box, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { Thumbnail } from '@mapletip/component-library';
import { Check, MagnifyingGlass, Question } from '@phosphor-icons/react';
import { useState, type ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';
import { itemCategoryLabel } from '@/features/items/browse/labels';

import type { MonsterBrowseRow, MonsterDropEntry } from '../../project';
import { DropCertaintyDisclosure } from '../DropCertaintyDisclosure';
import { closeDropsPanelOnEscape } from '../escape';
import classes from '../MonsterDrops.module.css';

const CATEGORY_ORDER = [
  'Equipment',
  'Use',
  'ETC',
  'Set-up',
  'Cash Items',
  'Pets',
  'Other',
] as const;

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
  buildId,
  onClose,
}: {
  readonly record: MonsterBrowseRow;
  readonly buildId: BuildId;
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
  const groupedEntries = new Map<string, MonsterDropEntry[]>();
  for (const entry of filteredEntries) {
    const category = itemCategoryLabel(entry.itemCategory);
    const group = groupedEntries.get(category) ?? [];
    group.push(entry);
    groupedEntries.set(category, group);
  }

  const categoryOrder = new Map<string, number>(
    CATEGORY_ORDER.map((category, index) => [category, index]),
  );
  const orderedGroups = [...groupedEntries.entries()].sort(
    ([left], [right]) =>
      (categoryOrder.get(left) ?? CATEGORY_ORDER.length) -
      (categoryOrder.get(right) ?? CATEGORY_ORDER.length),
  );

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
      <Group
        gap="md"
        role="group"
        aria-label="Drop certainty legend"
        className={classes['legend']}
      >
        <Group gap={4} wrap="nowrap">
          <span className={classes['certainty']} data-confirmed="true">
            <Check size={14} aria-hidden="true" />
          </span>
          <Text size="xs">Confirmed</Text>
        </Group>
        <Group gap={4} wrap="nowrap">
          <span className={classes['certainty']} data-confirmed="false">
            <Question size={14} aria-hidden="true" />
          </span>
          <Text size="xs">Unconfirmed</Text>
        </Group>
      </Group>
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
                          entry={entry}
                          buildId={buildId}
                          {...(onClose === undefined ? {} : { onClose })}
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
