import { Group, SimpleGrid, Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Thumbnail } from '@/components/Thumbnail';
import recordImageStress from '@/fixtures/record-image-stress.svg?url';
import smallImage from '@/fixtures/thumbnail-small.svg?url';

const brokenImage = 'data:image/png;base64,not-an-image';

const meta = {
  title: 'Components/Thumbnail',
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Thumbnail>;

export default meta;
type Story = StoryObj<typeof meta>;

type GalleryTile = {
  label: string;
  thumbnails: readonly {
    src?: string;
    size: number;
    caption?: string;
  }[];
};

const galleryTiles: readonly GalleryTile[] = [
  {
    label: 'Large image scaled down',
    thumbnails: [{ src: recordImageStress, size: 40 }],
  },
  {
    label: 'Small image at native size',
    thumbnails: [{ src: smallImage, size: 40 }],
  },
  {
    label: 'Missing image',
    thumbnails: [{ size: 40 }],
  },
  {
    label: 'Broken image',
    thumbnails: [{ src: brokenImage, size: 40 }],
  },
  {
    label: 'Size row',
    thumbnails: [24, 32, 40, 48].map((size) => ({
      src: recordImageStress,
      size,
      caption: String(size),
    })),
  },
];

export const Gallery: Story = {
  render: () => (
    <SimpleGrid
      data-testid="thumbnail-story"
      cols={2}
      spacing="lg"
      verticalSpacing="lg"
      w={480}
    >
      {galleryTiles.map(({ label, thumbnails }) => (
        <Stack key={label} align="center" gap="xs">
          <Text size="sm">{label}</Text>
          <Group align="center" gap="xs" wrap="nowrap">
            {thumbnails.map(({ src, size, caption }) => (
              <Stack key={size} align="center" gap={2}>
                <Thumbnail src={src} size={size} />
                {caption && <Text size="xs">{caption}</Text>}
              </Stack>
            ))}
          </Group>
        </Stack>
      ))}
    </SimpleGrid>
  ),
};
