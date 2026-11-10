import { Button, Drawer, Group, Stack, Text, Title } from '@mantine/core';
import { Package } from '@phosphor-icons/react';
import { useId, useState, type ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';

import { MonsterSprite } from '../../MonsterSprite';
import type { MonsterBrowseRow } from '../../project';
import { MonsterDropEntries } from '../MonsterDropEntries';
import { dropListingActionLabel } from '../MonsterDropListing';
import classes from '../MonsterDrops.module.css';

export function MonsterDropDrawerControl({
  record,
  buildId,
}: {
  readonly record: MonsterBrowseRow;
  readonly buildId: BuildId;
}): ReactElement {
  const [opened, setOpened] = useState(false);
  const drawerId = useId();
  const actionLabel = dropListingActionLabel(record, false);
  const levelLabel =
    record.level === undefined ? 'Level unknown' : `Level ${record.level}`;

  return (
    <>
      <Button
        type="button"
        variant={opened ? 'light' : 'default'}
        size="compact-sm"
        radius="sm"
        px={4}
        leftSection={<Package size={14} aria-hidden="true" />}
        classNames={{
          section: classes['triggerSection'],
          label: classes['triggerLabel'],
        }}
        aria-haspopup="dialog"
        aria-expanded={opened}
        aria-controls={drawerId}
        aria-label={actionLabel}
        title={`${record.drops.entries.length.toLocaleString('en-US')} Drops`}
        onClick={() => setOpened(true)}
      >
        {record.drops.entries.length.toLocaleString('en-US')}
      </Button>
      <Drawer
        id={drawerId}
        opened={opened}
        onClose={() => setOpened(false)}
        position="bottom"
        size="50vh"
        radius="md"
        classNames={{
          content: classes['drawerContent'],
          header: classes['drawerHeader'],
          body: classes['drawerScrollBody'],
        }}
        title={
          <Group gap="sm" wrap="nowrap">
            <MonsterSprite sprite={record.sprite} />
            <Stack gap={0}>
              <Text fw={600}>{record.name}</Text>
              <Text size="xs" c="dimmed">
                {levelLabel}
              </Text>
            </Stack>
          </Group>
        }
        closeButtonProps={{
          'aria-label': `Close Drops for ${record.name}`,
        }}
        overlayProps={{ backgroundOpacity: 0.6, blur: 1 }}
      >
        <Stack gap="sm">
          <Title order={3} size="sm">
            {`Drops (${record.drops.entries.length.toLocaleString('en-US')})`}
          </Title>
          <MonsterDropEntries
            record={record}
            buildId={buildId}
            onClose={() => setOpened(false)}
          />
        </Stack>
      </Drawer>
    </>
  );
}
