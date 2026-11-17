import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent } from 'storybook/test';

import { MarkerStage } from '@/components/MarkerStage';
import type { MarkerStageProps } from '@/components/MarkerStage';

const meta = {
  title: 'Components/MarkerStage',
  component: MarkerStage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A host-rendered image stage.',
      },
    },
  },
  tags: ['autodocs'],
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
        width: 'var(--marker-stage-marker-size)',
        height: 'var(--marker-stage-marker-size)',
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

const wideImageArgs: MarkerStageProps = {
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
    {
      id: 'north',
      x: 330,
      y: 80,
      label: 'North point',
      content: marker('C'),
    },
    {
      id: 'south',
      x: 260,
      y: 260,
      label: 'South point',
      content: marker('D'),
    },
  ],
  selectedIds: [],
  unavailableMessage,
};

export const WideImage: Story = {
  args: wideImageArgs,
  render: (args) => frame({ width: 680, props: args }),
};

export const NoneSelected: Story = {
  args: wideImageArgs,
  render: (args) => frame({ width: 680, props: args }),
};

export const OneSelected: Story = {
  args: { ...wideImageArgs, selectedIds: ['east'] },
  render: (args) => frame({ width: 680, props: args }),
};

export const ManySelected: Story = {
  args: { ...wideImageArgs, selectedIds: ['west', 'north', 'south'] },
  render: (args) => frame({ width: 680, props: args }),
};

export const Focused: Story = {
  args: { ...wideImageArgs, selectedIds: ['east'] },
  render: (args) => frame({ width: 680, props: args }),
  play: async () => {
    await userEvent.tab();
    await userEvent.tab();
  },
};

export const ConnectedPairs: Story = {
  args: {
    ...wideImageArgs,
    connectors: [
      { id: 'west-east', from: 'west', to: 'east' },
      { id: 'north-south', from: 'north', to: 'south' },
    ],
  },
  render: (args) => frame({ width: 680, props: args }),
};

export const ZoomedWithLinesAndSelection: Story = {
  args: {
    ...wideImageArgs,
    connectors: [
      { id: 'west-east', from: 'west', to: 'east' },
      { id: 'north-south', from: 'north', to: 'south' },
    ],
    selectedIds: ['east', 'south'],
  },
  render: (args) => frame({ width: 680, props: args }),
  play: async ({ canvasElement }) => {
    const zoomIn = canvasElement.querySelector<HTMLButtonElement>(
      'button[aria-label="Zoom in"]',
    );
    if (zoomIn !== null) await userEvent.click(zoomIn);
  },
};

export const CoincidentMarkers: Story = {
  args: {
    ...wideImageArgs,
    markers: [
      {
        id: 'first',
        x: 260,
        y: 150,
        label: 'First point',
        content: marker(''),
      },
      {
        id: 'second',
        x: 260,
        y: 150,
        label: 'Second point',
        content: marker(''),
      },
    ],
  },
  render: (args) => frame({ width: 680, props: args }),
};

export const Static: Story = {
  args: { ...wideImageArgs, interactive: false, selectedIds: ['east'] },
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
    markers: [
      {
        id: 'centre',
        x: 120,
        y: 300,
        label: 'Centre point',
        content: marker('A'),
      },
    ],
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
    markers: [
      { id: 'centre', x: 6, y: 6, label: 'Centre point', content: marker('A') },
    ],
    unavailableMessage,
  },
  render: (args) => frame({ width: 320, props: args }),
};

export const DetailsAtCenter: Story = {
  args: {
    ...wideImageArgs,
    markers: [
      {
        id: 'centre',
        x: 300,
        y: 150,
        label: 'Centre point',
        content: marker('A'),
      },
    ],
    renderDetails: (markerIds) => (
      <div>
        <strong>{markerIds.join(', ')}</strong>
        <p>Details shown beside the center point.</p>
      </div>
    ),
  },
  render: (args) => frame({ width: 680, props: args }),
};

export const DetailsNearEachEdge: Story = {
  args: {
    ...wideImageArgs,
    markers: [
      {
        id: 'top',
        x: 20,
        y: 20,
        label: 'Top edge point',
        content: marker('T'),
      },
      {
        id: 'right',
        x: 580,
        y: 40,
        label: 'Right edge point',
        content: marker('R'),
      },
      {
        id: 'bottom',
        x: 580,
        y: 280,
        label: 'Bottom edge point',
        content: marker('B'),
      },
      {
        id: 'left',
        x: 20,
        y: 260,
        label: 'Left edge point',
        content: marker('L'),
      },
    ],
    renderDetails: (markerIds) => (
      <div>
        <strong>{markerIds.join(', ')}</strong>
        <p>Details stay within the stage near every edge.</p>
      </div>
    ),
  },
  render: (args) => frame({ width: 680, props: args }),
};

export const Unavailable: Story = {
  args: {
    markers: [
      {
        id: 'hidden',
        x: 10,
        y: 20,
        label: 'Hidden point',
        content: marker('A'),
      },
    ],
    unavailableMessage,
  },
  render: (args) => frame({ width: 680, props: args }),
};
