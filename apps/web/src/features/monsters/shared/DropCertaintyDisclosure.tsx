import { ActionIcon, Anchor, HoverCard, Stack, Text } from '@mantine/core';
import { Check, Question } from '@phosphor-icons/react';
import { useState, type KeyboardEvent, type ReactElement } from 'react';

import classes from './drop-certainty.module.css';
import type { DropSource } from './drop-sources';

export interface DropCertaintyDisclosureProps {
  readonly itemName: string;
  readonly confirmed: boolean;
  readonly sources: readonly DropSource[];
  readonly onEscape?: (event: KeyboardEvent<HTMLElement>) => void;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

function timeLabel(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function SourceExplanation({
  sources,
}: {
  readonly sources: readonly DropSource[];
}): ReactElement | null {
  if (sources.length === 0) return null;
  if (sources.every(({ observed }) => !observed)) {
    return (
      <Text size="xs" c="dimmed">
        {sources.length === 1 ? 'Source' : 'Sources'}:{' '}
        {sources.map(({ label }) => label).join(', ')}.
      </Text>
    );
  }
  return (
    <Stack gap="xs">
      {sources.length > 1 ? (
        <Text size="xs" c="dimmed">
          Sources:
        </Text>
      ) : null}
      {sources.map((source, index) => (
        <Stack gap={0} key={`${source.label}:${source.buildLabel}:${index}`}>
          <Text size="sm" fw={500}>
            {source.label}
          </Text>
          <Text size="xs" c="dimmed">
            {[
              source.buildLabel,
              source.date === undefined
                ? undefined
                : dateFormatter.format(new Date(`${source.date}T00:00:00Z`)),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {source.href === undefined ? null : (
            <Anchor
              size="xs"
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.startSeconds === undefined
                ? 'Open link'
                : `Open at ${timeLabel(source.startSeconds)}`}
            </Anchor>
          )}
        </Stack>
      ))}
    </Stack>
  );
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
          <SourceExplanation sources={sources} />
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
