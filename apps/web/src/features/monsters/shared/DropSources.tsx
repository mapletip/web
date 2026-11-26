import { ActionIcon, Anchor, HoverCard, Stack, Text } from '@mantine/core';
import { Info } from '@phosphor-icons/react';
import { useState, type KeyboardEvent, type ReactElement } from 'react';

import type { DropSource } from './drop-sources';

export interface DropSourcesProps {
  readonly itemName: string;
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

export function DropSources({
  itemName,
  sources,
  onEscape,
}: DropSourcesProps): ReactElement {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const name = `Sources for ${itemName}`;

  function handleEscape(event: KeyboardEvent<HTMLElement>): void {
    if (
      event.key !== 'Escape' ||
      event.currentTarget.getAttribute('aria-expanded') === 'true'
    )
      return;
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
          color="gray"
          aria-label={name}
          data-mantine-stop-propagation={explanationOpen ? 'true' : undefined}
          onKeyDownCapture={handleEscape}
        >
          <Info size={14} aria-hidden="true" />
        </ActionIcon>
      </HoverCard.Target>
      <HoverCard.Dropdown role="dialog" aria-label={name}>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            {sources.length === 1 ? 'Source' : 'Sources'}
          </Text>
          {sources.map((source, index) => (
            <Stack
              gap={0}
              key={`${source.label}:${source.buildLabel}:${index}`}
            >
              <Text size="sm" fw={500}>
                {source.label}
              </Text>
              <Text size="xs" c="dimmed">
                {[
                  source.buildLabel,
                  source.date === undefined
                    ? undefined
                    : dateFormatter.format(
                        new Date(`${source.date}T00:00:00Z`),
                      ),
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
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
