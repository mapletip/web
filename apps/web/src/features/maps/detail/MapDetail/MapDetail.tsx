import { Stack, Text, Title } from '@mantine/core';
import type { ReactElement } from 'react';

import { DetailPageShell } from '@/components/DetailPageShell';
import { DetailBreadcrumbs } from '@/features/detail';

import { mapDetailBreadcrumbs } from '../metadata';
import type { MapDetailView } from '../project';

export interface MapDetailProps {
  readonly view: MapDetailView;
}

/** Server-rendered identity skeleton for one Map. */
export function MapDetail({ view }: MapDetailProps): ReactElement {
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
        </div>
      </Stack>
    </DetailPageShell>
  );
}
