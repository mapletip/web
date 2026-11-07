import type { Meta, StoryObj } from '@storybook/react-vite';

import { DrillDownNav } from '../DrillDownNav';
import type { DrillDownNode } from '../types';

const demoTree: DrillDownNode = {
  id: 'all',
  label: 'All Items',
  href: '#all',
  count: 2450,
  children: [
    {
      id: 'use',
      label: 'Use',
      href: '#use',
      count: 620,
      children: [
        {
          id: 'use/upgrade-scrolls',
          label: 'Upgrade Scrolls',
          href: '#use/upgrade-scrolls',
          count: 142,
        },
        {
          id: 'use/recovery',
          label: 'Recovery',
          href: '#use/recovery',
          count: 85,
        },
        {
          id: 'use/throwing-stars',
          label: 'Throwing Stars',
          href: '#use/throwing-stars',
          count: 28,
        },
        {
          id: 'use/potions',
          label: 'Potions',
          href: '#use/potions',
          count: 110,
        },
        {
          id: 'use/empty',
          label: 'Empty Category',
          href: '#use/empty',
          count: 0,
        },
      ],
    },
    {
      id: 'etc',
      label: 'ETC',
      href: '#etc',
      count: 980,
      children: [
        {
          id: 'etc/quest-items',
          label: 'Quest Items',
          href: '#etc/quest-items',
          count: 320,
        },
        {
          id: 'etc/ores',
          label: 'Ores',
          href: '#etc/ores',
          count: 45,
        },
      ],
    },
    {
      id: 'setup',
      label: 'Set-up',
      href: '#setup',
      count: 450,
      children: [
        {
          id: 'setup/chairs',
          label: 'Chairs',
          href: '#setup/chairs',
          count: 210,
        },
      ],
    },
    {
      id: 'cash',
      label: 'Cash/Pet',
      href: '#cash',
      count: 400,
    },
  ],
};

const meta: Meta<typeof DrillDownNav> = {
  title: 'Components/DrillDownNav',
  component: DrillDownNav,
  argTypes: {
    currentId: {
      control: 'select',
      options: [
        'all',
        'use',
        'use/upgrade-scrolls',
        'use/recovery',
        'use/empty',
        'etc',
        'etc/quest-items',
        'setup',
        'setup/chairs',
        'cash',
      ],
      description: 'The active node ID in the navigation tree',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DrillDownNav>;

export const Root: Story = {
  args: {
    root: demoTree,
    currentId: 'all',
    label: 'Item categories',
  },
};

export const Intermediate: Story = {
  args: {
    root: demoTree,
    currentId: 'use',
    label: 'Item categories',
  },
};

export const Leaf: Story = {
  args: {
    root: demoTree,
    currentId: 'use/recovery',
    label: 'Item categories',
  },
};
