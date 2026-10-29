import {
  Anchor,
  Button,
  Checkbox,
  MantineProvider,
  Pagination,
  Text,
  TextInput,
} from '@mantine/core';
import {
  cssVariablesResolver,
  parchmentScheme,
  theme,
  twilightScheme,
} from '@mapletip/theme';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { commands, page, server } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { ComparisonTable } from '@/components/Table/ComparisonTable';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

interface Rgb {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

function hexToRgb(hex: string): Rgb {
  return {
    red: Number.parseInt(hex.slice(1, 3), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    blue: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function parseRgb(value: string): Rgb {
  if (/^#[\da-f]{6}$/iu.test(value)) return hexToRgb(value);
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/u.exec(value);
  if (match === null) {
    throw new Error(`Expected an rgb colour, received "${value}"`);
  }
  return {
    red: Number(match[1]),
    green: Number(match[2]),
    blue: Number(match[3]),
  };
}

function toCssRgb(hex: string): string {
  const { red, green, blue } = hexToRgb(hex);
  return `rgb(${String(red)}, ${String(green)}, ${String(blue)})`;
}

function luminance({ red, green, blue }: Rgb): number {
  const channels = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const first = luminance(parseRgb(foreground));
  const second = luminance(parseRgb(background));
  const [lighter, darker] = first > second ? [first, second] : [second, first];
  return (lighter + 0.05) / (darker + 0.05);
}

function App({ scheme }: { readonly scheme: 'light' | 'dark' }) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme={scheme}
    >
      <main style={{ padding: 16 }}>
        <Text>Primary record text</Text>
        <Text c="dimmed">Secondary supporting text</Text>
        <Anchor href="#records">Record 001</Anchor>
        <p>
          Inline copy with a <a href="#plain">plain record link</a>.
        </p>
        <TextInput label="Search records" placeholder="Record name" />
        <Checkbox label="Include archived records" defaultChecked />
        <Button>Primary action</Button>
        <Pagination total={5} defaultValue={1} />
        <Pagination
          total={3}
          defaultValue={2}
          getItemProps={(pageNumber) => ({
            component: 'a',
            href: `#page-${String(pageNumber)}`,
          })}
        />
      </main>
    </MantineProvider>
  );
}

async function renderComparisonTable(
  scheme: 'light' | 'dark' = 'dark',
): Promise<void> {
  await page.viewport(1024, 768);
  await render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme={scheme}
    >
      <ComparisonTable
        ariaLabel="Accessible comparison"
        records={demoRecords.slice(0, 6)}
        columns={makeDemoColumns()}
        idAccessor="id"
        identityField="name"
        sortStatus={{ field: 'value1', direction: 'desc' }}
        onSortChange={() => undefined}
      />
    </MantineProvider>,
  );
}

beforeEach(() => {
  document.documentElement.removeAttribute('data-mantine-color-scheme');
  document.documentElement.removeAttribute('data-respect-reduced-motion');
  document.documentElement.style.fontSize = '';
  window.localStorage.clear();
});

afterEach(async () => {
  await commands.emulateMedia({
    forcedColors: 'none',
    reducedMotion: 'no-preference',
  });
});

const maplePalette = theme.colors?.['maple'];
if (maplePalette === undefined) throw new Error('Maple palette missing');

describe.each([
  {
    scheme: 'light' as const,
    roles: parchmentScheme,
    primaryFill: maplePalette[7],
  },
  {
    scheme: 'dark' as const,
    roles: twilightScheme,
    primaryFill: maplePalette[4],
  },
])('$scheme scheme rendered styles', ({ scheme, roles, primaryFill }) => {
  it('renders text, links, control borders and filled actions with the themed roles', async () => {
    await page.viewport(1024, 768);
    await render(<App scheme={scheme} />);

    const body = getComputedStyle(document.body);
    expect(body.backgroundColor).toBe(toCssRgb(roles.canvas));
    expect(body.color).toBe(toCssRgb(roles.textPrimary));

    const linkColor = getComputedStyle(
      document.querySelector('a[href="#records"]')!,
    ).color;
    expect(linkColor).toBe(toCssRgb(roles.link));
    expect(
      getComputedStyle(document.querySelector('a[href="#plain"]')!).color,
    ).toBe(toCssRgb(roles.link));

    const inputBorder = getComputedStyle(
      document.querySelector('input')!,
    ).borderTopColor;
    expect(inputBorder).toBe(toCssRgb(roles.borderControl));

    const button = document.querySelector('button')!;
    const buttonColors = getComputedStyle(button);
    expect(buttonColors.backgroundColor).toBe(toCssRgb(primaryFill));
    expect(buttonColors.color).toBe(toCssRgb(roles.filledActionText));

    expect(contrast(body.color, body.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(contrast(linkColor, body.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(
      contrast(buttonColors.color, buttonColors.backgroundColor),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrast(inputBorder, body.backgroundColor)).toBeGreaterThanOrEqual(
      3,
    );

    const checkbox = document.querySelector('.mantine-Checkbox-input')!;
    const checkboxIcon = document.querySelector('.mantine-Checkbox-icon');
    if (checkboxIcon === null) throw new Error('Checked icon did not render');
    const iconStyle = getComputedStyle(checkboxIcon);
    expect(
      contrast(iconStyle.color, getComputedStyle(checkbox).backgroundColor),
    ).toBeGreaterThanOrEqual(3);

    const activePage = document.querySelector(
      '.mantine-Pagination-control[data-active]',
    );
    if (activePage === null) throw new Error('Active page did not render');
    const activeStyle = getComputedStyle(activePage);
    expect(
      contrast(activeStyle.color, activeStyle.backgroundColor),
    ).toBeGreaterThanOrEqual(4.5);

    // Link-rendered pagination controls keep their control styling instead of
    // inheriting the underline used for plain record links.
    const paginationLink = document.querySelector(
      'a.mantine-Pagination-control[href]',
    );
    if (paginationLink === null) throw new Error('Link page did not render');
    expect(getComputedStyle(paginationLink).textDecorationLine).not.toBe(
      'underline',
    );
  });

  it('shows a separated, scheme-coloured focus ring on filled actions', async () => {
    await page.viewport(1024, 768);
    await render(<App scheme={scheme} />);

    const button = document.querySelector('button')!;
    button.focus();

    const focusStyle = getComputedStyle(button);
    expect(document.activeElement).toBe(button);
    expect(focusStyle.outlineStyle).toBe('solid');
    expect(focusStyle.outlineWidth).toBe('2px');
    expect(focusStyle.outlineOffset).toBe('2px');
    expect(focusStyle.outlineColor).toBe(toCssRgb(roles.focus));
    expect(contrast(roles.focus, roles.canvas)).toBeGreaterThanOrEqual(3);
  });
});

describe('theme accessibility behaviours', () => {
  it('respects reduced motion for DataTable transitions', async () => {
    await renderComparisonTable();
    await commands.emulateMedia({ reducedMotion: 'reduce' });

    expect(
      document.documentElement.getAttribute('data-respect-reduced-motion'),
    ).toBe('true');

    const sortableHeader = document.querySelector(
      '.mantine-datatable-header-cell-sortable',
    );
    if (sortableHeader === null) {
      throw new Error('Expected a sortable DataTable header');
    }

    const duration = getComputedStyle(sortableHeader).transitionDuration;
    expect(Number.parseFloat(duration)).toBeLessThan(0.001);
  });

  it.skipIf(server.browser !== 'chromium')(
    'keeps focus visible and does not opt out of forced colours',
    async () => {
      await render(<App scheme="dark" />);
      await commands.emulateMedia({ forcedColors: 'active' });

      const button = document.querySelector('button')!;
      button.focus();

      const style = getComputedStyle(button);
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineWidth).toBe('2px');
      expect(style.getPropertyValue('forced-color-adjust')).toBe('auto');
    },
  );

  it('reflows at 320 CSS px with 200% text size', async () => {
    await page.viewport(320, 640);
    document.documentElement.style.fontSize = '32px';
    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="light"
      >
        <ComparisonTable
          ariaLabel="Narrow comparison"
          records={demoRecords.slice(0, 6)}
          columns={makeDemoColumns()}
          idAccessor="id"
          identityField="name"
          maxHeight={480}
          onSortChange={() => undefined}
        />
      </MantineProvider>,
    );

    const cell = document.querySelector('tbody td');
    if (cell === null) throw new Error('Table cells did not render');
    expect(
      Number.parseFloat(getComputedStyle(cell).fontSize),
    ).toBeGreaterThanOrEqual(24);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
  });
});
