import type { Meta, StoryObj } from '@storybook/react-vite';

import { MarkerStage } from '@/components/MarkerStage';
import type { MarkerStageProps } from '@/components/MarkerStage';

const meta = {
  title: 'Components/MarkerStage',
  component: MarkerStage,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MarkerStage>;

export default meta;
type Story = StoryObj<typeof meta>;

const unavailableMessage = 'Image unavailable.';

function syntheticImage({
  width,
  height,
  color,
}: {
  width: number;
  height: number;
  color: string;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${color}"/><path d="M0 ${height * 0.72} L${width * 0.28} ${height * 0.32} L${width * 0.55} ${height * 0.68} L${width * 0.76} ${height * 0.42} L${width} ${height * 0.8} V${height} H0Z" fill="#6f8c6f"/><circle cx="${width * 0.78}" cy="${height * 0.22}" r="${Math.max(2, Math.min(width, height) * 0.08)}" fill="#f6d77a"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function marker(label: string) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        width: 24,
        height: 24,
        placeItems: 'center',
        border: '2px solid white',
        borderRadius: '50%',
        background: '#a33a32',
        color: 'white',
        font: '700 12px/1 sans-serif',
        boxShadow: '0 1px 3px #0008',
      }}
    >
      {label}
    </span>
  );
}

function frame({ width, props }: { width: number; props: MarkerStageProps }) {
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <MarkerStage {...props} />
    </div>
  );
}

export const WideImage: Story = {
  args: {
    image: {
      src: syntheticImage({ width: 600, height: 300, color: '#bfd6d7' }),
      width: 600,
      height: 300,
      alt: 'Synthetic wide image',
    },
    markers: [
      { id: 'west', x: 125, y: 200, content: marker('A') },
      { id: 'east', x: 480, y: 170, content: marker('B') },
    ],
    unavailableMessage,
  },
  render: (args) => frame({ width: 680, props: args }),
};

export const TallImage: Story = {
  args: {
    image: {
      src: syntheticImage({ width: 240, height: 480, color: '#d5c3ad' }),
      width: 240,
      height: 480,
      alt: 'Synthetic tall image',
    },
    markers: [{ id: 'centre', x: 120, y: 300, content: marker('A') }],
    unavailableMessage,
  },
  render: (args) => frame({ width: 240, props: args }),
};

export const TinyImage: Story = {
  args: {
    image: {
      src: syntheticImage({ width: 12, height: 8, color: '#8da8b5' }),
      width: 12,
      height: 8,
      alt: 'Synthetic tiny image',
    },
    markers: [{ id: 'centre', x: 6, y: 6, content: marker('A') }],
    unavailableMessage,
  },
  render: (args) => frame({ width: 320, props: args }),
};

export const Unavailable: Story = {
  args: {
    markers: [{ id: 'hidden', x: 10, y: 20, content: marker('A') }],
    unavailableMessage,
  },
  render: (args) => frame({ width: 680, props: args }),
};
