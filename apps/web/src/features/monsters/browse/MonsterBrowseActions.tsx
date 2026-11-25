import { Button, Group, Text } from '@mantine/core';
import { MapPin } from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import {
  MONSTER_BROWSE_FACT_CONFIG,
  renderMonsterBrowseFactIcon,
} from './monster-browse-fact-config';
import classes from './MonsterBrowse.module.css';
import { dropListingActionLabel } from './MonsterDrops';
import type { MonsterBrowseRow } from './project';

export type MonsterBrowseRelation = 'drops' | 'locations';

export function MonsterBrowseActions({
  record,
  activeRelation,
  controlsId,
  inlineDropsExpanded = false,
  onActivate,
}: {
  readonly record: MonsterBrowseRow;
  readonly activeRelation: MonsterBrowseRelation | undefined;
  readonly controlsId?: string;
  readonly inlineDropsExpanded?: boolean;
  readonly onActivate: (relation: MonsterBrowseRelation) => void;
}): ReactElement {
  const { locations } = record;
  const mobile = controlsId === undefined;
  const known = locations.state === 'known';
  const locationCount = locations.state === 'absent' ? 0 : locations.mapCount;
  const formattedCount = locationCount.toLocaleString('en-US');
  const locationCountLabel = `${formattedCount} ${locationCount === 1 ? 'map' : 'maps'}`;

  function action(
    relation: MonsterBrowseRelation,
    icon: ReactElement | undefined,
    label: string,
    title: string,
    text: string,
  ) {
    const inline = !mobile && relation === 'drops';
    const expanded = inline ? inlineDropsExpanded : activeRelation === relation;
    return (
      <Button
        type="button"
        variant={expanded ? 'light' : 'default'}
        size="compact-sm"
        radius="sm"
        px={4}
        leftSection={icon}
        classNames={{
          section: classes['triggerSection'],
          label: classes['triggerLabel'],
        }}
        aria-haspopup={inline ? undefined : 'dialog'}
        aria-expanded={expanded}
        aria-controls={inline ? controlsId : undefined}
        aria-label={label}
        title={title}
        onKeyDown={(event) => {
          if (!inline || !expanded || event.key !== 'Escape') return;
          event.preventDefault();
          event.stopPropagation();
          onActivate(relation);
        }}
        onClick={(event) => {
          event.stopPropagation();
          onActivate(relation);
        }}
      >
        {text}
      </Button>
    );
  }

  const dropCount = record.drops.entries.length.toLocaleString('en-US');
  return (
    <Group component="span" gap={4}>
      {action(
        'drops',
        renderMonsterBrowseFactIcon(
          MONSTER_BROWSE_FACT_CONFIG.dropsItem,
          mobile ? { surface: 'card' } : {},
        ),
        dropListingActionLabel(record, inlineDropsExpanded),
        `${dropCount} Drops`,
        dropCount,
      )}
      {locationCount > 0 ? (
        action(
          'locations',
          <MapPin size={14} aria-hidden="true" />,
          `Show locations for ${record.name}, ${known ? locationCountLabel : 'partial list'}`,
          known
            ? `Locations (${locationCountLabel})`
            : 'Locations (partial list)',
          known ? formattedCount : 'Partial',
        )
      ) : (
        <Text component="span" size="xs" c="dimmed">
          {locations.state === 'unresolved'
            ? 'Locations unavailable'
            : 'No recorded maps'}
        </Text>
      )}
    </Group>
  );
}
