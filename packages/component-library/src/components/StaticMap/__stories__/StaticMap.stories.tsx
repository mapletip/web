import type { Meta, StoryObj } from '@storybook/react-vite';

import { StaticMap } from '@/components/StaticMap';
import type { StaticMapProps } from '@/components/StaticMap';

const meta = {
  title: 'Components/Map/StaticMap',
  component: StaticMap,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A fitted, non-interactive image stage.

**Props**

- \`image\`: optional image URL, intrinsic pixel dimensions, and accessible name. Omit it when no image is available.
- \`markers\`: required host-rendered markers with stable ids and image-pixel coordinates. Markers at the same point are grouped.
- \`selectedIds\`: optional marker ids to highlight.
- \`connectors\`: optional pairs of marker ids joined by decorative lines.
- \`loading\`: optional native image loading behavior (\`eager\` or \`lazy\`).
- \`className\` and \`style\`: applied to the stage root so a host can fit it.
- \`unavailableMessage\`: required message shown when no image is available or its request fails.`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StaticMap>;

export default meta;
type Story = StoryObj<typeof meta>;

const unavailableMessage = 'Image unavailable.';

function syntheticImage({
  width,
  height,
  color,
}: {
  readonly width: number;
  readonly height: number;
  readonly color: string;
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
        width: 'var(--interactive-map-marker-size)',
        height: 'var(--interactive-map-marker-size)',
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

const wideProps: StaticMapProps = {
  image: {
    src: syntheticImage({ width: 600, height: 300, color: '#bfd6d7' }),
    width: 600,
    height: 300,
    alt: 'Synthetic wide image',
  },
  markers: [
    {
      id: 'west',
      x: 125,
      y: 200,
      label: 'West point',
      content: marker('A'),
    },
    {
      id: 'east',
      x: 480,
      y: 170,
      label: 'East point',
      content: marker('B'),
    },
  ],
  connectors: [{ id: 'west-east', from: 'west', to: 'east' }],
  unavailableMessage,
};

export const Wide: Story = {
  args: { ...wideProps, loading: 'lazy' },
  render: (args) => (
    <div style={{ width: 680 }}>
      <StaticMap {...args} />
    </div>
  ),
};

export const Tall: Story = {
  args: {
    image: {
      src: syntheticImage({ width: 240, height: 480, color: '#d5c3ad' }),
      width: 240,
      height: 480,
      alt: 'Synthetic tall image',
    },
    markers: [
      {
        id: 'center',
        x: 120,
        y: 300,
        label: 'Center point',
        content: marker('A'),
      },
    ],
    unavailableMessage,
  },
  render: (args) => (
    <div style={{ width: 240 }}>
      <StaticMap {...args} />
    </div>
  ),
};

export const Tiny: Story = {
  args: {
    image: {
      src: syntheticImage({ width: 12, height: 8, color: '#8da8b5' }),
      width: 12,
      height: 8,
      alt: 'Synthetic tiny image',
    },
    markers: [
      { id: 'center', x: 6, y: 6, label: 'Center point', content: marker('A') },
    ],
    unavailableMessage,
  },
  render: (args) => (
    <div style={{ width: 320 }}>
      <StaticMap {...args} />
    </div>
  ),
};

export const CoincidentMarkers: Story = {
  args: {
    ...wideProps,
    markers: [
      {
        id: 'first',
        x: 260,
        y: 150,
        label: 'First point',
        content: marker('A'),
      },
      {
        id: 'second',
        x: 260,
        y: 150,
        label: 'Second point',
        content: marker('B'),
      },
    ],
    connectors: [],
  },
};

export const Unavailable: Story = {
  args: { markers: [], unavailableMessage },
};
