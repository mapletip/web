import { Divider, Group, Paper, Stack, Text } from '@mantine/core';
import { FactSheet, type Fact } from '@mapletip/component-library';
import {
  ArrowBendDownRight,
  ArrowUUpLeft,
  Bird,
  CaretRight,
  ChartLineUp,
  Clock,
  HeartBreak,
  MusicNote,
  PersonSimpleSwim,
  ShieldPlus,
} from '@phosphor-icons/react';
import { Fragment, type ReactElement } from 'react';

import { AnchorLink } from '@/components/RouterLinks';

import type { MapDetailFocus, MapDetailFocusKind } from '../focus';
import type {
  MapDetailFactId,
  MapDetailFactView,
  MapDetailOnThisMapRowView,
} from '../project';

import classes from './MapDetail.module.css';
import { OnThisMapRail } from './OnThisMapRail';

type MapDetailFactIcon = typeof MusicNote;

const MAP_DETAIL_FACT_ICON_BY_ID: Readonly<
  Record<MapDetailFactId, MapDetailFactIcon>
> = {
  music: MusicNote,
  returnMap: ArrowUUpLeft,
  forcedReturnMap: ArrowBendDownRight,
  timeLimit: Clock,
  levelLimit: ChartLineUp,
  hpDrain: HeartBreak,
  hpDrainProtection: ShieldPlus,
  swimming: PersonSimpleSwim,
  flying: Bird,
};

export interface MapReferenceRailProps {
  readonly activity?: string | undefined;
  readonly facts: readonly MapDetailFactView[];
  readonly focus: MapDetailFocus | undefined;
  readonly onThisMap: readonly MapDetailOnThisMapRowView[];
  readonly onToggle: (kind: MapDetailFocusKind) => void;
}

interface MapReferenceGroup {
  readonly key: string;
  readonly content: ReactElement;
}

function mapFactSheetFacts(
  facts: readonly MapDetailFactView[],
): readonly Fact[] {
  return facts.map((fact) => {
    const Icon = MAP_DETAIL_FACT_ICON_BY_ID[fact.id];
    return {
      label: fact.label,
      explanation: fact.explanation,
      icon: <Icon aria-hidden="true" size={16} data-map-fact-icon={fact.id} />,
      value:
        fact.destination === undefined ? (
          fact.value
        ) : (
          <Group component="span" gap={4} wrap="nowrap">
            <AnchorLink
              to={fact.destination.to}
              params={fact.destination.params}
              size="sm"
              fw={600}
            >
              {fact.value}
            </AnchorLink>
            <CaretRight
              aria-hidden="true"
              size={12}
              data-map-fact-link-icon={fact.id}
            />
          </Group>
        ),
    };
  });
}

export function MapReferenceRail({
  activity,
  facts,
  focus,
  onThisMap,
  onToggle,
}: MapReferenceRailProps): ReactElement | null {
  const groups: MapReferenceGroup[] = [];

  if (onThisMap.length > 0) {
    groups.push({
      key: 'on-this-map',
      content: (
        <OnThisMapRail rows={onThisMap} focus={focus} onToggle={onToggle} />
      ),
    });
  }

  if (activity !== undefined) {
    groups.push({
      key: 'related-activity',
      content: (
        <Stack
          component="section"
          aria-labelledby="map-related-activity-heading"
          gap={4}
        >
          <Text
            id="map-related-activity-heading"
            component="h2"
            className={classes['referenceRailHeading']}
            fw={600}
          >
            Related activity
          </Text>
          <Text size="sm">
            Part of <strong>{activity}</strong>
          </Text>
        </Stack>
      ),
    });
  }

  if (facts.length > 0) {
    groups.push({
      key: 'map-information',
      content: (
        <Stack
          component="section"
          aria-labelledby="map-information-heading"
          gap="sm"
        >
          <Text
            id="map-information-heading"
            component="h2"
            className={classes['referenceRailHeading']}
            fw={600}
          >
            Map information
          </Text>
          <FactSheet columns={1} facts={mapFactSheetFacts(facts)} />
        </Stack>
      ),
    });
  }

  if (groups.length === 0) return null;

  return (
    <Paper
      className={classes['informationColumn']}
      withBorder
      radius="md"
      p="sm"
      component="aside"
      aria-label="Map reference"
    >
      <Stack gap="sm">
        {groups.map((group, index) => (
          <Fragment key={group.key}>
            {index > 0 ? <Divider /> : null}
            {group.content}
          </Fragment>
        ))}
      </Stack>
    </Paper>
  );
}
