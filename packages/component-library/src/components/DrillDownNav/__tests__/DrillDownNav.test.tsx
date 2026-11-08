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

const catalogTree: DrillDownNode<TestMeta> = {
  id: 'all',
  label: 'All Products',
  href: '/products',
  icon: <span data-testid="icon-all">icon-all</span>,
  count: 100,
  meta: { route: 'all' },
  children: [
    {
      id: 'clothing',
      label: 'Clothing',
      href: '/products/clothing',
      icon: <span data-testid="icon-clothing">icon-clothing</span>,
      count: 40,
      meta: { route: 'clothing' },
      children: [
        {
          id: 'clothing/shirts',
          label: 'Shirts',
          href: '/products/clothing/shirts',
          count: 15,
          meta: { route: 'shirts' },
        },
        {
          id: 'clothing/pants',
          label: 'Pants',
          href: '/products/clothing/pants',
          count: 25,
          meta: { route: 'pants' },
        },
        {
          id: 'clothing/empty',
          label: 'Empty Category',
          href: '/products/clothing/empty',
          count: 0,
          meta: { route: 'empty' },
        },
      ],
    },
    {
      id: 'electronics',
      label: 'Electronics',
      href: '/products/electronics',
      count: 30,
      meta: { route: 'electronics' },
      children: [
        {
          id: 'electronics/audio',
          label: 'Audio',
          href: '/products/electronics/audio',
          count: 10,
          meta: { route: 'audio' },
        },
      ],
    },
    {
      id: 'home',
      label: 'Home',
      href: '/products/home',
      count: 20,
      meta: { route: 'home' },
    },
    {
      id: 'garden',
      label: 'Garden',
      href: '/products/garden',
      count: 10,
      meta: { route: 'garden' },
    },
  ],
};

describe('resolveDrillDownPath', () => {
  it('resolves root as current when currentId is root id', () => {
    const result = resolveDrillDownPath(catalogTree, 'all');
    expect(result.ancestors).toEqual([]);
    expect(result.current.id).toBe('all');
    expect(result.children.map((c) => c.id)).toEqual([
      'clothing',
      'electronics',
      'home',
      'garden',
    ]);
  });

  it('resolves middle node as current with root ancestor and direct children', () => {
    const result = resolveDrillDownPath(catalogTree, 'clothing');
    expect(result.ancestors.map((a) => a.id)).toEqual(['all']);
    expect(result.current.id).toBe('clothing');
    expect(result.children.map((c) => c.id)).toEqual([
      'clothing/shirts',
      'clothing/pants',
      'clothing/empty',
    ]);
  });

  it('resolves leaf node as current with full ancestor chain and no children', () => {
    const result = resolveDrillDownPath(catalogTree, 'clothing/pants');
    expect(result.ancestors.map((a) => a.id)).toEqual(['all', 'clothing']);
    expect(result.current.id).toBe('clothing/pants');
    expect(result.children).toEqual([]);
  });

  it('treats root as current when currentId is unknown', () => {
    const result = resolveDrillDownPath(catalogTree, 'unknown-id');
    expect(result.ancestors).toEqual([]);
    expect(result.current.id).toBe('all');
    expect(result.children.map((c) => c.id)).toEqual([
      'clothing',
      'electronics',
      'home',
      'garden',
    ]);
  });

  it('omits child rows with count === 0 when hideEmpty is true', () => {
    const result = resolveDrillDownPath(catalogTree, 'clothing', {
      hideEmpty: true,
    });
    expect(result.children.map((c) => c.id)).toEqual([
      'clothing/shirts',
      'clothing/pants',
    ]);
  });

  it('keeps child rows with count === 0 when hideEmpty is false', () => {
    const result = resolveDrillDownPath(catalogTree, 'clothing', {
      hideEmpty: false,
    });
    expect(result.children.map((c) => c.id)).toEqual([
      'clothing/shirts',
      'clothing/pants',
      'clothing/empty',
    ]);
  });

  it('never omits the current node or ancestors even when current count === 0 and hideEmpty is true', () => {
    const result = resolveDrillDownPath(catalogTree, 'clothing/empty', {
      hideEmpty: true,
    });
    expect(result.ancestors.map((a) => a.id)).toEqual(['all', 'clothing']);
    expect(result.current.id).toBe('clothing/empty');
    expect(result.current.count).toBe(0);
    expect(result.children).toEqual([]);
  });

  it('never omits child nodes with undefined count when hideEmpty is true', () => {
    const treeWithUncounted: DrillDownNode = {
      id: 'root',
      label: 'Root',
      href: '/root',
      children: [
        { id: 'zero', label: 'Zero', href: '/zero', count: 0 },
        { id: 'positive', label: 'Positive', href: '/positive', count: 5 },
        { id: 'uncounted', label: 'Uncounted', href: '/uncounted' },
      ],
    };
    const result = resolveDrillDownPath(treeWithUncounted, 'root', {
      hideEmpty: true,
    });
    expect(result.children.map((c) => c.id)).toEqual(['positive', 'uncounted']);
  });
});

describe('DrillDownNav component', () => {
  it('renders Shape 1 (Current = root): All Products* and direct children without back rows', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="all"
        label="Product categories"
      />,
    );

    const nav = screen.getByRole('navigation', { name: 'Product categories' });
    expect(nav).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringContaining('All Products'),
      expect.stringContaining('Clothing'),
      expect.stringContaining('Electronics'),
      expect.stringContaining('Home'),
      expect.stringContaining('Garden'),
    ]);

    // Back rows are not rendered
    expect(screen.queryByText(/←/)).not.toBeInTheDocument();

    // Exactly one link has aria-current="page"
    const currentLinks = links.filter(
      (link) => link.getAttribute('aria-current') === 'page',
    );
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAttribute('href', '/products');
    expect(currentLinks[0]?.textContent).toContain('All Products');
  });

  it('renders Shape 2 (Current = Clothing): ← All Products, Clothing*, and Clothing children without siblings', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="clothing"
        label="Product categories"
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringMatching(/←.*All Products/),
      expect.stringContaining('Clothing'),
      expect.stringContaining('Shirts'),
      expect.stringContaining('Pants'),
      expect.stringContaining('Empty Category'),
    ]);

    // Sibling scopes (Electronics, Home, Garden) must NOT be rendered
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Garden')).not.toBeInTheDocument();

    // Exactly one link has aria-current="page"
    const currentLinks = links.filter(
      (link) => link.getAttribute('aria-current') === 'page',
    );
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAttribute('href', '/products/clothing');
    expect(currentLinks[0]?.textContent).toContain('Clothing');
  });

  it('renders Shape 3 (Current = Pants): ← All Products, ← Clothing, and Pants* without siblings or children', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="clothing/pants"
        label="Product categories"
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringMatching(/←.*All Products/),
      expect.stringMatching(/←.*Clothing/),
      expect.stringContaining('Pants'),
    ]);

    // Sibling children (Shirts, Empty Category) must NOT be rendered
    expect(screen.queryByText('Shirts')).not.toBeInTheDocument();
    expect(screen.queryByText('Empty Category')).not.toBeInTheDocument();

    // Exactly one link has aria-current="page"
    const currentLinks = links.filter(
      (link) => link.getAttribute('aria-current') === 'page',
    );
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAttribute('href', '/products/clothing/pants');
  });

  it('ancestor with icon renders the icon and no count', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="clothing"
        label="Product categories"
      />,
    );

    // Arrow is aria-hidden so the back link's accessible name is exactly the label
    const backLink = screen.getByRole('link', { name: 'All Products' });
    expect(backLink).toHaveAttribute('href', '/products');
    const arrow = backLink.querySelector('[class*="backArrow"]');
    expect(arrow).toHaveAttribute('aria-hidden', 'true');
    expect(arrow?.textContent).toBe('←');
    expect(screen.queryByRole('link', { name: /←/ })).not.toBeInTheDocument();

    // Ancestor row renders the icon defined on root and reuses icon wrapper
    const icon = backLink.querySelector('[data-testid="icon-all"]');
    expect(icon).toBeInTheDocument();
    const iconWrapper = backLink.querySelector('[class*="icon"]');
    expect(iconWrapper).toBeInTheDocument();
    expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');

    // Ancestor row must NOT render count
    expect(backLink.textContent).not.toContain('100');
    expect(backLink.querySelector('[class*="count"]')).toBeNull();
    expect(backLink.querySelector('[class*="countDimmed"]')).toBeNull();
  });

  it('ancestor without icon reserves icon slot when sibling ancestor has an icon', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="electronics/audio"
        label="Product categories"
      />,
    );

    const backLink = screen.getByRole('link', { name: 'Electronics' });
    expect(backLink).toHaveAttribute('href', '/products/electronics');
    const arrow = backLink.querySelector('[class*="backArrow"]');
    expect(arrow).toHaveAttribute('aria-hidden', 'true');
    expect(arrow?.textContent).toBe('←');

    // Node without icon does NOT render an icon, but reserves the icon slot because 'all' has an icon
    expect(backLink.querySelector('[data-testid="icon-all"]')).toBeNull();
    const iconSlot = backLink.querySelector('[class*="iconSlot"]');
    expect(iconSlot).toBeInTheDocument();
    expect(iconSlot).toHaveAttribute('aria-hidden', 'true');

    // Node does NOT render count
    expect(backLink.textContent).not.toContain('30');
    expect(backLink.querySelector('[class*="count"]')).toBeNull();
    expect(backLink.querySelector('[class*="countDimmed"]')).toBeNull();

    // Rendered text is exactly arrow + label
    expect(backLink.textContent).toMatch(/←\s*Electronics$/);
  });

  it('ancestors in a list where no back row has an icon remain unchanged (no icon or slot)', () => {
    const treeWithoutAncestorIcons: DrillDownNode = {
      id: 'root',
      label: 'Root Category',
      href: '/root',
      children: [
        {
          id: 'sub',
          label: 'Sub Category',
          href: '/root/sub',
          children: [
            {
              id: 'leaf',
              label: 'Leaf Category',
              href: '/root/sub/leaf',
            },
          ],
        },
      ],
    };

    render(
      <DrillDownNav
        root={treeWithoutAncestorIcons}
        currentId="leaf"
        label="Product categories"
      />,
    );

    const rootBackLink = screen.getByRole('link', { name: 'Root Category' });
    const subBackLink = screen.getByRole('link', { name: 'Sub Category' });

    expect(rootBackLink.querySelector('[class*="icon"]')).toBeNull();
    expect(rootBackLink.querySelector('[class*="iconSlot"]')).toBeNull();
    expect(subBackLink.querySelector('[class*="icon"]')).toBeNull();
    expect(subBackLink.querySelector('[class*="iconSlot"]')).toBeNull();
  });

  it('reserves icon slot on child rows without icon when sibling child has an icon', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="all"
        label="Product categories"
      />,
    );

    // Clothing has an icon
    const clothingLink = screen.getByRole('link', { name: /Clothing/ });
    expect(
      clothingLink.querySelector('[data-testid="icon-clothing"]'),
    ).toBeInTheDocument();

    // Electronics, Home, Garden have no icon, but reserve icon slot
    for (const name of ['Electronics', 'Home', 'Garden']) {
      const link = screen.getByRole('link', { name: new RegExp(name) });
      expect(link.querySelector('svg')).toBeNull();
      const slot = link.querySelector('[class*="iconSlot"]');
      expect(slot).toBeInTheDocument();
      expect(slot).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('does not reserve icon slots on child rows when no child in the list has an icon', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="clothing"
        label="Product categories"
      />,
    );

    // None of clothing's children (shirts, pants, empty) have an icon
    for (const name of ['Shirts', 'Pants', 'Empty Category']) {
      const link = screen.getByRole('link', { name: new RegExp(name) });
      expect(link.querySelector('[class*="icon"]')).toBeNull();
      expect(link.querySelector('[class*="iconSlot"]')).toBeNull();
    }
  });

  it('accessible name stays exactly the label for ancestor rows with and without icons', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="electronics/audio"
        label="Product categories"
      />,
    );

    expect(
      screen.getByRole('link', { name: 'All Products' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Electronics' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /←/ })).not.toBeInTheDocument();
  });

  it('renders zero counts dimmed while keeping the row an interactive link', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="clothing"
        label="Product categories"
      />,
    );

    const emptyLink = screen.getByRole('link', { name: /Empty Category/ });
    expect(emptyLink).toHaveAttribute('href', '/products/clothing/empty');
    expect(emptyLink.textContent).toContain('0');

    const zeroCountElement = emptyLink.querySelector('[class*="countDimmed"]');
    expect(zeroCountElement).not.toBeNull();
    expect(zeroCountElement?.textContent).toBe('0');
  });

  it('hides child rows whose count === 0 when hideEmpty is true', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="clothing"
        label="Product categories"
        hideEmpty
      />,
    );

    expect(screen.queryByText('Empty Category')).not.toBeInTheDocument();
    expect(screen.getByText('Shirts')).toBeInTheDocument();
    expect(screen.getByText('Pants')).toBeInTheDocument();
  });

  it('shows child rows whose count === 0 (dimmed) when hideEmpty is false or omitted', () => {
    const { rerender } = render(
      <DrillDownNav
        root={catalogTree}
        currentId="clothing"
        label="Product categories"
      />,
    );
    expect(screen.getByText('Empty Category')).toBeInTheDocument();

    rerender(
      <DrillDownNav
        root={catalogTree}
        currentId="clothing"
        label="Product categories"
        hideEmpty={false}
      />,
    );
    expect(screen.getByText('Empty Category')).toBeInTheDocument();
  });

  it('still renders current zero node as current with ancestors when hideEmpty is true', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="clothing/empty"
        label="Product categories"
        hideEmpty
      />,
    );

    const currentLink = screen.getByRole('link', {
      name: /Empty Category/,
    });
    expect(currentLink).toHaveAttribute('aria-current', 'page');
    expect(currentLink.textContent).toContain('0');

    expect(
      screen.getByRole('link', { name: 'All Products' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clothing' })).toBeInTheDocument();
  });

  it('never hides child rows with undefined count when hideEmpty is true', () => {
    const treeWithUncounted: DrillDownNode = {
      id: 'root',
      label: 'Root',
      href: '/root',
      children: [
        { id: 'zero', label: 'Zero Child', href: '/zero', count: 0 },
        { id: 'uncounted', label: 'Uncounted Child', href: '/uncounted' },
      ],
    };

    render(
      <DrillDownNav
        root={treeWithUncounted}
        currentId="root"
        label="Test categories"
        hideEmpty
      />,
    );

    expect(screen.queryByText('Zero Child')).not.toBeInTheDocument();
    expect(screen.getByText('Uncounted Child')).toBeInTheDocument();
  });

  it('treats unknown currentId as root', () => {
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="non-existent"
        label="Product categories"
      />,
    );

    const currentLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('aria-current') === 'page');
    expect(currentLink).toHaveAttribute('href', '/products');
    expect(currentLink?.textContent).toContain('All Products');
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
        root={catalogTree}
        currentId="clothing"
        label="Product categories"
        renderLink={renderLink}
      />,
    );

    expect(renderLink).toHaveBeenCalled();
    const clothingLink = screen.getByTestId('custom-clothing');
    expect(clothingLink).toHaveAttribute('data-route', 'clothing');
    expect(clothingLink).toHaveAttribute('aria-current', 'page');
    expect(clothingLink).toHaveAttribute('href', '/products/clothing');
  });

  it('fires onNavigate when any row link is clicked', () => {
    const onNavigate = vi.fn();
    render(
      <DrillDownNav
        root={catalogTree}
        currentId="clothing"
        label="Product categories"
        onNavigate={onNavigate}
      />,
    );

    const backLink = screen.getByRole('link', { name: 'All Products' });
    fireEvent.click(backLink);
    expect(onNavigate).toHaveBeenCalledTimes(1);

    const currentLink = screen.getByRole('link', {
      name: (name) => name.includes('Clothing'),
    });
    fireEvent.click(currentLink);
    expect(onNavigate).toHaveBeenCalledTimes(2);

    const childLink = screen.getByRole('link', { name: /Pants/ });
    fireEvent.click(childLink);
    expect(onNavigate).toHaveBeenCalledTimes(3);
  });

  describe('select mode (onSelect provided)', () => {
    it('renders rows as buttons (type="button") instead of links', () => {
      const onSelect = vi.fn();
      render(
        <DrillDownNav
          root={catalogTree}
          currentId="clothing"
          label="Product categories"
          onSelect={onSelect}
        />,
      );

      expect(screen.queryAllByRole('link')).toHaveLength(0);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      for (const btn of buttons) {
        expect(btn).toHaveAttribute('type', 'button');
      }
    });

    it('sets aria-current="true" on the highlighted row, not "page"', () => {
      const onSelect = vi.fn();
      render(
        <DrillDownNav
          root={catalogTree}
          currentId="clothing"
          label="Product categories"
          onSelect={onSelect}
        />,
      );

      const buttons = screen.getAllByRole('button');
      const currentButtons = buttons.filter(
        (btn) => btn.getAttribute('aria-current') === 'true',
      );
      expect(currentButtons).toHaveLength(1);
      expect(currentButtons[0]?.textContent).toContain('Clothing');

      // None have aria-current="page"
      expect(
        buttons.filter((btn) => btn.getAttribute('aria-current') === 'page'),
      ).toHaveLength(0);
    });

    it('does not use renderLink when onSelect is provided', () => {
      const onSelect = vi.fn();
      const renderLink = vi.fn();
      render(
        <DrillDownNav
          root={catalogTree}
          currentId="clothing"
          label="Product categories"
          renderLink={renderLink}
          onSelect={onSelect}
        />,
      );

      expect(renderLink).not.toHaveBeenCalled();
      expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    it('passes isLeaf: false when selecting a node with visible children', () => {
      const onSelect = vi.fn();
      render(
        <DrillDownNav
          root={catalogTree}
          currentId="all"
          label="Product categories"
          onSelect={onSelect}
        />,
      );

      // Clothing has children (shirts, pants, empty)
      const clothingBtn = screen.getByRole('button', { name: /Clothing/ });
      fireEvent.click(clothingBtn);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'clothing' }),
        { isLeaf: false },
      );
    });

    it('passes isLeaf: true when selecting a leaf node with no children', () => {
      const onSelect = vi.fn();
      render(
        <DrillDownNav
          root={catalogTree}
          currentId="clothing"
          label="Product categories"
          onSelect={onSelect}
        />,
      );

      // Shirts has no children
      const shirtsBtn = screen.getByRole('button', { name: /Shirts/ });
      fireEvent.click(shirtsBtn);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'clothing/shirts' }),
        { isLeaf: true },
      );
    });

    it('passes isLeaf: false for ancestor back row', () => {
      const onSelect = vi.fn();
      render(
        <DrillDownNav
          root={catalogTree}
          currentId="clothing"
          label="Product categories"
          onSelect={onSelect}
        />,
      );

      // Back row to All Products (which has children clothing, electronics, etc.)
      const backBtn = screen.getByRole('button', { name: 'All Products' });
      fireEvent.click(backBtn);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'all' }),
        { isLeaf: false },
      );
    });

    it('evaluates isLeaf under the active hideEmpty setting', () => {
      const treeWithZeroChild: DrillDownNode = {
        id: 'root',
        label: 'Root',
        href: '/root',
        children: [
          {
            id: 'parent-of-empty',
            label: 'Parent Of Empty',
            href: '/parent',
            children: [
              { id: 'zero-child', label: 'Zero', href: '/zero', count: 0 },
            ],
          },
        ],
      };

      // With hideEmpty=true, parent-of-empty has 0 visible children -> isLeaf: true
      const onSelectWithHideEmpty = vi.fn();
      const { rerender } = render(
        <DrillDownNav
          root={treeWithZeroChild}
          currentId="root"
          label="Categories"
          hideEmpty
          onSelect={onSelectWithHideEmpty}
        />,
      );

      const parentBtn = screen.getByRole('button', { name: /Parent Of Empty/ });
      fireEvent.click(parentBtn);
      expect(onSelectWithHideEmpty).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'parent-of-empty' }),
        { isLeaf: true },
      );

      // With hideEmpty=false, parent-of-empty has 1 child -> isLeaf: false
      const onSelectWithoutHideEmpty = vi.fn();
      rerender(
        <DrillDownNav
          root={treeWithZeroChild}
          currentId="root"
          label="Categories"
          hideEmpty={false}
          onSelect={onSelectWithoutHideEmpty}
        />,
      );

      const parentBtn2 = screen.getByRole('button', {
        name: /Parent Of Empty/,
      });
      fireEvent.click(parentBtn2);
      expect(onSelectWithoutHideEmpty).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'parent-of-empty' }),
        { isLeaf: false },
      );
    });
  });
});
