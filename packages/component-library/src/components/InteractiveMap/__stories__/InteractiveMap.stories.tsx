import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { userEvent } from 'storybook/test';

import { InteractiveMap } from '@/components/InteractiveMap';
import type {
  InteractiveMapProps,
  InteractiveMapView,
} from '@/components/InteractiveMap';

const meta = {
  title: 'Components/InteractiveMap',
  component: InteractiveMap,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A host-rendered image stage.

**Props**

- \`image\`: optional image object with its source URL, intrinsic pixel width and height, and accessible name. Omit it when the image is unavailable.
- \`markers\`: required list of host-rendered targets. Each has a stable id, image-pixel coordinates, accessible label, and content centered on its point. Interactive targets are 44×44px and centered on the same point.
- \`connectors\`: optional id and endpoint pairs drawn between marker ids.
- \`selectedIds\`: ids the host currently selects; defaults to none.
- \`onActivate\`: receives all marker ids at an activated point.
- \`renderDetails\`: returns optional content for an activated point.
- \`interactive\`: enables marker buttons and stage controls; defaults to true.
- \`gestures\`: defaults to 'always', which enables drag panning, pinch zoom, and double-click zoom. 'zoomed' keeps pinch zoom enabled and enables one-finger panning only above fit; at fit, vertical touch gestures scroll the page and double-click zoom is off.
- \`wheelZoom\`: enables wheel zoom; defaults to false.
- \`view\`: optional saved view, with zoom relative to fit and center coordinates in image pixels. Applying \`undefined\` after a saved view returns to fit.
- \`onViewChange\`: receives one settled view after pan or zoom, or \`undefined\` after Fit.
- \`zoomInLabel\`, \`zoomOutLabel\`, \`fitLabel\`: accessible names for the three controls.
- \`unavailableMessage\`: required message shown when no image is available or its request fails.`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof InteractiveMap>;

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

function frame({
  width,
  props,
  testId,
}: {
  width: number;
  props: InteractiveMapProps;
  testId: string;
}) {
  return (
    <div data-testid={testId} style={{ width, maxWidth: '100%' }}>
      <InteractiveMap {...props} />
    </div>
  );
}

function SavedRestoredViewStory(): ReactElement {
  const [view, setView] = useState<InteractiveMapView | undefined>();
  const [savedView, setSavedView] = useState<InteractiveMapView | undefined>();

  return (
    <div
      data-testid="interactive-map-saved-restored"
      style={{ width: 680, maxWidth: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          disabled={view === undefined}
          onClick={() => setSavedView(view)}
        >
          Save view
        </button>
        <button
          type="button"
          disabled={savedView === undefined}
          onClick={() => setView(savedView)}
        >
          Restore view
        </button>
        <output aria-live="polite">
          {savedView === undefined ? 'No saved view' : 'View saved'}
        </output>
      </div>
      <InteractiveMap {...wideImageArgs} view={view} onViewChange={setView} />
    </div>
  );
}

const wideImageArgs: InteractiveMapProps = {
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
  render: (args) =>
    frame({ width: 680, props: args, testId: 'interactive-map-wide-image' }),
};

export const NoneSelected: Story = {
  args: wideImageArgs,
  render: (args) =>
    frame({ width: 680, props: args, testId: 'interactive-map-none-selected' }),
};

export const OneSelected: Story = {
  args: { ...wideImageArgs, selectedIds: ['east'] },
  render: (args) =>
    frame({ width: 680, props: args, testId: 'interactive-map-one-selected' }),
};

export const ManySelected: Story = {
  args: { ...wideImageArgs, selectedIds: ['west', 'north', 'south'] },
  render: (args) =>
    frame({ width: 680, props: args, testId: 'interactive-map-many-selected' }),
};

export const Focused: Story = {
  args: { ...wideImageArgs, selectedIds: ['east'] },
  render: (args) =>
    frame({ width: 680, props: args, testId: 'interactive-map-focused' }),
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
  render: (args) =>
    frame({
      width: 680,
      props: args,
      testId: 'interactive-map-connected-pairs',
    }),
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
  render: (args) =>
    frame({
      width: 680,
      props: args,
      testId: 'interactive-map-zoomed-lines-selection',
    }),
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
  render: (args) =>
    frame({
      width: 680,
      props: args,
      testId: 'interactive-map-coincident-markers',
    }),
};

export const DenseMarkers: Story = {
  args: {
    ...wideImageArgs,
    markers: [
      {
        id: 'nearby-first',
        x: 260,
        y: 150,
        label: 'First nearby point',
        content: marker('A'),
      },
      {
        id: 'nearby-second',
        x: 292,
        y: 150,
        label: 'Second nearby point',
        content: marker('B'),
      },
    ],
  },
  render: (args) =>
    frame({
      width: 680,
      props: args,
      testId: 'interactive-map-dense-markers',
    }),
};

export const Static: Story = {
  args: { ...wideImageArgs, interactive: false, selectedIds: ['east'] },
  render: (args) =>
    frame({ width: 680, props: args, testId: 'interactive-map-static' }),
};

export const GesturesWhenZoomed: Story = {
  args: { ...wideImageArgs, gestures: 'zoomed' },
  render: (args) =>
    frame({
      width: 680,
      props: args,
      testId: 'interactive-map-gestures-zoomed',
    }),
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
        id: 'center',
        x: 120,
        y: 300,
        label: 'Center point',
        content: marker('A'),
      },
    ],
    unavailableMessage,
  },
  render: (args) =>
    frame({ width: 240, props: args, testId: 'interactive-map-tall-image' }),
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
      { id: 'center', x: 6, y: 6, label: 'Center point', content: marker('A') },
    ],
    unavailableMessage,
  },
  render: (args) =>
    frame({ width: 320, props: args, testId: 'interactive-map-tiny-image' }),
};

export const DetailsAtCenter: Story = {
  args: {
    ...wideImageArgs,
    markers: [
      {
        id: 'center',
        x: 300,
        y: 150,
        label: 'Center point',
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
  render: (args) =>
    frame({
      width: 680,
      props: args,
      testId: 'interactive-map-details-center',
    }),
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
  render: (args) =>
    frame({
      width: 680,
      props: args,
      testId: 'interactive-map-details-near-edge',
    }),
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
  render: (args) =>
    frame({ width: 680, props: args, testId: 'interactive-map-unavailable' }),
};

export const SavedAndRestoredView: Story = {
  args: wideImageArgs,
  render: () => <SavedRestoredViewStory />,
};
