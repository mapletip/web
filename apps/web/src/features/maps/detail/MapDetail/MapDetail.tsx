import { Stack, Text, Title } from '@mantine/core';
import {
  FactSheet,
  RecordSections,
  type RecordSection,
} from '@mapletip/component-library';
import { ShareNetwork } from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import { DetailPageShell } from '@/components/DetailPageShell';
import { AnchorLink } from '@/components/RouterLinks';
import { DetailBreadcrumbs } from '@/features/detail';
import { MAP_DETAIL_ROUTE } from '@/features/maps/shared';

import { mapDetailBreadcrumbs } from '../metadata';
import type { MapDetailView } from '../project';

import { MapDetailConnections } from './MapDetailConnections';
import { MapDetailMonsters } from './MapDetailMonsters';
import { MapDetailNpcs } from './MapDetailNpcs';

export interface MapDetailProps {
  readonly view: MapDetailView;
}

/** Server-rendered identity and map information for one Map. */
export function MapDetail({ view }: MapDetailProps): ReactElement {
  const sections: RecordSection[] = [];
  if (view.connections !== undefined) {
    sections.push({
      id: 'connections',
      title: 'Connections',
      icon: (
        <ShareNetwork size={16} color="var(--mantine-primary-color-filled)" />
      ),
      count: view.connections.count,
      content: <MapDetailConnections connections={view.connections} />,
    });
  }
  sections.push({
    id: 'monsters',
    title: 'Monsters',
    count: view.monsters.count,
    content: <MapDetailMonsters monsters={view.monsters} />,
  });
  sections.push({
    id: 'npcs',
    title: 'NPCs',
    count: view.npcs.count,
    content: <MapDetailNpcs npcs={view.npcs} />,
  });

  return (
    <DetailPageShell>
      <Stack gap="lg">
        <DetailBreadcrumbs
          items={mapDetailBreadcrumbs({ view, buildId: view.buildId })}
        />
        <div>
          <Title order={1}>{view.name}</Title>
          {view.subtitle === undefined ? null : (
            <Text c="dimmed">{view.subtitle}</Text>
          )}
          {view.activity === undefined ? null : (
            <Text>Part of {view.activity}</Text>
          )}
          {view.description === undefined ? null : (
            <Text>{view.description}</Text>
          )}
        </div>
        {view.facts.length === 0 ? null : (
          <Stack
            component="section"
            aria-labelledby="map-information-heading"
            gap="sm"
          >
            <Title id="map-information-heading" order={2}>
              Map information
            </Title>
            <FactSheet
              facts={view.facts.map((fact) => ({
                label: fact.label,
                explanation: fact.explanation,
                value:
                  fact.destination === undefined ? (
                    fact.value
                  ) : (
                    <AnchorLink to={MAP_DETAIL_ROUTE} params={fact.destination}>
                      {fact.value}
                    </AnchorLink>
                  ),
              }))}
            />
          </Stack>
        )}
        <RecordSections sections={sections} />
      </Stack>
    </DetailPageShell>
  );
}
