import { Box } from '@mantine/core';
import { Thumbnail, type RecordFact } from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import type { CategorizedItemRow } from '../browse/project';
import { groupScrollFamilies, scrollChanges } from '../browse/scroll-families';

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

function scrollFacts(
  row: CategorizedItemRow,
  context: ItemCardContext,
): readonly RecordFact[] {
  return (row.scrollMembers ?? [row]).map((member) => {
    const chance =
      member.success === undefined ? undefined : `${member.success}% success`;
    const risk =
      member.cursed !== undefined && member.cursed > 0
        ? 'can destroy item'
        : undefined;
    const detail = [chance, risk].filter(Boolean).join(' · ');
    const changes = scrollChanges({ stats: member.stats });
    return {
      id: member.sourceId,
      icon: member.icon ? (
        <Thumbnail
          src={itemIconUrl(MAPLEKIT_RELEASE.baseUrl, member.icon)}
          size={20}
        />
      ) : undefined,
      // Untiered scrolls have one row, named by its chance instead of a tier.
      ...(member.tier
        ? {
            label: member.tier[0]!.toUpperCase() + member.tier.slice(1),
            ...(detail ? { detail } : {}),
          }
        : {
            label: chance ?? 'Success not published',
            ...(risk ? { detail: risk } : {}),
          }),
      ...(changes.length ? { values: [changes[0]!, changes[1]] as const } : {}),
      ...(context.openItemDetails
        ? { action: () => context.openItemDetails?.(member.sourceId) }
        : {}),
    };
  });
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
    facts: scrollFacts,
    group: ({ rows, coverage }) => groupScrollFamilies({ rows, coverage }),
    queryFields: () => [
      { id: 'names', accessor: 'names', sortable: false },
      { id: 'scrollSort', accessor: 'scrollSort' },
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
