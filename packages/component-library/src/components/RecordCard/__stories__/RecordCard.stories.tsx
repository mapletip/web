import { Badge, Box, Button, Image, Stack, Text } from '@mantine/core';
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

export const MediaAside: Story = {
  args: { title: 'Practice Meadow' },
  render: () => (
    <Stage>
      <RecordCard
        layout="mediaAside"
        title="Practice Meadow"
        secondaryLine="West Practice Grounds · Meadow District"
        media={
          <Image
            src={smallImage}
            alt=""
            w={280}
            h={110}
            fit="contain"
            loading="lazy"
          />
        }
        footer={
          <Text size="sm" c="dimmed">
            <strong>12</strong> spawns
          </Text>
        }
      />
    </Stage>
  ),
};

export const LinkedCardWithFooterButton: Story = {
  args: { title: 'Practice Meadow' },
  render: () => (
    <Stage>
      <div data-testid="record-card-linked-footer-button">
        <RecordCard
          layout="mediaAside"
          title="Practice Meadow"
          secondaryLine="West Practice Grounds · Meadow District"
          footer={<Button size="xs">Locate</Button>}
          destination={{ href: '/synthetic/maps/practice-meadow' }}
        />
      </div>
    </Stage>
  ),
};

export const HeaderScopedCardWithFooterButton: Story = {
  args: { title: 'Practice Meadow', linkScope: 'header' },
  render: () => (
    <Stage>
      <div data-testid="record-card-header-scoped-footer-button">
        <RecordCard
          layout="mediaAside"
          title="Practice Meadow"
          secondaryLine="West Practice Grounds · Meadow District"
          footer={<Button size="xs">Locate</Button>}
          destination={{ href: '/synthetic/maps/practice-meadow' }}
          linkScope="header"
        />
      </div>
    </Stage>
  ),
};

export const CompactTwoColumnNarrow: Story = {
  args: { title: 'Blue Slime', linkScope: 'header' },
  render: () => (
    <Box w={320} maw="100%" p="md" bg="var(--mapletip-color-canvas)">
      <div
        style={{
          display: 'grid',
          gap: 8,
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        }}
      >
        <RecordCard
          layout="compactMediaAside"
          title="Blue Slime"
          secondaryLine="Lv 12"
          media={<Box w={48} h={48} bg="var(--mapletip-color-border-subtle)" />}
          footer={<Text size="sm">6 spawns</Text>}
          destination={{ href: '/synthetic/monsters/blue-slime' }}
        />
        <RecordCard
          layout="compactMediaAside"
          title="Red Slime"
          secondaryLine="Lv 13"
          media={<Box w={48} h={48} bg="var(--mapletip-color-border-subtle)" />}
          footer={<Text size="sm">4 spawns · 3m respawn</Text>}
          destination={{ href: '/synthetic/monsters/red-slime' }}
          linkScope="header"
        />
      </div>
    </Box>
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
