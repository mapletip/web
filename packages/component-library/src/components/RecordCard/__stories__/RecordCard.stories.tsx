import { Badge, Box, Image, Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RecordCard } from '@/components/RecordCard';
import smallImage from '@/fixtures/thumbnail-small.svg?url';

const meta = {
  title: 'Components/RecordCard',
  component: RecordCard,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof RecordCard>;

export default meta;
type Story = StoryObj<typeof meta>;

function Stage({ children }: { readonly children: React.ReactNode }) {
  return (
    <Box w={680} maw="100%" p="md" bg="var(--mapletip-color-canvas)">
      {children}
    </Box>
  );
}

export const WithMedia: Story = {
  args: { title: 'Practice Meadow' },
  render: () => (
    <Stage>
      <RecordCard
        title="Practice Meadow"
        secondaryLine="West Practice Grounds · Meadow District"
        badges={<Badge variant="light">Synthetic region</Badge>}
        media={
          <Image
            src={smallImage}
            alt=""
            w={160}
            h={96}
            fit="contain"
            loading="lazy"
          />
        }
        footer="12 spawns"
        destination={{ href: '/synthetic/maps/practice-meadow' }}
      />
    </Stage>
  ),
};

export const WithoutMedia: Story = {
  args: { title: 'Quiet Clearing' },
  render: () => (
    <Stage>
      <RecordCard
        title="Quiet Clearing"
        secondaryLine="Eastern Practice Grounds"
        footer="1 spawn"
      />
    </Stage>
  ),
};

export const UnlinkedCard: Story = {
  args: { title: 'Unlinked training map' },
  render: () => (
    <Stage>
      <Stack gap="sm">
        <RecordCard
          title="Unlinked training map"
          secondaryLine="A static card has no tab stop."
          media={<Text size="xs">No image</Text>}
        />
        <RecordCard
          title="Linked training map"
          destination={{ href: '/synthetic/maps/linked-training-map' }}
        />
      </Stack>
    </Stage>
  ),
};
