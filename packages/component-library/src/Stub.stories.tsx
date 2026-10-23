import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Stub',
} satisfies Meta;

export default meta;

export const Blank: StoryObj = {
  render: () => <></>,
};
