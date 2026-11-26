import { Group, Stack, Text } from '@mantine/core';
import { Thumbnail } from '@mapletip/component-library';
import { itemIconUrl, type ItemBrowseRecordV2_2 } from '@mapletip/data/items';
import type { ReactElement } from 'react';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import type { CategorizedItemRow } from './project';

type BuffStat = NonNullable<
  ItemBrowseRecordV2_2['buff']
>['effects'][number]['stat'];

const BUFF_STAT_LABELS: Readonly<Record<BuffStat, string>> = {
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

function formatBuff(buff: NonNullable<CategorizedItemRow['buff']>): string {
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

/** Plain US English statements for the published facts on an item row. */
export function formatItemFacts({
  record,
}: {
  readonly record: CategorizedItemRow;
}): readonly string[] {
  const facts: string[] = [];
  if (record.hp !== undefined) {
    facts.push(`Restores ${numberFormat.format(record.hp)} HP`);
  }
  if (record.hpPercent !== undefined) {
    facts.push(`Restores ${numberFormat.format(record.hpPercent)}% HP`);
  }
  if (record.mp !== undefined) {
    facts.push(`Restores ${numberFormat.format(record.mp)} MP`);
  }
  if (record.mpPercent !== undefined) {
    facts.push(`Restores ${numberFormat.format(record.mpPercent)}% MP`);
  }
  if (record.buff !== undefined && record.buff.effects.length > 0) {
    facts.push(formatBuff(record.buff));
  }
  if (record.attack !== undefined) {
    facts.push(`+${numberFormat.format(record.attack)} attack`);
  }
  if (record.level !== undefined) {
    facts.push(`Requires level ${numberFormat.format(record.level)}`);
  }
  if (record.maxStack !== undefined) {
    facts.push(`Stacks to ${numberFormat.format(record.maxStack)}`);
  }
  if (record.sellPrice !== undefined) {
    facts.push(
      `Sells for ${numberFormat.format(record.sellPrice)} ${record.sellPrice === 1 ? 'meso' : 'mesos'}`,
    );
  }
  return facts;
}

export interface ItemDrawerBodyProps {
  readonly record: CategorizedItemRow;
  readonly categoryLabel?: string | undefined;
}

/** Item summary and published facts shown inside the record-details drawer. */
export function ItemDrawerBody({
  record,
  categoryLabel,
}: ItemDrawerBodyProps): ReactElement {
  const facts = formatItemFacts({ record });
  return (
    <Stack gap="md">
      <Group align="center" gap="md" wrap="nowrap">
        <Thumbnail
          src={
            record.icon === undefined
              ? undefined
              : itemIconUrl(MAPLEKIT_RELEASE.baseUrl, record.icon)
          }
          size={64}
          magnify={2}
        />
        {categoryLabel === undefined ? null : (
          <Text size="sm" c="dimmed">
            {categoryLabel}
          </Text>
        )}
      </Group>
      {facts.length > 0 ? (
        <Stack
          component="ul"
          gap="xs"
          m={0}
          p={0}
          style={{ listStyle: 'none' }}
        >
          {facts.map((fact) => (
            <li key={fact}>
              <Text size="sm">{fact}</Text>
            </li>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
