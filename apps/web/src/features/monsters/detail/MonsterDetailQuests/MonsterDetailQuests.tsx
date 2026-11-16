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
            secondaryLine={[
              quest.minimumLevelLabel,
              `Job: ${quest.jobRequirementLabel}`,
              quest.defeatLabel,
            ].join(' · ')}
            badges={quest.repeatable ? <Badge>Repeatable</Badge> : undefined}
            footer={quest.sharedCountNote}
          />
        </Box>
      ))}
    </Box>
  );
}
