import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { Header } from '@/components/Header';
import type {
  HeaderLink,
  HeaderLinkRenderer,
  HeaderLinkRenderProps,
  HeaderProps,
} from '@/components/Header';

const defaultNavigation = [
  { id: 'overview', label: 'Overview', href: '/overview' },
  { id: 'field-guide', label: 'Field guide', href: '/field-guide' },
  {
    id: 'collections',
    label: 'Collections',
    children: [
      { id: 'maps', label: 'Maps', href: '/collections/maps' },
      { id: 'specimens', label: 'Specimens', href: '/collections/specimens' },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    children: [
      { id: 'glossary', label: 'Glossary', href: '/reference/glossary' },
      { id: 'indices', label: 'Indices', href: '/reference/indices' },
    ],
  },
  { id: 'journal', label: 'Journal', href: '/journal' },
] satisfies readonly HeaderLink[];

const longNavigation = [
  {
    id: 'regional-field-guide',
    label: 'Regional field guide and seasonal observations',
    href: '/regional-field-guide',
  },
  {
    id: 'collections',
    label: 'Collections and long-term archive',
    children: [
      {
        id: 'maps',
        label: 'Maps and geographic reference material',
        href: '/collections/maps',
      },
    ],
  },
] satisfies readonly HeaderLink[];

const detailedNavigation = [
  { id: 'overview', label: 'Overview', href: '/overview' },
  {
    id: 'collections',
    label: 'Collections',
    description: 'Browse reference collections',
    children: [
      {
        id: 'maps',
        label: 'Maps',
        description: 'Geographic overview',
        icon: <svg aria-hidden="true" />,
        href: '/collections/maps',
      },
      {
        id: 'specimens',
        label: 'Specimens',
        description: 'Catalogued observations',
        href: '/collections/specimens',
      },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    description: 'Browse reference material',
    children: [
      {
        id: 'glossary',
        label: 'Glossary',
        description: 'Terms and definitions',
        icon: <svg aria-hidden="true" />,
        href: '/reference/glossary',
      },
    ],
  },
] satisfies readonly HeaderLink[];

const partialNavigation = [
  {
    id: 'collections',
    label: 'Collections',
    children: [
      { id: 'all', label: 'All collections', href: '/collections' },
      {
        id: 'field-guides',
        label: 'Field guides',
        description: 'Regional volumes',
        href: '/collections/field-guides',
      },
      {
        id: 'maps',
        label: 'Maps',
        icon: <svg aria-hidden="true" />,
        href: '/collections/maps',
      },
    ],
  },
] satisfies readonly HeaderLink[];

const decorativeIconNavigation = [
  {
    id: 'collections',
    label: 'Collections',
    description: 'Browse reference collections',
    children: [
      {
        id: 'field-guides',
        label: 'Field guides',
        description: 'Regional volumes',
        icon: (
          <img
            src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
            alt=""
            width={22}
            height={22}
          />
        ),
        href: '/collections/field-guides',
      },
    ],
  },
] satisfies readonly HeaderLink[];

const currentGroupNavigation = [
  { id: 'overview', label: 'Overview', href: '/overview' },
  {
    id: 'collections',
    label: 'Collections',
    current: true,
    children: [{ id: 'maps', label: 'Maps', href: '/collections/maps' }],
  },
] satisfies readonly HeaderLink[];

function renderHeader(props: HeaderProps) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="dark"
      forceColorScheme="dark"
    >
      <Header {...props} />
    </MantineProvider>,
  );
}

function brand() {
  return <a href="/">Reference Atlas</a>;
}

const UTILITY_ID = 'header-utility-control';

function StatefulUtility() {
  const [count, setCount] = useState(0);

  return (
    <button
      id={UTILITY_ID}
      type="button"
      onClick={() => setCount((value) => value + 1)}
    >
      Account {count}
    </button>
  );
}

beforeEach(async () => {
  document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
  await page.viewport(1366, 768);
});

afterEach(() => {
  document.documentElement.removeAttribute('data-mantine-color-scheme');
});

describe('Header', () => {
  it('renders host branding, destinations and utility as the real controls', async () => {
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
      utility: <button type="button">Account</button>,
    });

    await expect.element(page.getByRole('banner')).toBeInTheDocument();
    await expect
      .element(page.getByRole('link', { name: 'Reference Atlas' }))
      .toHaveAttribute('href', '/');
    await expect
      .element(page.getByRole('link', { name: 'Overview' }))
      .toHaveAttribute('href', '/overview');
    expect(
      page.getByRole('link', { name: 'Collections' }).elements(),
    ).toHaveLength(0);
    await expect
      .element(page.getByRole('button', { name: 'Collections' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Account' }))
      .toBeVisible();
  });

  it('marks only the current destination with aria-current', async () => {
    await renderHeader({
      brand: brand(),
      navigation: [
        {
          id: 'overview',
          label: 'Overview',
          href: '/overview',
          active: true,
        },
        {
          id: 'collections',
          label: 'Collections',
          active: true,
          children: [
            {
              id: 'maps',
              label: 'Maps',
              href: '/collections/maps',
              active: true,
              current: true,
            },
          ],
        },
      ],
    });

    const overview = page.getByRole('link', { name: 'Overview' });
    const collections = page.getByRole('button', { name: 'Collections' });
    await expect.element(overview).not.toHaveAttribute('aria-current');
    await expect.element(overview).toHaveAttribute('data-active', 'true');
    await expect.element(collections).not.toHaveAttribute('aria-current');
    await expect.element(collections).toHaveAttribute('data-active', 'true');

    await userEvent.click(collections);
    const maps = page.getByRole('link', { name: 'Maps' });
    await expect.element(maps).toHaveAttribute('aria-current', 'page');
    await expect.element(maps).toHaveAttribute('data-active', 'true');
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it('omits empty navigation, placeholder controls and the mobile drawer', async () => {
    await renderHeader({ brand: brand() });

    await expect
      .element(page.getByRole('link', { name: 'Reference Atlas' }))
      .toBeVisible();
    expect(document.querySelectorAll('nav')).toHaveLength(0);
    expect(
      page
        .getByRole('button', { name: /navigation/iu, includeHidden: true })
        .elements(),
    ).toHaveLength(0);
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
  });

  it('keeps an optional navigable group parent separate from its disclosure button', async () => {
    await renderHeader({
      brand: brand(),
      navigation: [
        {
          id: 'collections',
          label: 'Collections',
          href: '/collections',
          children: [{ id: 'maps', label: 'Maps', href: '/collections/maps' }],
        },
      ],
    });

    const parent = page.getByRole('link', { name: 'Collections' });
    const disclosure = page.getByRole('button', {
      name: 'Show Collections links',
    });
    await expect.element(parent).toHaveAttribute('href', '/collections');
    await expect.element(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(parent.element()).not.toBe(disclosure.element());

    await userEvent.click(disclosure);
    await expect.element(disclosure).toHaveAttribute('aria-expanded', 'true');
    await expect
      .element(page.getByRole('link', { name: 'Maps' }))
      .toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect.element(disclosure).toHaveAttribute('aria-expanded', 'false');
    await expect.element(disclosure).toHaveFocus();
  });

  it('renders a detailed group with heading, subtitle, close control and rich rows', async () => {
    await renderHeader({
      brand: brand(),
      navigation: detailedNavigation,
    });

    await userEvent.click(page.getByRole('button', { name: 'Collections' }));

    await expect
      .element(page.getByRole('heading', { name: 'Collections' }))
      .toBeVisible();
    await expect
      .element(page.getByText('Browse reference collections'))
      .toBeVisible();
    await expect
      .element(
        page.getByRole('button', { name: 'Close Collections navigation' }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: /Maps/ }))
      .toHaveAttribute('href', '/collections/maps');
    await expect
      .element(page.getByRole('link', { name: /Specimens/ }))
      .toHaveAttribute('href', '/collections/specimens');
    expect(document.querySelectorAll('a a')).toHaveLength(0);
  });

  it('keeps the focused control above an adjacent hovered group', async () => {
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
    });

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    const focusedLink = document.activeElement;
    expect(focusedLink?.textContent).toBe('Field guide');

    await userEvent.hover(page.getByRole('button', { name: 'Collections' }));
    expect(
      focusedLink instanceof HTMLElement
        ? getComputedStyle(focusedLink).zIndex
        : null,
    ).toBe('1');

    await userEvent.tab();
    const focusedGroup = document.activeElement;
    expect(focusedGroup?.textContent).toBe('Collections');
    await userEvent.hover(page.getByRole('link', { name: 'Journal' }));
    expect(
      focusedGroup instanceof HTMLElement
        ? getComputedStyle(focusedGroup).zIndex
        : null,
    ).toBe('1');
  });

  it('keeps compact groups exclusive when keyboard switching', async () => {
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
    });

    const collections = page.getByRole('button', { name: 'Collections' });
    const reference = page.getByRole('button', { name: 'Reference' });

    await userEvent.click(collections);
    await expect.element(collections).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Tab}');
    await expect.element(reference).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    await expect.element(collections).toHaveAttribute('aria-expanded', 'false');
    await expect.element(reference).toHaveAttribute('aria-expanded', 'true');
    await expect.element(reference).toHaveFocus();
    expect(
      document.querySelectorAll('button[aria-expanded="true"]'),
    ).toHaveLength(1);

    await userEvent.click(collections);
    await expect.element(collections).toHaveAttribute('aria-expanded', 'true');
    await expect.element(reference).toHaveAttribute('aria-expanded', 'false');
    await expect.element(collections).toHaveFocus();
  });

  it('keeps detailed panels exclusive and does not steal focus on switch', async () => {
    await renderHeader({
      brand: brand(),
      navigation: detailedNavigation,
    });

    const collections = page.getByRole('button', { name: 'Collections' });
    const reference = page.getByRole('button', { name: 'Reference' });

    await userEvent.click(collections);
    await expect
      .element(page.getByRole('heading', { name: 'Collections' }))
      .toBeVisible();

    await userEvent.click(reference);
    await expect.element(collections).toHaveAttribute('aria-expanded', 'false');
    await expect.element(reference).toHaveAttribute('aria-expanded', 'true');
    await expect
      .element(page.getByRole('heading', { name: 'Reference' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('heading', { name: 'Collections' }))
      .not.toBeInTheDocument();
    await expect.element(reference).toHaveFocus();
  });

  it('closes a detailed group from its CloseButton and returns focus', async () => {
    await renderHeader({
      brand: brand(),
      navigation: detailedNavigation,
    });

    const trigger = page.getByRole('button', { name: 'Collections' });
    await userEvent.click(trigger);
    await userEvent.click(
      page.getByRole('button', { name: 'Close Collections navigation' }),
    );

    await expect
      .element(page.getByRole('heading', { name: 'Collections' }))
      .not.toBeInTheDocument();
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect.element(trigger).toHaveFocus();
  });

  it('moves focus from the detailed trigger through close and link controls', async () => {
    await renderHeader({
      brand: brand(),
      navigation: detailedNavigation,
    });

    const trigger = page.getByRole('button', { name: 'Collections' });
    await userEvent.click(trigger);
    await userEvent.keyboard('{Tab}');
    await expect
      .element(
        page.getByRole('button', { name: 'Close Collections navigation' }),
      )
      .toHaveFocus();
    await userEvent.keyboard('{Tab}');
    await expect
      .element(page.getByRole('link', { name: /Maps/ }))
      .toHaveFocus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await expect
      .element(
        page.getByRole('button', { name: 'Close Collections navigation' }),
      )
      .toHaveFocus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await expect.element(trigger).toHaveFocus();
  });

  it('dismisses a detailed disclosure with Escape and returns focus', async () => {
    await renderHeader({
      brand: brand(),
      navigation: detailedNavigation,
    });

    const trigger = page.getByRole('button', { name: 'Collections' });
    await userEvent.click(trigger);
    await userEvent.keyboard('{Tab}');
    await expect
      .element(
        page.getByRole('button', { name: 'Close Collections navigation' }),
      )
      .toHaveFocus();
    await userEvent.keyboard('{Escape}');

    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect.element(trigger).toHaveFocus();
  });

  it('renders partial child metadata without empty subtitle or icon slots', async () => {
    await renderHeader({
      brand: brand(),
      navigation: partialNavigation,
    });

    await userEvent.click(page.getByRole('button', { name: 'Collections' }));

    await expect
      .element(page.getByRole('heading', { name: 'Collections' }))
      .toBeVisible();
    expect(
      page.getByText('Browse reference collections').elements(),
    ).toHaveLength(0);
    await expect
      .element(page.getByRole('link', { name: /All collections/ }))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: /Field guides/ }))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: /Maps/ }))
      .toBeVisible();
  });

  it('passes constructed rich content to a host renderLink adapter', async () => {
    const renderLink: HeaderLinkRenderer = (_link, props) => {
      const { href, children, onClick } = props;
      return (
        <a
          href={href}
          data-router-link="true"
          onClick={(event) => {
            event.preventDefault();
            onClick?.();
          }}
        >
          {children}
        </a>
      );
    };

    await renderHeader({
      brand: brand(),
      navigation: detailedNavigation,
      renderLink,
    });

    await userEvent.click(page.getByRole('button', { name: 'Collections' }));
    const maps = page.getByRole('link', { name: /Maps/ });
    await expect.element(maps).toHaveAttribute('data-router-link', 'true');
    await expect.element(maps).toHaveAttribute('href', '/collections/maps');
    await userEvent.click(maps);
    await expect.element(maps).not.toBeInTheDocument();
  });

  it('keeps detailed metadata coherent in the mobile drawer', async () => {
    await page.viewport(375, 812);
    await renderHeader({
      brand: brand(),
      navigation: detailedNavigation,
    });

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();
    expect(dialog.getByRole('link', { name: /Maps/ }).elements()).toHaveLength(
      0,
    );

    const collections = dialog.getByRole('button', { name: 'Collections' });
    await expect.element(collections).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(collections);
    await expect.element(collections).toHaveAttribute('aria-expanded', 'true');

    await expect
      .element(dialog.getByRole('link', { name: /Maps\s+Geographic overview/ }))
      .toBeVisible();
    await expect.element(dialog.getByText('Geographic overview')).toBeVisible();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(375);
  });

  it('dismisses a desktop disclosure on outside click', async () => {
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
    });

    await userEvent.click(page.getByRole('button', { name: 'Collections' }));
    const maps = page.getByRole('link', { name: 'Maps' });
    await expect.element(maps).toBeVisible();

    await userEvent.click(document.body);
    await expect.element(maps).not.toBeInTheDocument();
  });

  it('switches navigation presentations at the 992px boundary', async () => {
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
    });

    const desktopNavigation = document.querySelector<HTMLElement>(
      'header nav[aria-label="Primary navigation"]',
    );
    const burger = page.getByRole('button', {
      name: 'Open navigation',
      includeHidden: true,
    });
    expect(desktopNavigation).not.toBeNull();

    await page.viewport(991, 768);
    expect(getComputedStyle(desktopNavigation!).display).toBe('none');
    expect(getComputedStyle(burger.element()).display).not.toBe('none');

    await page.viewport(992, 768);
    expect(getComputedStyle(desktopNavigation!).display).toBe('flex');
    expect(getComputedStyle(burger.element()).display).toBe('none');
  });

  it('opens the mobile drawer, closes on Escape and returns focus', async () => {
    await page.viewport(375, 812);
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
      utility: <button type="button">Account</button>,
    });

    const burger = page.getByRole('button', { name: 'Open navigation' });
    await expect.element(burger).toBeVisible();
    await userEvent.click(burger);

    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();
    await expect
      .element(dialog.getByRole('link', { name: 'Field guide' }))
      .toBeVisible();
    const collections = dialog.getByRole('button', { name: 'Collections' });
    await expect.element(collections).toBeVisible();
    await expect.element(collections).toHaveAttribute('aria-expanded', 'false');
    expect(dialog.getByRole('link', { name: /Maps/ }).elements()).toHaveLength(
      0,
    );
    await expect.element(dialog.getByText('Collections')).toBeVisible();
    expect(
      dialog.getByRole('link', { name: 'Collections' }).elements(),
    ).toHaveLength(0);
    await expect
      .element(dialog.getByRole('button', { name: 'Account' }))
      .toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect.element(dialog).not.toBeInTheDocument();
    await expect.element(burger).toHaveFocus();
  });

  it('mounts the utility in exactly one location', async () => {
    await page.viewport(375, 812);
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
      utility: <StatefulUtility />,
    });

    expect(document.querySelectorAll(`#${UTILITY_ID}`)).toHaveLength(1);

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();
    const drawerControls = document.querySelectorAll<HTMLElement>(
      `#${UTILITY_ID}`,
    );
    expect(drawerControls).toHaveLength(1);
    expect(dialog.element().contains(drawerControls[0]!)).toBe(true);

    await userEvent.click(dialog.getByRole('button', { name: 'Account 0' }));
    await expect
      .element(dialog.getByRole('button', { name: 'Account 1' }))
      .toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect.element(dialog).not.toBeInTheDocument();
    expect(document.querySelectorAll(`#${UTILITY_ID}`)).toHaveLength(1);
  });

  it('names a utility-only drawer accurately', async () => {
    await page.viewport(375, 812);
    await renderHeader({
      brand: brand(),
      utility: <button type="button">Account</button>,
    });

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect.element(dialog).toBeVisible();
    await expect
      .element(dialog.getByRole('button', { name: 'Account' }))
      .toBeVisible();
    expect(document.querySelectorAll('nav')).toHaveLength(0);
  });

  it('closes the mobile drawer when a host-rendered link navigates', async () => {
    await page.viewport(375, 812);
    const renderLink: HeaderLinkRenderer = (link, props) => {
      const { href, ...linkProps } = props;
      return (
        <a
          {...linkProps}
          href={href}
          onClick={(event) => {
            event.preventDefault();
            props.onClick?.();
          }}
        >
          {link.label}
        </a>
      );
    };

    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
      renderLink,
    });

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();
    await userEvent.click(dialog.getByRole('link', { name: 'Field guide' }));
    await expect.element(dialog).not.toBeInTheDocument();
  });

  it('delegates link presentation to a host adapter without changing markup', async () => {
    const calls: HeaderLinkRenderProps[] = [];
    const renderLink: HeaderLinkRenderer = (link, props) => {
      calls.push(props);
      return (
        <a {...props} data-router-link="true">
          {link.label}
        </a>
      );
    };

    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
      renderLink,
    });

    const overview = page.getByRole('link', { name: 'Overview' });
    await expect.element(overview).toHaveAttribute('data-router-link', 'true');
    await expect.element(overview).toHaveAttribute('href', '/overview');
    expect(calls[0]).toMatchObject({
      href: '/overview',
      'aria-current': undefined,
      'data-active': undefined,
      onClick: undefined,
    });
  });

  it('keeps long content operable at 320px without horizontal page overflow', async () => {
    await page.viewport(320, 640);
    await renderHeader({
      brand: <a href="/">Reference Atlas for Regional Field Studies</a>,
      navigation: longNavigation,
      utility: <button type="button">Account</button>,
    });

    const header = page.getByRole('banner').element();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    expect(dialog.element().scrollWidth).toBeLessThanOrEqual(
      dialog.element().clientWidth,
    );

    const collections = dialog.getByRole('button', {
      name: 'Collections and long-term archive',
    });
    await userEvent.click(collections);
    await expect.element(collections).toHaveAttribute('aria-expanded', 'true');
    await expect
      .element(
        dialog.getByRole('link', {
          name: 'Maps and geographic reference material',
        }),
      )
      .toBeVisible();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    expect(dialog.element().scrollWidth).toBeLessThanOrEqual(
      dialog.element().clientWidth,
    );
  });

  it('keeps an open drawer dismissible when the viewport grows', async () => {
    await page.viewport(375, 812);
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
    });

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();

    await page.viewport(1366, 768);
    await expect.element(dialog).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Close navigation' }))
      .toBeVisible();
    const desktopNavigation = document.querySelector<HTMLElement>(
      'header nav[aria-label="Primary navigation"]',
    );
    expect(getComputedStyle(desktopNavigation!).display).toBe('none');

    await userEvent.click(
      dialog.getByRole('button', { name: 'Close navigation drawer' }),
    );
    await expect.element(dialog).not.toBeInTheDocument();
    expect(getComputedStyle(desktopNavigation!).display).toBe('flex');
  });

  it('discloses a mobile group with the keyboard and collapses it again', async () => {
    await page.viewport(375, 812);
    await renderHeader({
      brand: brand(),
      navigation: detailedNavigation,
    });

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();

    // Wait for the drawer's focus trap to place focus before tabbing from it.
    await expect
      .element(dialog.getByRole('button', { name: 'Close navigation drawer' }))
      .toHaveFocus();

    const collections = dialog.getByRole('button', { name: 'Collections' });
    const control = collections.element();
    for (
      let step = 0;
      step < 4 && document.activeElement !== control;
      step += 1
    ) {
      await userEvent.tab();
    }
    await expect.element(collections).toHaveFocus();
    await expect.element(collections).toHaveAttribute('aria-expanded', 'false');

    await userEvent.keyboard('{Enter}');
    await expect.element(collections).toHaveAttribute('aria-expanded', 'true');

    await userEvent.tab();
    await expect
      .element(dialog.getByRole('link', { name: /Maps\s+Geographic overview/ }))
      .toHaveFocus();

    control.focus();
    await userEvent.keyboard(' ');
    await expect.element(collections).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps one mobile group open at a time', async () => {
    await page.viewport(375, 812);
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
    });

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();

    await userEvent.click(dialog.getByRole('button', { name: 'Collections' }));
    await expect
      .element(dialog.getByRole('link', { name: 'Maps' }))
      .toBeVisible();

    await userEvent.click(dialog.getByRole('button', { name: 'Reference' }));
    await expect
      .element(dialog.getByRole('link', { name: 'Glossary' }))
      .toBeVisible();
    await expect
      .element(dialog.getByRole('link', { name: 'Maps' }))
      .not.toBeInTheDocument();
    await expect
      .element(dialog.getByRole('button', { name: 'Collections' }))
      .toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps collapsed mobile children out of the tab order', async () => {
    await page.viewport(375, 812);
    await renderHeader({
      brand: brand(),
      navigation: detailedNavigation,
    });

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();

    expect(dialog.getByRole('link', { name: /Maps/ }).elements()).toHaveLength(
      0,
    );

    // The drawer's focus trap settles asynchronously; wait for it before moving focus.
    await expect
      .element(dialog.getByRole('button', { name: 'Close navigation drawer' }))
      .toHaveFocus();

    const collections = dialog.getByRole('button', { name: 'Collections' });
    await expect.element(collections).toHaveAttribute('aria-expanded', 'false');
    collections.element().focus();
    expect(document.activeElement).toBe(collections.element());

    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe('Reference');
    // The collapsed group never contributes a focusable destination.
    expect(dialog.getByRole('link', { name: /Maps/ }).elements()).toHaveLength(
      0,
    );
  });

  it('renders the same rich child content on desktop and mobile', async () => {
    await renderHeader({
      brand: brand(),
      navigation: detailedNavigation,
    });

    const desktopTrigger = page.getByRole('button', { name: 'Collections' });
    await userEvent.click(desktopTrigger);
    const desktopLink = page.getByRole('link', {
      name: /Maps\s+Geographic overview/,
    });
    await expect.element(desktopLink).toBeVisible();
    const desktopText = desktopLink.element().textContent;
    const desktopHref = desktopLink.element().getAttribute('href');
    expect(desktopLink.element().querySelector('svg, img')).not.toBeNull();
    expect(
      document.querySelectorAll('a[href="/collections/maps"]'),
    ).toHaveLength(1);

    // Close the desktop panel so its rows are not counted alongside the drawer.
    await userEvent.click(desktopTrigger);
    await expect.element(desktopLink).not.toBeInTheDocument();

    await page.viewport(375, 812);
    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Collections' }));

    const mobileLink = dialog.getByRole('link', {
      name: /Maps\s+Geographic overview/,
    });
    await expect.element(mobileLink).toBeVisible();
    expect(mobileLink.element().textContent).toBe(desktopText);
    expect(mobileLink.element().getAttribute('href')).toBe(desktopHref);
    expect(mobileLink.element().querySelector('svg, img')).not.toBeNull();
    expect(
      document.querySelectorAll('a[href="/collections/maps"]'),
    ).toHaveLength(1);
  });

  it('does not announce a decorative child icon', async () => {
    await page.viewport(375, 812);
    await renderHeader({
      brand: brand(),
      navigation: decorativeIconNavigation,
    });

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Collections' }));

    const link = dialog.getByRole('link', {
      name: 'Field guides Regional volumes',
    });
    await expect.element(link).toBeVisible();
    const image = link.element().querySelector('img');
    expect(image).not.toBeNull();
    expect(image?.getAttribute('alt')).toBe('');
    expect(
      link.element().querySelector('[aria-hidden="true"] img'),
    ).not.toBeNull();
  });

  it('dismisses the mobile drawer from its backdrop', async () => {
    await page.viewport(375, 812);
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
    });

    const burger = page.getByRole('button', { name: 'Open navigation' });
    await userEvent.click(burger);
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();

    await expect
      .element(dialog.getByRole('button', { name: 'Close navigation drawer' }))
      .toHaveFocus();

    const overlay = document.querySelector<HTMLElement>(
      '.mantine-Drawer-overlay',
    );
    expect(overlay).not.toBeNull();
    overlay!.click();

    await expect.element(dialog).not.toBeInTheDocument();
    await expect.element(burger).toHaveFocus();
  });

  it('keeps the drawer narrower than a 320px viewport', async () => {
    await page.viewport(320, 640);
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
    });

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();

    const drawerWidth = dialog.element().getBoundingClientRect().width;
    expect(drawerWidth).toBeGreaterThan(0);
    expect(drawerWidth).toBeLessThan(window.innerWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
  });

  it('leaves the backdrop visible beside the drawer panel', async () => {
    await page.viewport(768, 1024);
    await renderHeader({
      brand: brand(),
      navigation: defaultNavigation,
    });

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();

    // Mantine passes Drawer.Content's `className` to its full-width inner
    // positioning wrapper too, which would paint the panel over the overlay.
    const inner = document.querySelector<HTMLElement>('.mantine-Drawer-inner');
    expect(inner).not.toBeNull();
    expect(getComputedStyle(inner!).backgroundColor).toBe('rgba(0, 0, 0, 0)');

    const panelWidth = dialog.element().getBoundingClientRect().width;
    expect(panelWidth).toBeLessThan(window.innerWidth);
    const besidePanel = document.elementFromPoint(
      Math.round(panelWidth + (window.innerWidth - panelWidth) / 2),
      Math.round(window.innerHeight / 2),
    );
    expect(besidePanel?.classList.contains('mantine-Drawer-overlay')).toBe(
      true,
    );
  });

  it('starts with the current group expanded', async () => {
    await page.viewport(375, 812);
    await renderHeader({
      brand: brand(),
      navigation: currentGroupNavigation,
    });

    await userEvent.click(
      page.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect.element(dialog).toBeVisible();

    await expect
      .element(dialog.getByRole('button', { name: 'Collections' }))
      .toHaveAttribute('aria-expanded', 'true');
    await expect
      .element(dialog.getByRole('link', { name: 'Maps' }))
      .toBeVisible();
  });
});
