import { Text } from '@mantine/core';
import type { ReactElement } from 'react';

import { DetailCardList } from '@/features/detail';
import {
  QUEST_RECORD_CARD_DENSITY,
  QuestMonsterRequirementSlot,
  QuestRecordCard,
} from '@/features/quests/shared';

import type { MonsterDetailQuestsView } from '../project';

export interface QuestCardListProps {
  readonly quests: MonsterDetailQuestsView;
}

/** Quest requirements for this monster, with absent and unresolved states kept distinct. */
export function QuestCardList({ quests }: QuestCardListProps): ReactElement {
  if (quests.state === 'no-quests') {
    return <Text>No quests are listed for this monster.</Text>;
  }
  if (quests.state === 'unavailable') {
    return <Text>Quest information is unavailable.</Text>;
  }

  return (
    <DetailCardList
      items={quests.entries}
      getKey={(quest) => quest.key}
      listLabel="Quests that require this monster"
      density={QUEST_RECORD_CARD_DENSITY}
      renderItem={(quest) => (
        <QuestRecordCard quest={quest}>
          <QuestMonsterRequirementSlot
            defeatLabel={quest.defeatLabel}
            {...(quest.sharedCountNote === undefined
              ? {}
              : { sharedCountNote: quest.sharedCountNote })}
          />
        </QuestRecordCard>
      )}
    />
  );
}
