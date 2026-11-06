import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { Footer } from '@/components/Footer';
import type {
  FooterGroup,
  FooterLinkRenderer,
  FooterLinkRenderProps,
  FooterProps,
} from '@/components/Footer';

const groups = [
  {
    id: 'explore',
    title: 'Explore',
    links: [
      { id: 'collections', label: 'Collections', href: '/collections' },
      { id: 'maps', label: 'Maps', href: '/maps' },
      { id: 'guides', label: 'Guides', href: '/guides' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    links: [
      {
        id: 'documentation',
        label: 'Documentation',
        href: '/documentation',
      },
      { id: 'contact', label: 'Contact', href: '/contact' },
    ],
  },
] satisfies readonly FooterGroup[];

const longGroups = [
  {
    id: 'research-collections',
    title: 'Research collections and archival material',
    links: [
      {
        id: 'regional-field-notes',
        label: 'Regional field notes and seasonal observations',
        href: '/collections/field-notes',
      },
      {
        id: 'historical-cartography',
        label: 'Historical cartography and geographic reference sheets',
        href: '/collections/cartography',
      },
    ],
  },
  {
    id: 'institutional-resources',
    title: 'Institutional resources and reference services',
    links: [
      {
        id: 'researcher-documentation',
        label: 'Researcher documentation and citation guidance',
        href: '/documentation',
      },
      {
        id: 'archival-access',
        label: 'Archival access requests and reproduction policies',
        href: '/documentation/access',
      },
    ],
  },
] satisfies readonly FooterGroup[];

const legal = (
  <p>
    Reference Atlas is a fictional demonstration. Read the{' '}
    <a href="https://example.com/guidelines">editorial guidelines</a> and the{' '}
    <a href="https://example.com/privacy">privacy notice</a>.
  </p>
);

function brand(href = '/') {
  return <a href={href}>Reference Atlas</a>;
}

function renderFooter(props: FooterProps) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="dark"
      forceColorScheme="dark"
    >
      <Footer {...props} />
    </MantineProvider>,
  );
}

beforeEach(async () => {
  document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
  await page.viewport(1366, 768);
});

afterEach(async () => {
  document.documentElement.removeAttribute('data-mantine-color-scheme');
  document.documentElement.style.fontSize = '';
  await commands.emulateMedia({ forcedColors: 'none' });
});

describe('Footer', () => {
  it('renders the landmark, host content and ordered groups', async () => {
    await renderFooter({
      brand: brand(),
      description: 'A neutral reference surface.',
      groups,
      legal,
    });

    await expect.element(page.getByRole('contentinfo')).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Reference Atlas' }))
      .toHaveAttribute('href', '/');
    await expect
      .element(page.getByText('A neutral reference surface.'))
      .toBeVisible();
    await expect
      .element(page.getByRole('navigation', { name: 'Footer navigation' }))
      .toBeVisible();

    expect(
      page
        .getByRole('heading', { level: 2 })
        .elements()
        .map((heading) => heading.textContent),
    ).toEqual(['Explore', 'Resources']);

    const navigation = page
      .getByRole('navigation', { name: 'Footer navigation' })
      .element();
    const heading = navigation.querySelector('h2');
    const list = navigation.querySelector('ul');
    expect(heading?.id).toBeTruthy();
    expect(list?.getAttribute('aria-labelledby')).toBe(heading?.id);

    expect(
      page
        .getByRole('navigation', { name: 'Footer navigation' })
        .getByRole('link')
        .elements()
        .map((link) => link.textContent),
    ).toEqual(['Collections', 'Maps', 'Guides', 'Documentation', 'Contact']);
    await expect
      .element(page.getByRole('link', { name: 'Maps' }))
      .toHaveAttribute('href', '/maps');

    await expect
      .element(page.getByRole('link', { name: 'privacy notice' }))
      .toHaveAttribute('href', 'https://example.com/privacy');
    await expect
      .element(page.getByRole('link', { name: 'editorial guidelines' }))
      .toBeVisible();
  });

  it('adds no new-tab or link-rel behaviour of its own', async () => {
    await renderFooter({ brand: brand(), groups, legal });

    for (const link of page.getByRole('link').elements()) {
      expect(link.getAttribute('target')).toBeNull();
      expect(link.getAttribute('rel')).toBeNull();
    }
  });

  it('preserves a host-chosen new-window policy on legal links', async () => {
    await renderFooter({
      legal: (
        <p>
          <a
            href="https://example.com/archive"
            target="_blank"
            rel="noopener noreferrer"
          >
            Public archive
          </a>
        </p>
      ),
    });

    const link = page.getByRole('link', { name: 'Public archive' });
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('omits empty groups, navigation and optional regions', async () => {
    const { container } = await renderFooter({
      brand: brand(),
      groups: [{ id: 'empty', title: 'Empty group', links: [] }],
    });

    expect(container.querySelectorAll('footer')).toHaveLength(1);
    expect(container.querySelectorAll('nav')).toHaveLength(0);
    expect(container.querySelectorAll('h2')).toHaveLength(0);
    expect(container.textContent).not.toContain('Empty group');
    expect(container.querySelectorAll('a')).toHaveLength(1);
  });

  it('renders nothing when every region is absent', async () => {
    const { container } = await renderFooter({});

    expect(container.querySelectorAll('footer')).toHaveLength(0);
  });

  it('renders without a brand block when branding is omitted', async () => {
    const { container } = await renderFooter({
      groups,
      legal: <p>Reference Atlas is fictional.</p>,
    });

    expect(container.querySelector('footer')).not.toBeNull();
    expect(container.querySelector('a[href="/"]')).toBeNull();
    expect(container.querySelectorAll('nav')).toHaveLength(1);
    expect(container.textContent).toContain('Reference Atlas is fictional.');
  });

  it('uses a host-selected group heading level', async () => {
    await renderFooter({ groups, headingLevel: 3 });

    expect(
      page
        .getByRole('heading', { level: 3 })
        .elements()
        .map((heading) => heading.textContent),
    ).toEqual(['Explore', 'Resources']);
    expect(page.getByRole('heading', { level: 2 }).elements()).toHaveLength(0);
  });

  it('provides a router-aware link adapter without changing presentation', async () => {
    const calls: {
      readonly linkId: string;
      readonly props: FooterLinkRenderProps;
    }[] = [];
    const renderLink: FooterLinkRenderer = (link, props) => {
      calls.push({ linkId: link.id, props });
      return (
        <a
          href={props.href}
          className={props.className}
          data-router-link="true"
          onClick={(event) => event.preventDefault()}
        >
          {props.children}
        </a>
      );
    };

    await renderFooter({ groups, renderLink });

    expect(calls).toHaveLength(5);
    expect(calls[0]).toMatchObject({
      linkId: 'collections',
      props: {
        href: '/collections',
        children: 'Collections',
      },
    });
    expect(calls[0]?.props.className).toBeTruthy();

    const collections = page.getByRole('link', { name: 'Collections' });
    await expect.element(collections).toHaveAttribute('href', '/collections');
    await expect
      .element(collections)
      .toHaveAttribute('data-router-link', 'true');
    await expect
      .element(collections)
      .toHaveAttribute('class', calls[0]?.props.className ?? '');
  });

  it('follows the host document order with the keyboard', async () => {
    await renderFooter({
      brand: brand(),
      groups,
      legal: (
        <p>
          Read the <a href="/privacy">Privacy notice</a>.
        </p>
      ),
    });

    const order = [
      'Reference Atlas',
      'Collections',
      'Maps',
      'Guides',
      'Documentation',
      'Contact',
      'Privacy notice',
    ];

    for (const name of order) {
      await userEvent.tab();
      await expect.element(page.getByRole('link', { name })).toHaveFocus();
    }

    const focused = document.activeElement;
    expect(
      focused instanceof HTMLElement
        ? getComputedStyle(focused).outlineStyle
        : null,
    ).toBe('solid');
  });

  it('keeps long content and enlarged text inside the viewport', async () => {
    await page.viewport(320, 640);
    await renderFooter({
      brand: brand(),
      description:
        'A neutral reference surface for extended field notes, regional collections, historical maps and archival research materials.',
      groups: longGroups,
      legal: (
        <p>
          Reference Atlas is a fictional demonstration of the shared Footer
          component. Names, collections and destinations are illustrative.
        </p>
      ),
    });

    const footer = page.getByRole('contentinfo').element();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    expect(footer.scrollWidth).toBeLessThanOrEqual(footer.clientWidth);

    document.documentElement.style.fontSize = '32px';

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    expect(footer.scrollWidth).toBeLessThanOrEqual(footer.clientWidth);
    await expect
      .element(
        page.getByRole('link', {
          name: 'Historical cartography and geographic reference sheets',
        }),
      )
      .toBeVisible();
  });

  it('keeps keyboard focus perceptible in forced-colors mode', async () => {
    await commands.emulateMedia({ forcedColors: 'active' });
    await renderFooter({ brand: brand(), groups });

    await userEvent.tab();
    await userEvent.tab();
    await expect
      .element(page.getByRole('link', { name: 'Collections' }))
      .toHaveFocus();

    const focused = document.activeElement;
    expect(focused).toBeInstanceOf(HTMLElement);
    const style = getComputedStyle(focused as HTMLElement);
    expect(style.outlineStyle).not.toBe('none');
    expect(style.outlineWidth).not.toBe('0px');
  });
});
