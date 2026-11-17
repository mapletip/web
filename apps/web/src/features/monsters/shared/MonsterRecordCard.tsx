import { Badge, Image } from '@mantine/core';
import { RecordCard } from '@mapletip/component-library';
import { Ghost } from '@phosphor-icons/react';
import type { ReactElement, ReactNode } from 'react';

import { createRecordCardLinkRenderer } from '@/components/RouterLinks';

import classes from './MonsterRecordCard.module.css';
import type { MonsterRecordCardView } from './monsterRecordCardProjection';

export const MONSTER_RECORD_CARD_DENSITY = { base: 1, sm: 3, md: 4 } as const;

function MonsterSprite({
  spriteUrl,
}: {
  readonly spriteUrl: string | undefined;
}): ReactElement {
  return (
    <div className={classes['sprite']} aria-hidden="true">
      {spriteUrl === undefined ? (
        <Ghost size={20} weight="regular" />
      ) : (
        <Image
          src={spriteUrl}
          alt=""
          w={48}
          h={48}
          fit="contain"
          loading="lazy"
        />
      )}
    </div>
  );
}

/** Monster-owned compact identity card; relationship facts come from its host. */
export function MonsterRecordCard({
  monster,
  children,
}: {
  readonly monster: MonsterRecordCardView;
  readonly children?: ReactNode;
}): ReactElement {
  const destination = monster.destination;

  return (
    <RecordCard
      layout="compactMediaAside"
      title={monster.name}
      secondaryLine={monster.levelLabel}
      badges={
        monster.bossLabel === undefined ? undefined : (
          <Badge size="sm">{monster.bossLabel}</Badge>
        )
      }
      media={<MonsterSprite spriteUrl={monster.spriteUrl} />}
      footer={children}
      {...(destination === undefined
        ? {}
        : {
            destination: { href: destination.href },
            renderLink: createRecordCardLinkRenderer({
              to: destination.to,
              params: destination.params,
            }),
          })}
    />
  );
}
