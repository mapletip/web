import { ActionIcon, HoverCard, Stack, Text } from '@mantine/core';
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
  const [explanationOpen, setExplanationOpen] = useState(false);
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
    closeDropsPanelOnEscape(event, onClose);
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
      onOpen={() => setExplanationOpen(true)}
      onClose={() => setExplanationOpen(false)}
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
          data-mantine-stop-propagation={explanationOpen ? 'true' : undefined}
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
