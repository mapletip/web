import {
  DeviceMobile,
  House,
  Plant,
  Storefront,
  TShirt,
} from '@phosphor-icons/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { DrillDownNav } from '../DrillDownNav';
import type { DrillDownNode } from '../types';

const catalogTree: DrillDownNode = {
  id: 'all',
  label: 'All Products',
  href: '#all',
  count: 1450,
  icon: <Storefront size={20} aria-hidden="true" />,
  children: [
    {
      id: 'clothing',
      label: 'Clothing',
      href: '#clothing',
      count: 320,
      icon: <TShirt size={20} aria-hidden="true" />,
      children: [
        { id: 'clothing/shirts', label: 'Shirts', href: '#shirts', count: 150 },
        {
          id: 'clothing/jackets',
          label: 'Jackets',
          href: '#jackets',
          count: 90,
        },
      ],
    },
    {
      id: 'electronics',
      label: 'Electronics',
      href: '#electronics',
      count: 680,
      icon: <DeviceMobile size={20} aria-hidden="true" />,
      children: [
        {
          id: 'electronics/laptops',
          label: 'Laptops',
          href: '#laptops',
          count: 240,
        },
        {
          id: 'electronics/phones',
          label: 'Phones',
          href: '#phones',
          count: 440,
        },
        {
          id: 'electronics/clearance',
          label: 'Clearance',
          href: '#clearance',
          count: 0,
        },
      ],
    },
    {
      id: 'home',
      label: 'Home',
      href: '#home',
      count: 450,
      icon: <House size={20} aria-hidden="true" />,
      children: [
        { id: 'home/kitchen', label: 'Kitchen', href: '#kitchen', count: 260 },
      ],
    },
    {
      id: 'garden',
      label: 'Garden',
      href: '#garden',
      icon: <Plant size={20} aria-hidden="true" />,
      children: [
        { id: 'garden/plants', label: 'Plants', href: '#plants', count: 65 },
        { id: 'garden/tools', label: 'Tools', href: '#tools' },
      ],
    },
  ],
};

function getAriaCurrent(
  canvasElement: HTMLElement,
): NodeListOf<HTMLAnchorElement> {
  return canvasElement.querySelectorAll<HTMLAnchorElement>(
    'a[aria-current="page"]',
  );
}

const meta: Meta<typeof DrillDownNav> = {
  title: 'Components/DrillDownNav',
  component: DrillDownNav,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 260,
          maxWidth: '100%',
          alignSelf: 'flex-start',
          marginRight: 'auto',
        }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    currentId: { control: 'text' },
    hideEmpty: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof DrillDownNav>;

export const RootCurrent: Story = {
  name: 'Root current',
  args: { root: catalogTree, currentId: 'all', label: 'Store catalog' },
  play: async ({ canvasElement }) => {
    const current = getAriaCurrent(canvasElement);
    await expect(current).toHaveLength(1);
    await expect(current[0]).toHaveTextContent('All Products');
  },
};

export const MidLevelCurrent: Story = {
  name: 'Mid-level current',
  args: { root: catalogTree, currentId: 'electronics', label: 'Store catalog' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const current = getAriaCurrent(canvasElement);
    await expect(current).toHaveLength(1);
    await expect(current[0]).toHaveTextContent('Electronics');

    const backLink = canvas.getByRole('link', { name: 'All Products' });
    await expect(backLink.querySelector('svg')).toBeInTheDocument();

    const clearance = canvas.getByRole('link', { name: /Clearance/ });
    await expect(clearance).toBeInTheDocument();
    await expect(clearance).toHaveAttribute('href', '#clearance');
    await expect(clearance).toHaveTextContent('0');
    await expect(
      clearance.querySelector('[class*="countDimmed"]'),
    ).toBeInTheDocument();
  },
};

export const LeafCurrent: Story = {
  name: 'Leaf current (back rows show icons)',
  args: {
    root: catalogTree,
    currentId: 'electronics/laptops',
    label: 'Store catalog',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const current = getAriaCurrent(canvasElement);
    await expect(current).toHaveLength(1);
    await expect(current[0]).toHaveTextContent('Laptops');

    await expect(
      canvas.getByRole('link', { name: 'All Products' }).querySelector('svg'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: 'Electronics' }).querySelector('svg'),
    ).toBeInTheDocument();
  },
};

export const EmptyChildrenHidden: Story = {
  name: 'Empty children hidden',
  args: {
    root: catalogTree,
    currentId: 'electronics',
    label: 'Store catalog',
    hideEmpty: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('Clearance')).not.toBeInTheDocument();
    await expect(canvas.getByText('Laptops')).toBeInTheDocument();
    await expect(canvas.getByText('Phones')).toBeInTheDocument();
    await expect(getAriaCurrent(canvasElement)).toHaveLength(1);
  },
};

export const EmptyCurrentNodeStaysVisible: Story = {
  name: 'Hide empty: current node stays visible',
  args: {
    root: catalogTree,
    currentId: 'electronics/clearance',
    label: 'Store catalog',
    hideEmpty: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const clearance = canvas.getByRole('link', { name: /Clearance/ });
    await expect(clearance).toHaveAttribute('aria-current', 'page');
    await expect(clearance).toHaveTextContent('0');

    await expect(
      canvas.getByRole('link', { name: 'All Products' }).querySelector('svg'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: 'Electronics' }).querySelector('svg'),
    ).toBeInTheDocument();
    await expect(getAriaCurrent(canvasElement)).toHaveLength(1);
  },
};

export const CustomRenderLink: Story = {
  name: 'Custom renderLink',
  args: {
    root: catalogTree,
    currentId: 'clothing',
    label: 'Store catalog',
    renderLink: (node, props) => (
      <a
        href={props.href}
        className={props.className}
        aria-current={props['aria-current']}
        onClick={props.onClick}
        data-custom={node.id}
      >
        {props.children}
      </a>
    ),
  },
  play: async ({ canvasElement }) => {
    const custom = canvasElement.querySelector('a[data-custom="clothing"]');
    await expect(custom).toBeInTheDocument();
    await expect(custom).toHaveAttribute('aria-current', 'page');
    await expect(getAriaCurrent(canvasElement)).toHaveLength(1);
  },
};
