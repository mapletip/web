import { Box } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { RecordSections } from '@/components/RecordSections';
import type { RecordSection } from '@/components/RecordSections';

const threeSections: readonly RecordSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    count: 3,
    content: <p>Synthetic overview content for a generic record.</p>,
  },
  {
    id: 'details',
    title: 'Details',
    count: 8,
    content: <p>Additional synthetic details appear in this section.</p>,
  },
  {
    id: 'related-records',
    title: 'Related records',
    count: 2,
    content: <p>Two related synthetic records are listed here.</p>,
  },
];

const fourSections: readonly RecordSection[] = [
  ...threeSections,
  {
    id: 'notes',
    title: 'Additional notes',
    count: 1,
    content: <p>A final synthetic note completes the example.</p>,
  },
];

function Stage({
  children,
  narrow = false,
}: {
  readonly children: ReactNode;
  readonly narrow?: boolean;
}) {
  return (
    <Box
      bg="var(--mapletip-color-canvas)"
      w={narrow ? '100%' : 960}
      maw="100%"
      p="md"
    >
      {children}
    </Box>
  );
}

const meta = {
  title: 'Components/RecordSections',
  parameters: { layout: 'centered' },
} satisfies Meta<typeof RecordSections>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeSections: Story = {
  render: () => (
    <Stage>
      <div data-testid="record-sections-three">
        <RecordSections sections={threeSections} />
      </div>
    </Stage>
  ),
};

export const FourSectionsOnPhone: Story = {
  render: () => (
    <Stage narrow>
      <div data-testid="record-sections-phone">
        <RecordSections sections={fourSections} />
      </div>
    </Stage>
  ),
};

export const UnknownCount: Story = {
  render: () => (
    <Stage>
      <div data-testid="record-sections-unknown">
        <RecordSections
          sections={[
            {
              id: 'overview',
              title: 'Overview',
              count: 'unknown',
              content: <p>The host has not resolved this synthetic count.</p>,
            },
            threeSections[1]!,
            threeSections[2]!,
          ]}
        />
      </div>
    </Stage>
  ),
};

export const OmittedSection: Story = {
  render: () => (
    <Stage>
      <div data-testid="record-sections-omitted">
        <RecordSections sections={[threeSections[0]!, threeSections[2]!]} />
      </div>
    </Stage>
  ),
};
