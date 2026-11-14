import { Stack, Title } from '@mantine/core';
import type { ReactElement } from 'react';

import { DetailPageShell } from '@/components/DetailPageShell';
import { DetailBreadcrumbs } from '@/features/detail';

import { monsterDetailBreadcrumbs } from '../metadata';
import type { MonsterDetailView } from '../project';

export interface MonsterDetailProps {
  readonly view: MonsterDetailView;
}

/**
 * Identity header and skeleton layout for a single Monster Detail page.
 */
export function MonsterDetail({ view }: MonsterDetailProps): ReactElement {
  const breadcrumbs = monsterDetailBreadcrumbs({
    view,
    buildId: view.buildId,
  });

  return (
    <DetailPageShell>
      <Stack gap="lg">
        <DetailBreadcrumbs items={breadcrumbs} />
        <Title order={1}>{view.name}</Title>
      </Stack>
    </DetailPageShell>
  );
}
