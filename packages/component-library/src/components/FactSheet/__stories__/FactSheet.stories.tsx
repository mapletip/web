import { Box } from '@mantine/core';
import {
  Crosshair,
  Drop,
  Eye,
  Heart,
  Lightning,
  MagicWand,
  Shield,
  Sparkle,
  Speedometer,
  Star,
  Sword,
  Wind,
} from '@phosphor-icons/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { FactSheet } from '@/components/FactSheet';
import type { Fact } from '@/components/FactSheet';

const twelveFacts: readonly Fact[] = [
  { label: 'Level', value: '42', icon: <Star size={16} /> },
  { label: 'Health', value: '23,000,000', icon: <Heart size={16} /> },
  { label: 'Mana', value: '1,200', icon: <Drop size={16} /> },
  { label: 'Experience', value: '4,500', icon: <Lightning size={16} /> },
  { label: 'Weapon attack', value: '320', icon: <Sword size={16} /> },
  { label: 'Magic attack', value: '280', icon: <MagicWand size={16} /> },
  { label: 'Weapon defense', value: '210', icon: <Shield size={16} /> },
  { label: 'Magic defense', value: '190', icon: <Sparkle size={16} /> },
  { label: 'Accuracy', value: '145', icon: <Crosshair size={16} /> },
  { label: 'Avoidability', value: '90', icon: <Eye size={16} /> },
  { label: 'Knockback', value: '1,200', icon: <Wind size={16} /> },
  { label: 'Speed', value: '-20', icon: <Speedometer size={16} /> },
];

const mixedFacts: readonly Fact[] = [
  {
    label: 'Level',
    value: '42',
    icon: <Star size={16} />,
    explanation: 'The level shown on the record, supplied by the host.',
  },
  {
    label: 'Health',
    value: '23,000,000',
    icon: <Heart size={16} />,
    explanation: 'Total health, including any published modifiers.',
  },
  {
    label: 'Mana',
    notKnown: 'Unknown',
    icon: <Drop size={16} />,
    explanation: 'The host word for a value the source does not publish.',
  },
  { label: 'Experience', value: '0', icon: <Lightning size={16} /> },
  {
    label: 'Weapon attack',
    notKnown: 'Not recorded',
    icon: <Sword size={16} />,
  },
  { label: 'Magic attack', value: '280', icon: <MagicWand size={16} /> },
  {
    label: 'Weapon defense',
    value: '210',
    icon: <Shield size={16} />,
    explanation: 'A value shown exactly as the host formatted it.',
  },
  {
    label: 'Magic defense',
    notKnown: 'Unavailable',
    icon: <Sparkle size={16} />,
  },
];

function Stage({ children }: { readonly children: ReactNode }) {
  return <Box bg="var(--mapletip-color-canvas)">{children}</Box>;
}

const meta = {
  title: 'Components/FactSheet',
  parameters: { layout: 'centered' },
} satisfies Meta<typeof FactSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwelveFacts: Story = {
  render: () => (
    <Stage>
      <Box
        data-testid="fact-sheet-twelve-facts"
        w={960}
        p="md"
        bg="var(--mapletip-color-canvas)"
      >
        <FactSheet facts={twelveFacts} />
      </Box>
    </Stage>
  ),
};

export const MixedKnown: Story = {
  render: () => (
    <Stage>
      <Box
        data-testid="fact-sheet-mixed-known"
        w={960}
        p="md"
        bg="var(--mapletip-color-canvas)"
      >
        <FactSheet facts={mixedFacts} />
      </Box>
    </Stage>
  ),
};

export const Narrow: Story = {
  render: () => (
    <Stage>
      <Box
        data-testid="fact-sheet-narrow"
        w="100%"
        maw={390}
        p="md"
        bg="var(--mapletip-color-canvas)"
      >
        <FactSheet facts={twelveFacts} />
      </Box>
    </Stage>
  ),
};
