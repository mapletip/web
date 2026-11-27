import { Box, Divider, Stack, Title } from '@mantine/core';
import {
  RecordFacts,
  Thumbnail,
  type FacetDefinition,
  type RecordFact,
} from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import type {
  CategorizedItemRow,
  ItemBrowseUpgradeTarget,
} from '../browse/project';
import {
  equipmentName,
  groupScrollFamilies,
  SCROLL_STAT_LABELS,
  scrollChanges,
} from '../browse/scroll-families';

import type { ItemCardContext, ItemKind } from './types';

function scrollMedia(row: CategorizedItemRow, context: ItemCardContext) {
  const equipmentIcon =
    row.targetLabel === undefined
      ? undefined
      : context.scrollTargetIcons?.[row.targetLabel];
  const scrollIcon = row.icon;
  const mainIcon = equipmentIcon ?? scrollIcon;
  return (
    <Box pos="relative" w={48} h={48}>
      <Thumbnail
        src={
          mainIcon ? itemIconUrl(MAPLEKIT_RELEASE.baseUrl, mainIcon) : undefined
        }
        size={48}
        magnify={1.5}
      />
      {equipmentIcon && scrollIcon ? (
        <Box pos="absolute" right={-4} bottom={-4}>
          <Thumbnail
            src={itemIconUrl(MAPLEKIT_RELEASE.baseUrl, scrollIcon)}
            size={24}
            magnify={1.5}
          />
        </Box>
      ) : null}
    </Box>
  );
}

type ScrollPill = 'weapons' | 'armor' | 'accessories-and-pets';

const SCROLL_TARGET_PILLS: Readonly<
  Record<ItemBrowseUpgradeTarget, ScrollPill>
> = {
  accessory: 'accessories-and-pets',
  belt: 'accessories-and-pets',
  bottomwear: 'armor',
  bow: 'weapons',
  cape: 'accessories-and-pets',
  claw: 'weapons',
  crossbow: 'weapons',
  dagger: 'weapons',
  earrings: 'accessories-and-pets',
  'eye-accessory': 'accessories-and-pets',
  'face-accessory': 'accessories-and-pets',
  gloves: 'armor',
  gun: 'weapons',
  hat: 'armor',
  knuckle: 'weapons',
  'one-handed-axe': 'weapons',
  'one-handed-blunt-weapon': 'weapons',
  'one-handed-sword': 'weapons',
  'overall-armor': 'armor',
  'pet-equipment': 'accessories-and-pets',
  polearm: 'weapons',
  ring: 'accessories-and-pets',
  shield: 'armor',
  shoes: 'armor',
  spear: 'weapons',
  staff: 'weapons',
  topwear: 'armor',
  'two-handed-axe': 'weapons',
  'two-handed-blunt-weapon': 'weapons',
  'two-handed-sword': 'weapons',
  wand: 'weapons',
};

const SCROLL_PILL_OPTIONS: readonly {
  readonly value: ScrollPill;
  readonly label: string;
}[] = [
  { value: 'weapons', label: 'Weapons' },
  { value: 'armor', label: 'Armor' },
  { value: 'accessories-and-pets', label: 'Accessories and pets' },
];

const collator = new Intl.Collator('en-US');

function sentenceCase({ value }: { readonly value: string }): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function scrollFacets({
  rows,
}: {
  readonly rows: readonly CategorizedItemRow[];
}): readonly FacetDefinition<CategorizedItemRow>[] {
  const presentPills = new Set(
    rows.flatMap((row) =>
      row.targetLabel ? [SCROLL_TARGET_PILLS[row.targetLabel]] : [],
    ),
  );
  const pillOptions = SCROLL_PILL_OPTIONS.filter((option) =>
    presentPills.has(option.value),
  );
  const equipment = Array.from(
    new Set(
      rows.flatMap((row) =>
        row.targetLabel === undefined ? [] : [row.targetLabel],
      ),
    ),
  ).sort((left, right) =>
    collator.compare(
      equipmentName({ label: left }),
      equipmentName({ label: right }),
    ),
  );
  const stats = Array.from(
    new Set(rows.flatMap((row) => row.scrollStats ?? [])),
  ).sort((left, right) => collator.compare(left, right));

  return [
    ...(pillOptions.length > 0
      ? [
          {
            id: 'scroll-equipment-type',
            field: 'scrollPills',
            label: 'Equipment type',
            kind: 'multi-select' as const,
            placement: 'results' as const,
            options: pillOptions,
          },
        ]
      : []),
    ...(equipment.length > 0
      ? [
          {
            id: 'scroll-equipment',
            field: 'scrollEquipment',
            label: 'Equipment',
            kind: 'multi-select' as const,
            options: equipment.map((value) => ({
              value,
              label: equipmentName({ label: value }),
            })),
          },
        ]
      : []),
    ...(stats.length > 0
      ? [
          {
            id: 'scroll-stat',
            field: 'scrollStats',
            label: 'Stat',
            kind: 'multi-select' as const,
            options: stats.map((value) => ({
              value,
              label: sentenceCase({ value: SCROLL_STAT_LABELS[value] }),
            })),
          },
        ]
      : []),
  ];
}

function scrollFacts({
  row,
  context,
  selectedSourceId,
}: {
  readonly row: CategorizedItemRow;
  readonly context: ItemCardContext;
  readonly selectedSourceId?: string | undefined;
}): readonly RecordFact[] {
  return (row.scrollMembers ?? [row]).flatMap((member) => {
    const chance =
      member.success === undefined ? undefined : `${member.success}% success`;
    const risk =
      member.cursed !== undefined && member.cursed > 0
        ? 'can destroy item'
        : undefined;
    const changes = scrollChanges({ stats: member.stats });
    const label =
      member.tier === undefined
        ? (chance ?? risk ?? (changes.length > 0 ? 'Stat changes' : undefined))
        : sentenceCase({ value: member.tier });
    if (label === undefined) return [];
    const detailParts = [
      member.tier === undefined ? undefined : chance,
      member.tier === undefined && chance === undefined ? undefined : risk,
    ].filter((part): part is string => part !== undefined);
    return [
      {
        id: member.sourceId,
        icon: member.icon ? (
          <Thumbnail
            src={itemIconUrl(MAPLEKIT_RELEASE.baseUrl, member.icon)}
            size={20}
          />
        ) : undefined,
        label,
        ...(detailParts.length > 0 ? { detail: detailParts.join(' · ') } : {}),
        ...(changes.length
          ? { values: [changes[0]!, changes[1]] as const }
          : {}),
        ...(member.sourceId === selectedSourceId ? { selected: true } : {}),
        ...(context.openItemDetails && member.sourceId !== selectedSourceId
          ? { action: () => context.openItemDetails?.(member.sourceId) }
          : {}),
      },
    ];
  });
}

function scrollDrawerContent({
  record,
  selectedRecordId,
  context,
  openRecordDetails,
}: {
  readonly record: CategorizedItemRow;
  readonly selectedRecordId: string;
  readonly context: ItemCardContext;
  readonly openRecordDetails: (sourceId: string) => void;
}) {
  const facts = scrollFacts({
    row: record,
    context: { ...context, openItemDetails: openRecordDetails },
    selectedSourceId: selectedRecordId,
  });
  if (facts.length < 2) return null;
  return (
    <Stack component="section" aria-label="Scroll tiers" gap="xs">
      <Divider />
      <Title order={3} size="sm">
        Scroll tiers
      </Title>
      <RecordFacts facts={facts} />
    </Stack>
  );
}

export const scrolls = {
  id: 'scrolls',
  group: 'use',
  slug: 'scrolls',
  label: 'Scrolls',
  iconContentId:
    '3a453e4e40b44d9358f9348abdda896b64ecc046a52e5b07a2388bdbd7dc8601',
  matches: (row) =>
    row.itemClass === 'consume' &&
    row.types?.includes('upgrade-scroll') === true,
  card: {
    layout: 'identity',
    lead: (row) => row.scrollLead,
    media: scrollMedia,
    facts: (row, context) => scrollFacts({ row, context }),
    group: ({ rows, coverage }) => groupScrollFamilies({ rows, coverage }),
    groupMembers: ({ record }) => record.scrollMembers ?? [record],
    facets: ({ rows }) => scrollFacets({ rows }),
    drawerContent: scrollDrawerContent,
    queryFields: () => [
      { id: 'names', accessor: 'names', sortable: false },
      { id: 'scrollSort', accessor: 'scrollSort' },
      {
        id: 'scrollPills',
        accessor: (row) =>
          row.targetLabel === undefined
            ? []
            : [SCROLL_TARGET_PILLS[row.targetLabel]],
        sortable: false,
      },
      {
        id: 'scrollEquipment',
        accessor: (row) =>
          row.targetLabel === undefined ? [] : [row.targetLabel],
        sortable: false,
      },
      {
        id: 'scrollStats',
        accessor: (row) => row.scrollStats ?? [],
        sortable: false,
      },
    ],
    sortOptions: [
      { label: 'Equipment and stat', field: 'scrollSort', direction: 'asc' },
    ],
    defaultSort: {
      label: 'Equipment and stat',
      field: 'scrollSort',
      direction: 'asc',
    },
  },
} satisfies ItemKind;
