import { Badge, Group, Text } from '@mantine/core';
import { RecordCard } from '@mapletip/component-library';
import type { ReactElement, ReactNode } from 'react';

import classes from './QuestRecordCard.module.css';
import type { QuestRecordCardView } from './questRecordCardProjection';

export const QUEST_RECORD_CARD_DENSITY = { base: 1, md: 3 } as const;

/** Quest-owned card identity; its relationship details are supplied by the host. */
export function QuestRecordCard({
  quest,
  children,
}: {
  readonly quest: QuestRecordCardView;
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <RecordCard
      title={quest.name}
      secondaryLine={quest.jobSummary}
      badges={
        <>
          {quest.minimumLevelLabel === undefined ? null : (
            <Badge variant="light" color="gray" size="xs" radius="sm" tt="none">
              {quest.minimumLevelLabel}
            </Badge>
          )}
          {quest.repeatable ? (
            <Badge
              variant="outline"
              color="gray"
              size="xs"
              radius="sm"
              tt="none"
            >
              Repeatable
            </Badge>
          ) : null}
        </>
      }
      footer={children}
    />
  );
}

/** Host relationship content for a Monster's Quest requirement. */
export function QuestMonsterRequirementSlot({
  defeatLabel,
  sharedCountNote,
}: {
  readonly defeatLabel: string;
  readonly sharedCountNote?: string;
}): ReactElement {
  return (
    <Group className={classes['relationship']} gap="xs" wrap="wrap">
      <Badge variant="light" color="gray" size="xs" radius="sm" tt="none">
        {defeatLabel}
      </Badge>
      {sharedCountNote === undefined ? null : (
        <Text size="xs" c="dimmed">
          {sharedCountNote}
        </Text>
      )}
    </Group>
  );
}
