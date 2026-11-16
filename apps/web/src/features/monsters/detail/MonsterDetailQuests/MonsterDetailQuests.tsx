import { Badge, Box, Text } from '@mantine/core';
import { RecordCard } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import type { MonsterDetailQuestsView } from '../project';

import classes from './MonsterDetailQuests.module.css';

export interface MonsterDetailQuestsProps {
  readonly quests: MonsterDetailQuestsView;
}

/** Quest requirements for this monster, with absent and unresolved states kept distinct. */
export function MonsterDetailQuests({
  quests,
}: MonsterDetailQuestsProps): ReactElement {
  if (quests.state === 'no-quests') {
    return <Text>No quests are listed for this monster.</Text>;
  }
  if (quests.state === 'unavailable') {
    return <Text>Quest information is unavailable.</Text>;
  }

  return (
    <Box
      component="ul"
      className={classes['list']}
      aria-label="Quests that require this monster"
    >
      {quests.entries.map((quest) => (
        <Box component="li" className={classes['item']} key={quest.key}>
          <RecordCard
            title={quest.name}
            secondaryLine={
              <span className={classes['facts']}>
                {quest.jobSummary === undefined ? null : (
                  <span>{quest.jobSummary}</span>
                )}
                <Badge
                  component="span"
                  variant="light"
                  color="gray"
                  size="xs"
                  radius="sm"
                  tt="none"
                >
                  {quest.defeatLabel}
                </Badge>
              </span>
            }
            badges={
              <>
                {quest.minimumLevelBadge === undefined ? null : (
                  <Badge
                    variant="light"
                    color="gray"
                    size="xs"
                    radius="sm"
                    tt="none"
                  >
                    {quest.minimumLevelBadge}
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
            footer={quest.sharedCountNote}
          />
        </Box>
      ))}
    </Box>
  );
}
