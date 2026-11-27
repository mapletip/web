import type {
  RecordCardValuePart,
  RecordCardValueTone,
} from '@mapletip/component-library';
import type { ItemBrowseRecordV2_2 } from '@mapletip/data/items';

import { numberFormat } from './number-format';

type Buff = NonNullable<ItemBrowseRecordV2_2['buff']>;
type BuffStat = Buff['effects'][number]['stat'];

export const BUFF_STAT_LABELS: Readonly<Record<BuffStat, string>> = {
  weaponAttack: 'weapon attack',
  magicAttack: 'magic attack',
  weaponDefense: 'weapon defense',
  magicDefense: 'magic defense',
  accuracy: 'accuracy',
  avoidability: 'avoidability',
  speed: 'speed',
  jump: 'jump',
  criticalRate: 'critical rate',
  criticalDamage: 'critical damage',
  maxHp: 'max HP',
  maxMp: 'max MP',
  itemDropRate: 'item drop rate',
  mesoDropRate: 'meso drop rate',
};

export interface FormattedBuff {
  readonly effects: readonly RecordCardValuePart[];
  readonly duration: string | undefined;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${numberFormat.format(count)} ${count === 1 ? singular : plural}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return pluralize(seconds, 'second', 'seconds');
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  const minuteText = pluralize(minutes, 'minute', 'minutes');
  return remainder === 0
    ? minuteText
    : `${minuteText} ${pluralize(remainder, 'second', 'seconds')}`;
}

function effectTone(stat: BuffStat, value: number): RecordCardValueTone {
  if (value < 0) return 'critical';
  if (stat === 'maxHp') return 'warm';
  if (stat === 'maxMp') return 'cool';
  return 'accent';
}

export function formatBuffParts({
  buff,
}: {
  readonly buff: Buff;
}): FormattedBuff {
  const effects: RecordCardValuePart[] = buff.effects.map(
    ({ stat, unit, value }, index) => {
      const sign = value < 0 ? '−' : '+';
      const suffix = unit === 'percent' ? '%' : '';
      return {
        id: `${stat}-${unit}-${index}`,
        text: `${sign}${numberFormat.format(Math.abs(value))}${suffix} ${BUFF_STAT_LABELS[stat]}`,
        tone: effectTone(stat, value),
      };
    },
  );
  const duration =
    effects.length > 0 &&
    buff.durationSeconds != null &&
    buff.durationSeconds > 0
      ? `Lasts ${formatDuration(buff.durationSeconds)}`
      : undefined;
  return { effects, duration };
}

export function formatBuff({ buff }: { readonly buff: Buff }): string {
  const { effects, duration } = formatBuffParts({ buff });
  const summary = effects.map((part) => part.text).join(', ');
  return duration === undefined ? summary : `${summary} · ${duration}`;
}
