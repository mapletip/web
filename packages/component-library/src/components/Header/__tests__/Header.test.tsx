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
    await expect
      .element(dialog.getByRole('link', { name: 'Maps' }))
      .toBeVisible();
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
});
