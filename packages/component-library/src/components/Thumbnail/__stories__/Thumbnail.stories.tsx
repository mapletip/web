import { Group, SimpleGrid, Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

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

function imageOfSize({ width, height }: { width: number; height: number }) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#e6b84c"/><rect x="0" y="0" width="4" height="4" fill="#354e64"/></svg>`,
  )}`;
}

const magnifiedTiles = [
  { label: 'Small 4 × 4', src: imageOfSize({ width: 4, height: 4 }) },
  { label: 'Exact 20 × 20', src: imageOfSize({ width: 20, height: 20 }) },
  { label: 'Large 80 × 80', src: imageOfSize({ width: 80, height: 80 }) },
  { label: 'Wide 32 × 8', src: imageOfSize({ width: 32, height: 8 }) },
  { label: 'Tall 8 × 32', src: imageOfSize({ width: 8, height: 32 }) },
  { label: 'Missing image', src: undefined },
];

export const MagnifiedGallery: Story = {
  render: () => (
    <SimpleGrid
      data-testid="magnified-thumbnail-story"
      cols={3}
      spacing="lg"
      w={480}
    >
      {magnifiedTiles.map(({ label, src }) => (
        <Stack key={label} align="center" gap="xs">
          <Text size="sm">{label}</Text>
          <Thumbnail src={src} size={40} magnify={2} alt={label} />
        </Stack>
      ))}
    </SimpleGrid>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const { label } of magnifiedTiles) {
      await expect(
        canvas.getByRole('img', { name: label }),
      ).toBeInTheDocument();
    }
    await expect(
      canvas.getByRole('img', { name: 'Missing image' }),
    ).toHaveAttribute('data-fallback', 'true');
  },
};
