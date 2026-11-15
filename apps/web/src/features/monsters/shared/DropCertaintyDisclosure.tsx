import { ActionIcon, HoverCard, Stack, Text } from '@mantine/core';
import { Check, Question } from '@phosphor-icons/react';
import { useState, type KeyboardEvent, type ReactElement } from 'react';

import { BUILDS, isBuildId, type BuildId } from '@/config/maplekit';

import classes from './drop-certainty.module.css';

export type MonsterDropAssertionKind = 'native' | 'historical-overlay';

export interface MonsterDropCertaintyProps {
  readonly itemName: string;
  readonly assertionKind: MonsterDropAssertionKind;
  readonly sourceBuild?: string;
}

export interface DropCertaintyDisclosureProps extends MonsterDropCertaintyProps {
  readonly buildId: BuildId;
  readonly onEscape?: (event: KeyboardEvent<HTMLElement>) => void;
}

function buildLabel(buildId: string): string {
  return isBuildId(buildId) ? BUILDS[buildId].label : buildId;
}

function dropSourceLabel(
  certainty: MonsterDropCertaintyProps,
  buildId: BuildId,
): string | undefined {
  if (certainty.assertionKind === 'native' && buildId === 'gms-v83') {
    return `${BUILDS[buildId].label} Monster Book`;
  }
  if (certainty.sourceBuild !== undefined) {
    const label = buildLabel(certainty.sourceBuild);
    return certainty.sourceBuild === 'gms-v83'
      ? `${label} Monster Book`
      : label;
  }
  return undefined;
}

/** Shared certainty marker and explanation for Monster Browse and Detail. */
export function DropCertaintyDisclosure({
  itemName,
  assertionKind,
  sourceBuild,
  buildId,
  onEscape,
}: DropCertaintyDisclosureProps): ReactElement {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const confirmed = assertionKind === 'native';
  const stateLabel = confirmed ? 'Confirmed' : 'Maybe';
  const actionLabel = `Show ${confirmed ? 'confirmed' : 'unconfirmed'} drop details for ${itemName}`;
  const sourceLabel = dropSourceLabel(
    {
      itemName,
      assertionKind,
      ...(sourceBuild === undefined ? {} : { sourceBuild }),
    },
    buildId,
  );

  function handleEscape(event: KeyboardEvent<HTMLElement>): void {
    if (
      event.key !== 'Escape' ||
      event.currentTarget.getAttribute('aria-expanded') === 'true'
    ) {
      return;
    }
    onEscape?.(event);
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
        aria-label={`${stateLabel} drop details for ${itemName}`}
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
