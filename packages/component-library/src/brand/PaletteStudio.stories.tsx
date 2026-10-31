import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

import { PaletteStudio } from '@/palette-studio/PaletteStudio';

const meta = {
  title: 'Brand/Palette Studio',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'MapleTip Palette Exploration Studio',
  render: (_args, context): ReactElement => {
    const globals = context.globals as Record<string, unknown>;
    const rawPalette = globals['brandPalette'];
    const rawScheme = globals['colorScheme'];
    const initialPaletteId =
      typeof rawPalette === 'string' ? rawPalette : undefined;
    const initialColorScheme =
      rawScheme === 'light' || rawScheme === 'dark' ? rawScheme : undefined;

    return (
      <PaletteStudio
        initialPaletteId={initialPaletteId}
        initialColorScheme={initialColorScheme}
      />
    );
  },
};
