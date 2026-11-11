import { ActionIcon, Group, Popover, Stack, Text } from '@mantine/core';
import { Thumbnail } from '@mapletip/component-library';
import { Check, Question } from '@phosphor-icons/react';
import { useState, type KeyboardEvent, type ReactElement } from 'react';

import { BUILDS, isBuildId, type BuildId } from '@/config/maplekit';

import type { MonsterDropEntry } from '../../project';
import { closeDropsPanelOnEscape } from '../escape';
import classes from '../MonsterDrops.module.css';

function buildLabel(buildId: string): string {
  return isBuildId(buildId) ? BUILDS[buildId].label : buildId;
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

export function DropCertaintyDisclosure({
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
  const [opened, setOpened] = useState(false);

  function handleEscape(event: KeyboardEvent<HTMLElement>): void {
    if (event.key !== 'Escape') return;
    if (opened) {
      event.preventDefault();
      event.stopPropagation();
      setOpened(false);
      return;
    }
    closeDropsPanelOnEscape(event, onClose);
  }

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      closeOnEscape={false}
      returnFocus
      withRoles={false}
      position="bottom"
      width={280}
      withinPortal
      withArrow
      middlewares={{ flip: true, shift: true }}
      styles={{ dropdown: { maxWidth: 'calc(100vw - 24px)' } }}
    >
      <Popover.Target>
        <ActionIcon
          type="button"
          variant="transparent"
          size="sm"
          className={classes['certainty']}
          data-confirmed={confirmed}
          aria-label={actionLabel}
          aria-haspopup="dialog"
          aria-expanded={opened}
          onClick={() => setOpened((current) => !current)}
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
      </Popover.Target>
      <Popover.Dropdown
        role="dialog"
        aria-label={`${stateLabel} drop details for ${entry.itemName}`}
      >
        <Group gap="xs" wrap="nowrap" align="flex-start">
          {entry.itemIconUrl === undefined ? null : (
            <Thumbnail
              src={entry.itemIconUrl}
              size={32}
              alt={`${entry.itemName} icon`}
            />
          )}
          <Stack gap={4}>
            <Text fw={600} size="sm">
              {entry.itemName}
            </Text>
            <Text size="xs" c="dimmed">
              {stateLabel}
            </Text>
          </Stack>
        </Group>
        <Stack gap={4} mt="xs">
          {sourceLabel === undefined ? null : (
            <Text size="xs" c="dimmed">
              Source: {sourceLabel}.
            </Text>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
