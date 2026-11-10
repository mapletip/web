import { CloseButton, Group, Title } from '@mantine/core';
import { Package } from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';

import type { MonsterBrowseRow } from '../../project';
import { closeDropsPanelOnEscape } from '../escape';
import { MonsterDropEntries } from '../MonsterDropEntries';
import classes from '../MonsterDrops.module.css';

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
          onKeyDown={(event) => closeDropsPanelOnEscape(event, onClose)}
          size="sm"
          className={classes['panelClose']}
        />
      </Group>
      <MonsterDropEntries record={record} buildId={buildId} onClose={onClose} />
    </section>
  );
}
