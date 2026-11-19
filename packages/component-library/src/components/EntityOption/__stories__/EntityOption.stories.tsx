import { Stack } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

import { EntityOption } from '@/components/EntityOption';

function SyntheticIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <circle cx="9" cy="9" r="7" fill="currentColor" />
      <path
        d="M6 9h6M9 6v6"
        stroke="var(--mantine-color-body)"
        strokeWidth="2"
      />
    </svg>
  );
}

const meta = {
  title: 'Components/EntityOption',
  parameters: { layout: 'centered' },
} satisfies Meta<typeof EntityOption>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <Stack data-testid="entity-option-story" gap="md" w={360}>
      <EntityOption label="Label only" />
      <EntityOption icon={<SyntheticIcon />} label="Icon and label" />
      <EntityOption
        icon={<SyntheticIcon />}
        label="Icon, label, and description"
        description="Monster"
      />
    </Stack>
  ),
};
