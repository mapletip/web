import {
  ActionIcon,
  Box,
  Button,
  CloseButton,
  Drawer,
  Group,
  HoverCard,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  Check,
  MagnifyingGlass,
  Package,
  Question,
} from '@phosphor-icons/react';
import { useId, useState, type KeyboardEvent, type ReactElement } from 'react';

import { BUILDS, isBuildId, type BuildId } from '@/config/maplekit';

import classes from './MonsterDrops.module.css';
import { MonsterSprite } from './MonsterSprite';
import type {
  MonsterBrowseRow,
  MonsterDropCountFact,
  MonsterDropEntry,
  MonsterHistoricalDropCountFact,
} from './project';

const CATEGORY_ORDER = [
  'Equipment',
  'Usable',
  'ETC',
  'Setup',
  'Cash',
  'Pets',
  'Other',
] as const;

export function dropListingCountText(record: MonsterBrowseRow): string {
  const count = record.drops.entries.length;
  if (count > 0) {
    return `${count.toLocaleString('en-US')} ${count === 1 ? 'drop' : 'drops'}`;
  }
  return '0';
}

export function dropListingActionLabel(
  record: MonsterBrowseRow,
  expanded: boolean,
): string {
  return `${record.name}, ${dropListingCountText(record)}. ${expanded ? 'Hide' : 'Show'} drops.`;
}

function dropDrawerActionLabel(record: MonsterBrowseRow): string {
  return dropListingActionLabel(record, false);
}

function buildLabel(buildId: string): string {
  return isBuildId(buildId) ? BUILDS[buildId].label : buildId;
}

function closePanelOnEscape(
  event: KeyboardEvent<HTMLElement>,
  onClose: (() => void) | undefined,
): void {
  if (
    event.key !== 'Escape' ||
    event.defaultPrevented ||
    onClose === undefined
  ) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  onClose();
}

function nativeDropLabel(fact: MonsterDropCountFact): string {
  if (fact.state === 'known') {
    const count = fact.count.toLocaleString('en-US');
    return fact.lowerBound ? `At least ${count} (partial coverage)` : count;
  }
  if (fact.state === 'absent') return 'No native source';
  if (fact.state === 'unknown') return 'Unknown';
  return 'Unsupported';
}

function historicalDropLabel(fact: MonsterHistoricalDropCountFact): string {
  if (fact.state === 'known') {
    const sources = fact.sourceBuilds.map(buildLabel).join(', ');
    return `${fact.count.toLocaleString('en-US')} historical (${sources})`;
  }
  if (fact.state === 'absent') return 'None recorded';
  if (fact.state === 'unknown') return 'Unknown';
  return 'Unsupported';
}

export function MonsterDropSummary({
  record,
}: {
  readonly record: MonsterBrowseRow;
}): ReactElement {
  return (
    <Stack
      gap={0}
      aria-label={`Native drops: ${nativeDropLabel(record.drops.native)}. Historical drops: ${historicalDropLabel(record.drops.historical)}.`}
    >
      <Text size="xs">
        <strong>Native:</strong> {nativeDropLabel(record.drops.native)}
      </Text>
      <Text size="xs">
        <strong>Historical:</strong>{' '}
        {historicalDropLabel(record.drops.historical)}
      </Text>
    </Stack>
  );
}

function categoryLabel(category: string | undefined): string {
  if (category === 'consume') return 'Usable';
  if (category === 'etc') return 'ETC';
  if (category === 'setup') return 'Setup';
  if (category === 'cash') return 'Cash';
  if (category === 'pet') return 'Pets';
  if (category === undefined) return 'Other';
  // Remaining typed categories are equipment slots, such as caps and pants.
  return 'Equipment';
}

function itemReferenceLabel(state: string): string | undefined {
  if (state === 'resolved') return undefined;
  if (state === 'unresolved') return 'Unresolved item reference';
  if (state === 'ambiguous') return 'Ambiguous item reference';
  if (state === 'absent') return 'Item reference not recorded';
  if (state === 'unsupported') return 'Item reference unsupported';
  return 'Item reference unknown';
}

function dropSourceLabel(
  entry: MonsterDropEntry,
  buildId: BuildId,
): string | undefined {
  // The published drop roster omits source type. The released GMS v83 native
  // assertions and CW historical overlays attributed to GMS v83 are sourced
  // from the Monster Book, as established by the source projection contract.
  if (entry.assertionKind === 'native' && buildId === 'gms-v83') {
    return `${BUILDS[buildId].label} Monster Book`;
  }
  if (entry.sourceBuild !== undefined) {
    const label = buildLabel(entry.sourceBuild);
    return entry.sourceBuild === 'gms-v83' ? `${label} Monster Book` : label;
  }
  return undefined;
}

function DropCertaintyDisclosure({
  entry,
  buildId,
  onClose,
}: {
  readonly entry: MonsterDropEntry;
  readonly buildId: BuildId;
  readonly onClose?: () => void;
}): ReactElement {
  const confirmed = entry.assertionKind === 'native';
  const stateLabel = confirmed ? 'Confirmed' : 'Maybe';
  const actionLabel = `Show ${confirmed ? 'confirmed' : 'unconfirmed'} drop details for ${entry.itemName}`;
  const sourceLabel = dropSourceLabel(entry, buildId);

  function handleEscape(event: KeyboardEvent<HTMLElement>): void {
    if (
      event.key !== 'Escape' ||
      event.currentTarget.getAttribute('aria-expanded') === 'true'
    ) {
      return;
    }
    closePanelOnEscape(event, onClose);
  }

  return (
    <HoverCard
      events={{ hover: true, focus: true, touch: true }}
      interactive
      closeDelay={150}
      returnFocus
      role="dialog"
      position="bottom"
      width={280}
      withinPortal
      withArrow
      middlewares={{ flip: true, shift: true }}
      styles={{ dropdown: { maxWidth: 'calc(100vw - 24px)' } }}
    >
      <HoverCard.Target>
        <ActionIcon
          type="button"
          variant="transparent"
          size="sm"
          className={classes['certainty']}
          data-confirmed={confirmed}
          aria-label={actionLabel}
          data-mantine-stop-propagation={
            onClose === undefined ? undefined : 'true'
          }
          onKeyDownCapture={handleEscape}
        >
          {confirmed ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Question size={14} aria-hidden="true" />
          )}
        </ActionIcon>
      </HoverCard.Target>
      <HoverCard.Dropdown
        role="dialog"
        aria-label={`${stateLabel} drop details for ${entry.itemName}`}
      >
        <Stack gap={4}>
          <Text fw={600} size="sm">
            {stateLabel}
          </Text>
          {sourceLabel === undefined ? null : (
            <Text size="xs" c="dimmed">
              Source: {sourceLabel}.
            </Text>
          )}
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}

function matchesDropSearch(entry: MonsterDropEntry, query: string): boolean {
  const searchable = [entry.itemName, entry.itemCategory, entry.itemRefState]
    .filter((value): value is string => value !== undefined)
    .join(' ')
    .toLocaleLowerCase();
  return searchable.includes(query);
}

function MonsterDropEntries({
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
    const category = categoryLabel(entry.itemCategory);
    const group = groupedEntries.get(category) ?? [];
    group.push(entry);
    groupedEntries.set(category, group);
  }

  const orderedGroups = [...groupedEntries.entries()].sort(
    ([left], [right]) =>
      CATEGORY_ORDER.indexOf(left as (typeof CATEGORY_ORDER)[number]) -
      CATEGORY_ORDER.indexOf(right as (typeof CATEGORY_ORDER)[number]),
  );

  return (
    <Stack gap="sm">
      <TextInput
        aria-label="Search items"
        className={classes['search']}
        placeholder="Search Items"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        onKeyDown={(event) => closePanelOnEscape(event, onClose)}
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
                        gap="sm"
                        justify="space-between"
                        wrap="nowrap"
                      >
                        <Text size="sm" className={classes['itemName']}>
                          {entry.itemName}
                        </Text>
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

export function MonsterDropListing({
  record,
  buildId,
  onClose,
}: {
  readonly record: MonsterBrowseRow;
  readonly buildId: BuildId;
  readonly onClose: () => void;
}): ReactElement {
  const countText = `Drops (${record.drops.entries.length.toLocaleString('en-US')})`;

  return (
    <section
      className={classes['panel']}
      aria-label={`${record.name} ${countText}`}
    >
      <Group
        className={classes['panelHeader']}
        justify="space-between"
        gap="sm"
      >
        <Group gap="xs">
          <Package size={18} aria-hidden="true" />
          <Title order={3} size="md">
            {countText}
          </Title>
        </Group>
        <CloseButton
          aria-label={`Close Drops for ${record.name}`}
          onClick={onClose}
          onKeyDown={(event) => closePanelOnEscape(event, onClose)}
          size="sm"
          className={classes['panelClose']}
        />
      </Group>
      <MonsterDropEntries record={record} buildId={buildId} onClose={onClose} />
    </section>
  );
}

export function MonsterDropDrawerControl({
  record,
  buildId,
}: {
  readonly record: MonsterBrowseRow;
  readonly buildId: BuildId;
}): ReactElement {
  const [opened, setOpened] = useState(false);
  const drawerId = useId();
  const actionLabel = dropDrawerActionLabel(record);
  const levelLabel =
    record.level === undefined ? 'Level unknown' : `Level ${record.level}`;

  return (
    <>
      <Button
        type="button"
        variant={opened ? 'light' : 'default'}
        size="compact-sm"
        radius="sm"
        leftSection={<Package size={14} aria-hidden="true" />}
        classNames={{
          section: classes['triggerSection'],
          label: classes['triggerLabel'],
        }}
        aria-haspopup="dialog"
        aria-expanded={opened}
        aria-controls={drawerId}
        aria-label={actionLabel}
        title={actionLabel}
        onClick={() => setOpened(true)}
      >
        {record.drops.entries.length.toLocaleString('en-US')}
      </Button>
      <Drawer
        id={drawerId}
        opened={opened}
        onClose={() => setOpened(false)}
        position="bottom"
        size="50vh"
        radius="md"
        classNames={{
          content: classes['drawerContent'],
          header: classes['drawerHeader'],
          body: classes['drawerScrollBody'],
        }}
        title={
          <Group gap="sm" wrap="nowrap">
            <MonsterSprite sprite={record.sprite} />
            <Stack gap={0}>
              <Text fw={600}>{record.name}</Text>
              <Text size="xs" c="dimmed">
                {levelLabel} · Monster relationships
              </Text>
            </Stack>
          </Group>
        }
        closeButtonProps={{
          'aria-label': `Close Drops for ${record.name}`,
        }}
        overlayProps={{ backgroundOpacity: 0.6, blur: 1 }}
      >
        <Stack gap="sm">
          <Title order={3} size="sm">
            {`Drops (${record.drops.entries.length.toLocaleString('en-US')})`}
          </Title>
          <MonsterDropEntries
            record={record}
            buildId={buildId}
            onClose={() => setOpened(false)}
          />
        </Stack>
      </Drawer>
    </>
  );
}
