import { Box, Button, Group, Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { EntityChip } from '@/components/EntityChip';
import recordImageStress from '@/fixtures/record-image-stress.svg?url';
import smallImage from '@/fixtures/thumbnail-small.svg?url';

const linkedChips = [
  {
    name: 'Synthetic item one',
    iconSrc: smallImage,
    destination: { href: '/synthetic/items/one' },
  },
  {
    name: 'Synthetic item two',
    iconSrc: recordImageStress,
    destination: { href: '/synthetic/items/two' },
  },
  {
    name: 'Synthetic item with no icon',
    destination: { href: '/synthetic/items/three' },
  },
];

const longName =
  'Synthetic summoning item with a deliberately long name that wraps inside its chip';

function Stage({
  testId,
  width,
  children,
}: {
  readonly testId: string;
  readonly width: number;
  readonly children: ReactNode;
}): ReactNode {
  return (
    <Box data-testid={testId} w={width} maw="100%" p="md">
      {children}
    </Box>
  );
}

function CertaintyControl({
  label = 'Confirmed',
}: {
  readonly label?: string;
}): ReactNode {
  return (
    <Button size="compact-xs" variant="light">
      {label}
    </Button>
  );
}

const meta = {
  title: 'Components/EntityChip',
  parameters: { layout: 'centered' },
} satisfies Meta<typeof EntityChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Linked: Story = {
  render: () => (
    <Stage testId="entity-chip-linked" width={560}>
      <Stack gap="xs">
        <Text size="sm">Linked chips, including one without an icon</Text>
        <Group gap="xs">
          {linkedChips.map((chip) => (
            <EntityChip key={chip.destination.href} {...chip} />
          ))}
        </Group>
      </Stack>
    </Stage>
  ),
};

export const Unlinked: Story = {
  render: () => (
    <Stage testId="entity-chip-unlinked" width={560}>
      <Stack gap="xs">
        <Text size="sm">The same chips without a destination</Text>
        <Group gap="xs">
          {linkedChips.map((chip) => (
            <EntityChip
              key={chip.destination.href}
              name={chip.name}
              iconSrc={chip.iconSrc}
            />
          ))}
        </Group>
      </Stack>
    </Stage>
  ),
};

export const LongName: Story = {
  render: () => (
    <Stage testId="entity-chip-long-name" width={390}>
      <Stack gap="xs">
        <Text size="sm">A long name wraps inside the chip</Text>
        <EntityChip
          name={longName}
          iconSrc={smallImage}
          destination={{ href: '/synthetic/items/long-name' }}
          trailing={<CertaintyControl />}
        />
      </Stack>
    </Stage>
  ),
};

export const TrailingControl: Story = {
  render: () => (
    <Stage testId="entity-chip-trailing-control" width={560}>
      <Stack gap="xs">
        <Text size="sm">
          The trailing control stays outside the link and focusable on its own
        </Text>
        <Group gap="xs">
          <EntityChip
            name="Synthetic item one"
            iconSrc={smallImage}
            destination={{ href: '/synthetic/items/one' }}
            trailing={<CertaintyControl />}
          />
          <EntityChip
            name="Synthetic item two"
            iconSrc={recordImageStress}
            destination={{ href: '/synthetic/items/two' }}
            trailing={<CertaintyControl label="Unconfirmed" />}
          />
          <EntityChip
            name="Synthetic item three"
            trailing={<CertaintyControl />}
          />
        </Group>
      </Stack>
    </Stage>
  ),
};

export const WrappingGroup: Story = {
  render: () => (
    <Stage testId="entity-chip-wrapping-group" width={560}>
      <Stack gap="xs">
        <Text size="sm">
          Chips wrap as a group without overflowing the page
        </Text>
        <Group gap="xs">
          {[
            ...linkedChips,
            {
              name: longName,
              iconSrc: smallImage,
              destination: { href: '/synthetic/items/long-name' },
            },
          ].map((chip) => (
            <EntityChip
              key={chip.name}
              {...chip}
              trailing={<CertaintyControl />}
            />
          ))}
        </Group>
      </Stack>
    </Stage>
  ),
};
