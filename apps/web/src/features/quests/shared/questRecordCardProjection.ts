import { mapNpcSpriteUrl } from '@mapletip/data/maps';
import type { StaticMonsterPageRecord } from '@mapletip/data/monsters';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';
import { formatMonsterNumber } from '@/features/monsters/shared';

const JOB_FAMILY_LABELS: Readonly<Record<number, string>> = {
  0: 'Beginner',
  100: 'Warrior',
  200: 'Magician',
  300: 'Bowman',
  400: 'Thief',
  500: 'Pirate',
  1000: 'Cygnus Knights',
  2000: 'Aran',
  2001: 'Evan',
};

const JOB_FAMILY_ORDER = Object.values(JOB_FAMILY_LABELS);

export interface QuestRecordCardView {
  readonly name: string;
  readonly minimumLevelLabel?: string;
  readonly jobSummary?: string;
  readonly repeatable: boolean;
  readonly startNpc?: {
    readonly name?: string;
    readonly spriteUrl?: string;
  };
  readonly event?: true;
}

type MonsterPageQuest = StaticMonsterPageRecord['quests']['entries'][number];

function projectJobSummary(
  jobCodes: MonsterPageQuest['jobCodes'],
): string | undefined {
  if (jobCodes.state === 'absent') return 'Any job';
  if (jobCodes.state !== 'known' && jobCodes.state !== 'partial') {
    return undefined;
  }

  const labels = new Set<string>();
  let unresolved = 0;
  for (const code of jobCodes.items) {
    const label = JOB_FAMILY_LABELS[code];
    if (label === undefined) unresolved += 1;
    else labels.add(label);
  }
  const families = JOB_FAMILY_ORDER.filter((label) => labels.has(label));
  const shown = families.slice(0, 2).join(', ');
  const more = Math.max(0, families.length - 2) + unresolved;
  let summary: string;
  if (shown.length === 0) summary = 'Some jobs';
  else if (more > 0) summary = `${shown} +${more}`;
  else summary = shown;
  return jobCodes.state === 'partial' ? `${shown || 'Some jobs'} +?` : summary;
}

/** Project Quest-owned facts available on a MapleKit Monster page. */
export function projectQuestRecordCard(
  record: MonsterPageQuest,
): QuestRecordCardView {
  const jobSummary = projectJobSummary(record.jobCodes);
  const startNpcFact = 'startNpc' in record ? record.startNpc : undefined;
  const startNpcName =
    startNpcFact?.state === 'known' && startNpcFact.value.name.state === 'known'
      ? startNpcFact.value.name.value
      : undefined;
  const startNpcSpriteUrl =
    startNpcFact?.state === 'known' &&
    startNpcFact.value.sprite.state === 'known'
      ? mapNpcSpriteUrl(
          MAPLEKIT_RELEASE.baseUrl,
          startNpcFact.value.sprite.value,
        )
      : undefined;
  const startNpc =
    startNpcName === undefined && startNpcSpriteUrl === undefined
      ? undefined
      : {
          ...(startNpcName === undefined ? {} : { name: startNpcName }),
          ...(startNpcSpriteUrl === undefined
            ? {}
            : { spriteUrl: startNpcSpriteUrl }),
        };
  const event =
    'event' in record &&
    record.event.state === 'known' &&
    record.event.value === true;

  return {
    name:
      record.name.state === 'known'
        ? record.name.value
        : 'Quest name unavailable',
    ...(record.minLevel.state === 'known'
      ? {
          minimumLevelLabel: `Lv. ${formatMonsterNumber(record.minLevel.value)}+`,
        }
      : {}),
    ...(jobSummary === undefined ? {} : { jobSummary }),
    repeatable: record.repeatable.state === 'known' && record.repeatable.value,
    ...(startNpc === undefined ? {} : { startNpc }),
    ...(event ? { event: true } : {}),
  };
}
