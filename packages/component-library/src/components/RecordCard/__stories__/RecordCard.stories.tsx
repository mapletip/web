import {
  Badge,
  Box,
  Button,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { BookBookmark, Check } from '@phosphor-icons/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { RecordCard, RecordFacts } from '@/components/RecordCard';
import { Thumbnail } from '@/components/Thumbnail';
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

export const QuietIdentity: Story = {
  args: { title: 'Copper Compass', layout: 'quietIdentity' },
  render: () => (
    <Stage>
      <RecordCard
        layout="quietIdentity"
        title="Copper Compass"
        leadLine="Sells for 35 coins"
        media={<Thumbnail src={smallImage} size={48} />}
        inlineLabels={[
          {
            id: 'tasks',
            icon: <BookBookmark size={16} />,
            label: 'Used in tasks',
            tone: 'brand',
          },
          {
            id: 'ready',
            icon: <Check size={16} />,
            label: 'Ready to use',
            tone: 'success',
          },
        ]}
        detailLine="Found in the practice meadow"
        action={fn()}
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
  args: { title: 'Blue Gloop', linkScope: 'header' },
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
          title="Blue Gloop"
          secondaryLine="Lv 12"
          media={<Box w={48} h={48} bg="var(--mapletip-color-border-subtle)" />}
          footer={<Text size="sm">6 spawns</Text>}
          destination={{ href: '/synthetic/monsters/blue-gloop' }}
        />
        <RecordCard
          layout="compactMediaAside"
          title="Red Gloop"
          secondaryLine="Lv 13"
          media={<Box w={48} h={48} bg="var(--mapletip-color-border-subtle)" />}
          footer={<Text size="sm">4 spawns · 3m respawn</Text>}
          destination={{ href: '/synthetic/monsters/red-gloop' }}
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

const openDetails = fn();
const inspectSource = fn();

export const IdentityGallery: Story = {
  args: { title: 'Copper Compass', layout: 'identity' },
  render: () => (
    <Box w={960} maw="100%" p="md" bg="var(--mapletip-color-canvas)">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        <RecordCard
          layout="identity"
          title="Copper Compass"
          leadLine="A keepsake for travelers"
          media={<Box w={48} h={48} bg="var(--mapletip-color-border-strong)" />}
          destination={{ href: '#compass' }}
          facts={[
            { id: 'region', label: 'Found in', detail: 'Northern orchard' },
            { id: 'value', label: 'Value', values: ['250', '100'] },
          ]}
        />
        <RecordCard
          layout="identity"
          title="Still Stone"
          leadLine="A quiet keepsake"
        />
        <RecordCard
          layout="identity"
          title="Amber Lantern"
          facts={[{ id: 'sources', label: 'Sources', values: ['4'] }]}
        />
      </SimpleGrid>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await expect(
      canvas.getByRole('link', { name: 'Copper Compass' }),
    ).toBeVisible();
  },
};

export const IdentityActionFacts: Story = {
  args: { title: 'Copper Compass', layout: 'identity' },
  render: () => (
    <Box w={360} maw="100%" p="md" bg="var(--mapletip-color-canvas)">
      <RecordCard
        layout="identity"
        title="Copper Compass"
        leadLine="A keepsake for travelers"
        action={openDetails}
        facts={[
          {
            id: 'source',
            label: 'Inspect source',
            detail: 'Northern orchard',
            action: inspectSource,
          },
          { id: 'value', label: 'Value', values: ['250', '100'] },
        ]}
      />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Inspect source Northern orchard' }),
    );
    await expect(inspectSource).toHaveBeenCalled();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Copper Compass' }),
    );
    await expect(openDetails).toHaveBeenCalled();
  },
};

export const IdentityOpen: Story = {
  args: { title: 'Copper Compass', layout: 'identity' },
  render: () => (
    <Stage>
      <RecordCard
        layout="identity"
        title="Copper Compass"
        action={openDetails}
        isDetailsOpen
        facts={[{ id: 'source', label: 'Found in', values: ['3 regions'] }]}
      />
    </Stage>
  ),
};

export const SelectedFacts: Story = {
  args: { title: 'Copper Compass' },
  render: () => (
    <Stage>
      <RecordFacts
        facts={[
          {
            id: 'lesser',
            label: 'Lesser',
            detail: '80% success',
            values: ['+2 weapon attack'],
            selected: true,
          },
          {
            id: 'greater',
            label: 'Greater',
            detail: '80% success · can destroy item',
            values: ['+5 weapon attack'],
            action: fn(),
          },
        ]}
      />
    </Stage>
  ),
};

export const IdentityLongText: Story = {
  args: { title: 'Copper Compass', layout: 'identity' },
  render: () => (
    <Box w={320} maw="100%" p="md" bg="var(--mapletip-color-canvas)">
      <RecordCard
        layout="identity"
        title="A remarkably long name for a copper navigation compass"
        leadLine="A keepsake for travelers throughout the valley"
        facts={[
          {
            id: 'place',
            label: 'Found in',
            detail:
              'The northern orchard beyond the quiet meadow and the long western road',
            values: ['12'],
          },
        ]}
      />
    </Box>
  ),
};

export const PictureGallery: Story = {
  args: { title: 'Copper Compass', layout: 'picture' },
  render: () => (
    <Box w={960} maw="100%" p="md" bg="var(--mapletip-color-canvas)">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        <RecordCard
          layout="picture"
          title="Copper Compass"
          media={<Thumbnail src={smallImage} size={96} alt="" />}
          destination={{ href: '#picture-compass' }}
        />
        <RecordCard
          layout="picture"
          title="Still Stone"
          media={<Thumbnail src="/missing-stone.png" size={96} alt="" />}
          leadLine="A quiet keepsake"
          secondaryLine="Found in the northern orchard"
        />
        <RecordCard
          layout="picture"
          title="A remarkably long name for an amber lantern carried through the valley"
          media={<Thumbnail src={smallImage} size={96} alt="" />}
          leadLine="A bright keepsake"
          secondaryLine="Found beyond the western road"
          action={openDetails}
        />
      </SimpleGrid>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openButton = canvas.getByRole('button', {
      name: 'A remarkably long name for an amber lantern carried through the valley',
    });
    await expect(openButton).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(openButton);
    await expect(openDetails).toHaveBeenCalled();
    await expect(canvas.getAllByRole('heading')).toHaveLength(3);
  },
};
