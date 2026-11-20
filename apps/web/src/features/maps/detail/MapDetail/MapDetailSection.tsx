import { Group, Stack, Text, Title } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import type { MapDetailView } from '../project';

type MapDetailSectionState = MapDetailView['connections']['state'];

export function MapDetailSection({
  id,
  title,
  state,
  notice,
  itemCount,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly state: MapDetailSectionState;
  readonly notice?: string | undefined;
  readonly itemCount: number;
  readonly children: ReactNode;
}): ReactElement | null {
  if (itemCount === 0 && (state === 'known' || state === 'absent')) {
    return null;
  }

  return (
    <section aria-labelledby={id}>
      <Stack gap="md">
        <Group gap="sm" align="baseline" wrap="wrap">
          <Title id={id} order={2}>
            {title}
          </Title>
          {state === 'partial' && notice !== undefined ? (
            <Text size="sm" c="dimmed">
              {notice}
            </Text>
          ) : null}
        </Group>
        {state === 'unknown' && notice !== undefined ? (
          <Text>{notice}</Text>
        ) : null}
        {children}
      </Stack>
    </section>
  );
}
