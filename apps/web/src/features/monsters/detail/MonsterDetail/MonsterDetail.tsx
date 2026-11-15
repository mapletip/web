import { Badge, Box, Grid, Group, Stack, Title } from '@mantine/core';
import { FactSheet, SpriteStage, Thumbnail } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import { DetailPageShell } from '@/components/DetailPageShell';
import { DetailBreadcrumbs } from '@/features/detail';
import { MONSTER_STAT_BY_ID } from '@/features/monsters/shared';

import { monsterDetailBreadcrumbs } from '../metadata';
import type { MonsterDetailStatView, MonsterDetailView } from '../project';

import classes from './MonsterDetail.module.css';

export interface MonsterDetailProps {
  readonly view: MonsterDetailView;
}

/** Server-rendered hero for one Monster. */
export function MonsterDetail({ view }: MonsterDetailProps): ReactElement {
  const breadcrumbs = monsterDetailBreadcrumbs({
    view,
    buildId: view.buildId,
  });
  const spriteUrl = view.spriteUrl;
  const badges = [
    ...(view.boss === true ? [<Badge key="boss">Boss</Badge>] : []),
    ...(view.undead === true ? [<Badge key="undead">Undead</Badge>] : []),
    ...view.elements.map((element) => (
      <Badge key={`${element.code}:${element.response}`} variant="light">
        {element.response}: {element.element}
      </Badge>
    )),
  ];

  return (
    <DetailPageShell>
      <Stack className={classes['page']} gap="lg">
        <DetailBreadcrumbs items={breadcrumbs} />
        <section className={classes['hero']} aria-labelledby="monster-name">
          <Group className={classes['identity']} gap="sm" wrap="nowrap">
            <Box className={classes['portrait']} hiddenFrom="lg">
              <Thumbnail src={spriteUrl} size={56} alt="" />
            </Box>
            <Stack gap={badges.length === 0 ? 0 : 'xs'} miw={0}>
              <Title id="monster-name" order={1} className={classes['name']}>
                {view.name}
              </Title>
              {badges.length === 0 ? null : (
                <Group className={classes['badges']} gap="xs">
                  {badges}
                </Group>
              )}
            </Stack>
          </Group>

          <Grid className={classes['factsAndSprite']} align="center">
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <FactSheet
                facts={view.stats.map((stat) => toFactSheetFact(stat))}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Box className={classes['sprite']} visibleFrom="lg">
                <SpriteStage
                  src={spriteUrl}
                  name={view.name}
                  unavailableMessage="Sprite unavailable"
                  width={view.spriteWidth}
                  height={view.spriteHeight}
                />
              </Box>
            </Grid.Col>
          </Grid>
        </section>
      </Stack>
    </DetailPageShell>
  );
}

function toFactSheetFact(stat: MonsterDetailStatView) {
  const definition = MONSTER_STAT_BY_ID[stat.id];
  const Icon = definition.icon;
  const icon = (
    <Icon
      aria-hidden="true"
      size={definition.iconSize}
      color={definition.iconColor ?? 'var(--mantine-color-dimmed)'}
      data-monster-fact-icon={stat.id}
    />
  );

  return {
    label: stat.label,
    explanation: stat.explanation,
    icon,
    ...(stat.known ? { value: stat.value } : { notKnown: stat.value }),
  };
}
