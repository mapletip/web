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

import { DropChipGroups } from '../DropChipGroups';
import { LocationCardList } from '../LocationCardList';
import { monsterDetailBreadcrumbs } from '../metadata';
import { monsterDetailOverlayOptions } from '../monsterDetailOverlay';
import type { MonsterDetailStatView, MonsterDetailView } from '../project';
import { QuestCardList } from '../QuestCardList';
import { SummonItemChips } from '../SummonItemChips';

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
          <Grid className={classes['factsAndSprite']} align="start">
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Stack className={classes['factsColumn']} gap="md">
                <Group className={classes['identity']} gap="sm" wrap="nowrap">
                  <Box className={classes['portrait']} hiddenFrom="lg">
                    <Thumbnail src={spriteUrl} size={56} alt="" />
                  </Box>
                  <Stack gap={badges.length === 0 ? 0 : 'xs'} miw={0}>
                    <Title
                      id="monster-name"
                      order={1}
                      className={classes['name']}
                    >
                      {view.name}
                    </Title>
                    {badges.length === 0 ? null : (
                      <Group className={classes['badges']} gap="xs">
                        {badges}
                      </Group>
                    )}
                  </Stack>
                </Group>

                <Stack
                  className={classes['stats']}
                  component="section"
                  aria-labelledby="monster-stats-heading"
                  gap={0}
                >
                  <Title
                    id="monster-stats-heading"
                    order={2}
                    className={classes['visuallyHidden']}
                  >
                    Stats
                  </Title>
                  <FactSheet
                    facts={view.stats.map((stat) => toFactSheetFact(stat))}
                  />
                </Stack>
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
                <LocationCardList
                  locations={view.locations}
                  monsterName={view.name}
                  monsterSpriteUrl={spriteUrl}
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
              content: <DropChipGroups drops={view.drops} />,
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
              content: <QuestCardList quests={view.quests} />,
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
                    content: <SummonItemChips summonedBy={view.summonedBy} />,
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
      color={MONSTER_DETAIL_STAT_ICON_COLORS[stat.id]}
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

const MONSTER_DETAIL_STAT_ICON_COLORS: Readonly<
  Record<MonsterDetailStatView['id'], string>
> = {
  level: '#ffd43b',
  hp: '#ff6b6b',
  mp: '#4dabf7',
  exp: '#ffd43b',
  physicalAttack: '#ff8787',
  magicAttack: '#a77bd4',
  physicalDefense: '#69db7c',
  magicDefense: '#748ffc',
  accuracy: '#38d9a9',
  avoidability: '#3bc9db',
  pushed: '#ffa94d',
  speed: '#a9e34b',
};
