import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DrillDownNav } from '../DrillDownNav';
import { resolveDrillDownPath } from '../resolvePath';
import type {
  DrillDownLinkRenderer,
  DrillDownLinkRenderProps,
  DrillDownNode,
} from '../types';

interface TestMeta {
  readonly route: string;
}

const demoTree: DrillDownNode<TestMeta> = {
  id: 'all',
  label: 'All Items',
  href: '/items',
  icon: <span data-testid="icon-all">icon-all</span>,
  count: 100,
  meta: { route: 'all' },
  children: [
    {
      id: 'use',
      label: 'Use',
      href: '/items/use',
      icon: <span data-testid="icon-use">icon-use</span>,
      count: 40,
      meta: { route: 'use' },
      children: [
        {
          id: 'use/upgrade-scrolls',
          label: 'Upgrade Scrolls',
          href: '/items/use/upgrade-scrolls',
          count: 15,
          meta: { route: 'scrolls' },
        },
        {
          id: 'use/recovery',
          label: 'Recovery',
          href: '/items/use/recovery',
          count: 25,
          meta: { route: 'recovery' },
        },
        {
          id: 'use/empty',
          label: 'Empty Category',
          href: '/items/use/empty',
          count: 0,
          meta: { route: 'empty' },
        },
      ],
    },
    {
      id: 'etc',
      label: 'ETC',
      href: '/items/etc',
      count: 30,
      meta: { route: 'etc' },
      children: [
        {
          id: 'etc/quest-items',
          label: 'Quest Items',
          href: '/items/etc/quest-items',
          count: 10,
          meta: { route: 'quest' },
        },
      ],
    },
    {
      id: 'setup',
      label: 'Set-up',
      href: '/items/setup',
      count: 20,
      meta: { route: 'setup' },
    },
    {
      id: 'cash',
      label: 'Cash/Pet',
      href: '/items/cash',
      count: 10,
      meta: { route: 'cash' },
    },
  ],
};

describe('resolveDrillDownPath', () => {
  it('resolves root as current when currentId is root id', () => {
    const result = resolveDrillDownPath(demoTree, 'all');
    expect(result.ancestors).toEqual([]);
    expect(result.current.id).toBe('all');
    expect(result.children.map((c) => c.id)).toEqual([
      'use',
      'etc',
      'setup',
      'cash',
    ]);
  });

  it('resolves middle node as current with root ancestor and direct children', () => {
    const result = resolveDrillDownPath(demoTree, 'use');
    expect(result.ancestors.map((a) => a.id)).toEqual(['all']);
    expect(result.current.id).toBe('use');
    expect(result.children.map((c) => c.id)).toEqual([
      'use/upgrade-scrolls',
      'use/recovery',
      'use/empty',
    ]);
  });

  it('resolves leaf node as current with full ancestor chain and no children', () => {
    const result = resolveDrillDownPath(demoTree, 'use/recovery');
    expect(result.ancestors.map((a) => a.id)).toEqual(['all', 'use']);
    expect(result.current.id).toBe('use/recovery');
    expect(result.children).toEqual([]);
  });

  it('treats root as current when currentId is unknown', () => {
    const result = resolveDrillDownPath(demoTree, 'unknown-id');
    expect(result.ancestors).toEqual([]);
    expect(result.current.id).toBe('all');
    expect(result.children.map((c) => c.id)).toEqual([
      'use',
      'etc',
      'setup',
      'cash',
    ]);
  });
});

describe('DrillDownNav component', () => {
  it('renders Shape 1 (Current = root): All Items* and direct children without back rows', () => {
    render(
      <DrillDownNav root={demoTree} currentId="all" label="Item categories" />,
    );

    const nav = screen.getByRole('navigation', { name: 'Item categories' });
    expect(nav).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringContaining('All Items'),
      expect.stringContaining('Use'),
      expect.stringContaining('ETC'),
      expect.stringContaining('Set-up'),
      expect.stringContaining('Cash/Pet'),
    ]);

    // Back rows are not rendered
    expect(screen.queryByText(/←/)).not.toBeInTheDocument();

    // Exactly one link has aria-current="page"
    const currentLinks = links.filter(
      (link) => link.getAttribute('aria-current') === 'page',
    );
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAttribute('href', '/items');
    expect(currentLinks[0]?.textContent).toContain('All Items');
  });

  it('renders Shape 2 (Current = Use): ← All Items, Use*, and Use children without siblings', () => {
    render(
      <DrillDownNav root={demoTree} currentId="use" label="Item categories" />,
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringContaining('← All Items'),
      expect.stringContaining('Use'),
      expect.stringContaining('Upgrade Scrolls'),
      expect.stringContaining('Recovery'),
      expect.stringContaining('Empty Category'),
    ]);

    // Sibling scopes (ETC, Set-up, Cash/Pet) must NOT be rendered
    expect(screen.queryByText('ETC')).not.toBeInTheDocument();
    expect(screen.queryByText('Set-up')).not.toBeInTheDocument();
    expect(screen.queryByText('Cash/Pet')).not.toBeInTheDocument();

    // Exactly one link has aria-current="page"
    const currentLinks = links.filter(
      (link) => link.getAttribute('aria-current') === 'page',
    );
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAttribute('href', '/items/use');
    expect(currentLinks[0]?.textContent).toContain('Use');
  });

  it('renders Shape 3 (Current = Recovery): ← All Items, ← Use, and Recovery* without siblings or children', () => {
    render(
      <DrillDownNav
        root={demoTree}
        currentId="use/recovery"
        label="Item categories"
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringContaining('← All Items'),
      expect.stringContaining('← Use'),
      expect.stringContaining('Recovery'),
    ]);

    // Sibling children (Upgrade Scrolls, Empty Category) must NOT be rendered
    expect(screen.queryByText('Upgrade Scrolls')).not.toBeInTheDocument();
    expect(screen.queryByText('Empty Category')).not.toBeInTheDocument();

    // Exactly one link has aria-current="page"
    const currentLinks = links.filter(
      (link) => link.getAttribute('aria-current') === 'page',
    );
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAttribute('href', '/items/use/recovery');
  });

  it('back rows link to ancestors and show arrow + label only without icon or count', () => {
    render(
      <DrillDownNav root={demoTree} currentId="use" label="Item categories" />,
    );

    const backLink = screen.getByRole('link', { name: /←\s*All Items/ });
    expect(backLink).toHaveAttribute('href', '/items');
    // Ancestor row must NOT render the icon or count defined on root
    expect(backLink.querySelector('[data-testid="icon-all"]')).toBeNull();
    expect(backLink.textContent).not.toContain('100');
    expect(backLink.textContent).toMatch(/←\s*All Items$/);
  });

  it('renders zero counts dimmed while keeping the row an interactive link', () => {
    render(
      <DrillDownNav root={demoTree} currentId="use" label="Item categories" />,
    );

    const emptyLink = screen.getByRole('link', { name: /Empty Category/ });
    expect(emptyLink).toHaveAttribute('href', '/items/use/empty');
    expect(emptyLink.textContent).toContain('0');

    const zeroCountElement = emptyLink.querySelector('[class*="countDimmed"]');
    expect(zeroCountElement).not.toBeNull();
    expect(zeroCountElement?.textContent).toBe('0');
  });

  it('treats unknown currentId as root', () => {
    render(
      <DrillDownNav
        root={demoTree}
        currentId="non-existent"
        label="Item categories"
      />,
    );

    const currentLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('aria-current') === 'page');
    expect(currentLink).toHaveAttribute('href', '/items');
    expect(currentLink?.textContent).toContain('All Items');
  });

  it('passes node with meta and built props to renderLink', () => {
    const renderLink: DrillDownLinkRenderer<TestMeta> = vi.fn(
      (node: DrillDownNode<TestMeta>, props: DrillDownLinkRenderProps) => (
        <a
          data-testid={`custom-${node.id}`}
          data-route={node.meta?.route}
          href={props.href}
          className={props.className}
          aria-current={props['aria-current']}
          onClick={props.onClick}
        >
          {props.children}
        </a>
      ),
    );

    render(
      <DrillDownNav
        root={demoTree}
        currentId="use"
        label="Item categories"
        renderLink={renderLink}
      />,
    );

    expect(renderLink).toHaveBeenCalled();
    const useLink = screen.getByTestId('custom-use');
    expect(useLink).toHaveAttribute('data-route', 'use');
    expect(useLink).toHaveAttribute('aria-current', 'page');
    expect(useLink).toHaveAttribute('href', '/items/use');
  });

  it('fires onNavigate when any row link is clicked', () => {
    const onNavigate = vi.fn();
    render(
      <DrillDownNav
        root={demoTree}
        currentId="use"
        label="Item categories"
        onNavigate={onNavigate}
      />,
    );

    const backLink = screen.getByRole('link', { name: /←\s*All Items/ });
    fireEvent.click(backLink);
    expect(onNavigate).toHaveBeenCalledTimes(1);

    const currentLink = screen.getByRole('link', {
      name: (name) => name.includes('Use') && !name.includes('←'),
    });
    fireEvent.click(currentLink);
    expect(onNavigate).toHaveBeenCalledTimes(2);

    const childLink = screen.getByRole('link', { name: /Recovery/ });
    fireEvent.click(childLink);
    expect(onNavigate).toHaveBeenCalledTimes(3);
  });
});
