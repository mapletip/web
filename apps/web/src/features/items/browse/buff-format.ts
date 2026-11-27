import type { ItemBrowseRecordV2_2 } from '@mapletip/data/items';

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

const numberFormat = new Intl.NumberFormat('en-US');

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder === 0 ? `${minutes} min` : `${minutes} min ${remainder} sec`;
}

export function formatBuff({ buff }: { readonly buff: Buff }): string {
  const effects = buff.effects
    .map(({ stat, unit, value }) => {
      const sign = value >= 0 ? '+' : '';
      const suffix = unit === 'percent' ? '%' : '';
      return `${sign}${numberFormat.format(value)}${suffix} ${BUFF_STAT_LABELS[stat]}`;
    })
    .join(', ');
  if (buff.durationSeconds != null && buff.durationSeconds > 0) {
    return `${effects} · Lasts ${formatDuration(buff.durationSeconds)}`;
  }
  return effects;
}
