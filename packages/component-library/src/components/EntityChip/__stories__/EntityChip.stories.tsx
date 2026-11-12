import { Box, Button, Group, Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { EntityChip } from '@/components/EntityChip';
import recordImageStress from '@/fixtures/record-image-stress.svg?url';
import smallImage from '@/fixtures/thumbnail-small.svg?url';

const longName =
  'Synthetic summoning item with a deliberately long name that wraps inside its chip';

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

function GallerySection({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactNode {
  return (
    <Stack gap="xs">
      <Text size="xs" c="var(--mapletip-color-muted)">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

const meta = {
  title: 'Components/EntityChip',
  parameters: { layout: 'centered' },
} satisfies Meta<typeof EntityChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One story covering every state the chip has, so the capture shows linked,
 * unlinked, placeholder, trailing-control, long-name and wrapping cases on the
 * same canvas at the same sizes.
 */
export const Gallery: Story = {
  render: () => (
    <Stack
      data-testid="entity-chip-story"
      w={640}
      p="md"
      gap="lg"
      bg="var(--mapletip-color-canvas)"
    >
      <GallerySection label="Linked chips, including one without an icon">
        <Group gap="xs">
          <EntityChip
            name="Linked item one"
            iconSrc={smallImage}
            destination={{ href: '/synthetic/items/one' }}
          />
          <EntityChip
            name="Linked item two"
            iconSrc={recordImageStress}
            destination={{ href: '/synthetic/items/two' }}
          />
          <EntityChip
            name="Linked item without an icon"
            destination={{ href: '/synthetic/items/three' }}
          />
        </Group>
      </GallerySection>

      <GallerySection label="Unlinked chips: plain text, no link">
        <Group gap="xs">
          <EntityChip name="Unlinked item one" iconSrc={smallImage} />
          <EntityChip name="Unlinked item two" iconSrc={recordImageStress} />
          <EntityChip name="Unlinked item without an icon" />
        </Group>
      </GallerySection>

      <GallerySection label="Trailing controls stay outside the link">
        <Group gap="xs">
          <EntityChip
            name="Confirmed item"
            iconSrc={smallImage}
            destination={{ href: '/synthetic/items/confirmed' }}
            trailing={<CertaintyControl />}
          />
          <EntityChip
            name="Unconfirmed item"
            iconSrc={recordImageStress}
            destination={{ href: '/synthetic/items/unconfirmed' }}
            trailing={<CertaintyControl label="Unconfirmed" />}
          />
          <EntityChip
            name="No-destination item"
            trailing={<CertaintyControl />}
          />
        </Group>
      </GallerySection>

      <GallerySection label="A long name wraps inside the chip">
        <Box w={320} maw="100%">
          <EntityChip
            name={longName}
            iconSrc={smallImage}
            destination={{ href: '/synthetic/items/long-name' }}
            trailing={<CertaintyControl />}
          />
        </Box>
      </GallerySection>

      <GallerySection label="Chips wrap as a group">
        <Box w={320} maw="100%">
          <Group gap="xs">
            <EntityChip
              name="Wrapping item one"
              iconSrc={smallImage}
              destination={{ href: '/synthetic/items/wrapping-one' }}
              trailing={<CertaintyControl />}
            />
            <EntityChip
              name="Wrapping item two with a longer name"
              iconSrc={recordImageStress}
              destination={{ href: '/synthetic/items/wrapping-two' }}
              trailing={<CertaintyControl />}
            />
            <EntityChip
              name="Wrapping item three"
              destination={{ href: '/synthetic/items/wrapping-three' }}
              trailing={<CertaintyControl />}
            />
          </Group>
        </Box>
      </GallerySection>
    </Stack>
  ),
};
