import { Group, Text } from '@mantine/core';
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

export const LargeImage: Story = {
  name: 'Large image scales down',
  render: () => (
    <Group data-testid="thumbnail-story" align="center" gap="sm">
      <Thumbnail src={recordImageStress} size={40} />
      <Text>Large image in a 40 px box</Text>
    </Group>
  ),
};

export const SmallImage: Story = {
  name: 'Small image keeps native size',
  render: () => (
    <Group data-testid="thumbnail-story" align="center" gap="sm">
      <Thumbnail src={smallImage} size={40} />
      <Text>16 px image in a 40 px box</Text>
    </Group>
  ),
};

export const MissingImage: Story = {
  name: 'Missing image',
  render: () => (
    <Group data-testid="thumbnail-story" align="center" gap="sm">
      <Thumbnail size={40} />
      <Text>No image available</Text>
    </Group>
  ),
};

export const BrokenImage: Story = {
  name: 'Broken image',
  render: () => (
    <Group data-testid="thumbnail-story" align="center" gap="sm">
      <Thumbnail src={brokenImage} size={40} />
      <Text>Image could not be loaded</Text>
    </Group>
  ),
};

export const SizeRow: Story = {
  name: 'Several sizes beside text',
  render: () => (
    <Group data-testid="thumbnail-story" align="center" gap="md" wrap="nowrap">
      {[24, 32, 40, 48].map((size) => (
        <Group key={size} align="center" gap="xs" wrap="nowrap">
          <Thumbnail src={recordImageStress} size={size} />
          <Text>{size}</Text>
        </Group>
      ))}
    </Group>
  ),
};
