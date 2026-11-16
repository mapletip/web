import { Badge, Box, Grid, Group, Paper, Stack, Title } from '@mantine/core';
import {
  FactSheet,
  RecordSections,
  SpriteStage,
  Thumbnail,
} from '@mapletip/component-library';
import {
  BookOpenText,
  MagicWand,
  MapPin,
  Package,
} from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import { DetailPageShell } from '@/components/DetailPageShell';
import { DetailBreadcrumbs } from '@/features/detail';
import { MONSTER_STAT_BY_ID } from '@/features/monsters/shared';
import { useRouteOverlay } from '@/features/route-overlay/useRouteOverlay';

import { monsterDetailBreadcrumbs } from '../metadata';
import { MonsterDetailDrops } from '../MonsterDetailDrops';
import { MonsterDetailLocations } from '../MonsterDetailLocations';
import { monsterDetailOverlayOptions } from '../monsterDetailOverlay';
import { MonsterDetailQuests } from '../MonsterDetailQuests';
import { MonsterDetailSummonedBy } from '../MonsterDetailSummonedBy';
import type { MonsterDetailStatView, MonsterDetailView } from '../project';

import classes from './MonsterDetail.module.css';

export interface MonsterDetailProps {
  readonly view: MonsterDetailView;
}

/** Server-rendered hero for one Monster. */
export function MonsterDetail({ view }: MonsterDetailProps): ReactElement {
  const locationsOverlay = useRouteOverlay(monsterDetailOverlayOptions);
  const breadcrumbs = monsterDetailBreadcrumbs({
    view,
    buildId: view.buildId,
  });
  const spriteUrl = view.spriteUrl;
  const badges = [
    ...(view.boss === true
      ? [
          <Badge key="boss" color="red">
            Boss
          </Badge>,
        ]
      : []),
    ...(view.undead === true
      ? [
          <Badge key="undead" color="gray">
            Undead
          </Badge>,
        ]
      : []),
    ...view.elements.map((element) => {
      const color = elementResponseColor(element.response);
      return (
        <Badge
          key={`${element.code}:${element.response}`}
          variant="light"
          {...(color === undefined ? {} : { color })}
        >
          {element.response}: {element.element}
        </Badge>
      );
    }),
  ];

  return (
    <DetailPageShell>
      <Stack className={classes['page']} gap="lg">
        <DetailBreadcrumbs items={breadcrumbs} />
        <Paper
          className={classes['hero']}
          component="section"
          aria-labelledby="monster-name"
          withBorder
          radius="md"
          p={{ base: 'md', lg: 'xl' }}
        >
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
              <Stack gap="sm">
                <Title order={2} size="sm">
                  Stats
                </Title>
                <FactSheet
                  facts={view.stats.map((stat) => toFactSheetFact(stat))}
                />
              </Stack>
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
        </Paper>
        <RecordSections
          sections={[
            {
              id: 'locations',
              title: 'Locations',
              icon: (
                <MapPin size={16} color="var(--mantine-primary-color-filled)" />
              ),
              count: view.locations.count,
              content: (
                <MonsterDetailLocations
                  locations={view.locations}
                  drawerOpened={locationsOverlay.overlay?.type === 'locations'}
                  onDrawerOpen={() =>
                    locationsOverlay.open({ type: 'locations' })
                  }
                  onDrawerClose={() => locationsOverlay.dismiss('locations')}
                />
              ),
            },
            {
              id: 'drops',
              title: 'Drops',
              icon: (
                <Package
                  size={16}
                  color="var(--mantine-primary-color-filled)"
                />
              ),
              count: view.drops.count,
              content: (
                <MonsterDetailDrops drops={view.drops} buildId={view.buildId} />
              ),
            },
            {
              id: 'quests',
              title: 'Quests',
              icon: (
                <BookOpenText
                  size={16}
                  color="var(--mantine-primary-color-filled)"
                />
              ),
              count: view.quests.count,
              content: <MonsterDetailQuests quests={view.quests} />,
            },
            ...(view.summonedBy.state === 'present'
              ? [
                  {
                    id: 'summoned-by',
                    title: 'Summoned by',
                    icon: (
                      <MagicWand
                        size={16}
                        color="var(--mantine-primary-color-filled)"
                      />
                    ),
                    count: view.summonedBy.count,
                    content: (
                      <MonsterDetailSummonedBy summonedBy={view.summonedBy} />
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Stack>
    </DetailPageShell>
  );
}

function elementResponseColor(response: string): string | undefined {
  switch (response.toLocaleLowerCase('en')) {
    case 'immune':
      return 'green';
    case 'resistant':
      return 'blue';
    case 'weak':
      return 'red';
    default:
      return undefined;
  }
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
