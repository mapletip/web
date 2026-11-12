import { SimpleGrid, Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SpriteStage } from '@/components/SpriteStage';
import type { SpriteStageProps } from '@/components/SpriteStage';
import ordinarySprite from '@/fixtures/sprite-ordinary.svg?url';
import oversizedSprite from '@/fixtures/sprite-oversized.svg?url';
import smallSprite from '@/fixtures/sprite-small.svg?url';

const unavailableMessage = 'No sprite is available for this record.';

const meta = {
  title: 'Components/SpriteStage',
  parameters: { layout: 'centered' },
} satisfies Meta<typeof SpriteStage>;

export default meta;
type Story = StoryObj<typeof meta>;

type StageTile = {
  readonly label: string;
  readonly stage: SpriteStageProps;
};

/**
 * One story covering every state the stage has, so the capture shows them side
 * by side at the same size and on the same canvas.
 */
const tiles: readonly StageTile[] = [
  {
    label: 'Small sprite, natural size',
    stage: {
      src: smallSprite,
      name: 'Synthetic small sprite',
      unavailableMessage,
    },
  },
  {
    label: 'Ordinary sprite, natural size',
    stage: {
      src: ordinarySprite,
      name: 'Synthetic ordinary sprite',
      unavailableMessage,
    },
  },
  {
    label: 'Oversized sprite, shrunk to fit',
    stage: {
      src: oversizedSprite,
      name: 'Synthetic oversized sprite',
      width: 1600,
      height: 2400,
      unavailableMessage,
    },
  },
  {
    label: 'Unavailable',
    stage: {
      name: 'Synthetic sprite without an image',
      unavailableMessage,
    },
  },
];

export const Gallery: Story = {
  render: () => (
    <SimpleGrid
      data-testid="sprite-stage-story"
      cols={2}
      spacing="md"
      verticalSpacing="md"
      w={1160}
      p="md"
      bg="var(--mapletip-color-canvas)"
    >
      {tiles.map(({ label, stage }) => (
        <Stack key={label} gap="xs" align="center">
          <Text size="xs" c="var(--mapletip-color-muted)">
            {label}
          </Text>
          <SpriteStage {...stage} />
        </Stack>
      ))}
    </SimpleGrid>
  ),
};
