import { ActionIcon, HoverCard, Stack, Text } from '@mantine/core';
import { Check, Question } from '@phosphor-icons/react';
import { useState, type KeyboardEvent, type ReactElement } from 'react';

import { DropSources, type DropSource } from '@/features/drops';

import classes from './drop-certainty.module.css';

export interface DropCertaintyDisclosureProps {
  readonly itemName: string;
  readonly confirmed: boolean;
  readonly sources: readonly DropSource[];
  readonly onEscape?: (event: KeyboardEvent<HTMLElement>) => void;
}

/** Shared certainty marker and explanation for Monster Browse and Detail. */
export function DropCertaintyDisclosure({
  itemName,
  confirmed,
  sources,
  onEscape,
}: DropCertaintyDisclosureProps): ReactElement {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const stateLabel = confirmed ? 'Confirmed' : 'Maybe';
  const actionLabel = `Show ${confirmed ? 'confirmed' : 'unconfirmed'} drop details for ${itemName}`;

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
          <DropSources sources={sources} />
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
