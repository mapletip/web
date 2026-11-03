import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Header } from '@/components/Header';

const navigation = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/overview',
    active: true,
    current: true,
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
      },
    ],
  },
] as const;

describe('Header server rendering', () => {
  it('renders the landmark, host links and current state without a DOM', () => {
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <Header
          brand={<a href="/">Reference Atlas</a>}
          navigation={navigation}
          utility={<button type="button">Account</button>}
        />
      </MantineProvider>,
    );

    expect(html).toContain('<header');
    expect(html).toContain('aria-label="Primary navigation"');
    expect(html).toContain('href="/overview"');
    expect(html).toContain('Collections');
    expect(html).toContain('data-active="true"');
    expect(html).toContain('aria-current="page"');
    expect(html.match(/aria-current="page"/gu)).toHaveLength(1);
    expect(html).toContain('Account');
  });

  it('does not render an empty navigation landmark or mobile menu', () => {
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <Header brand={<a href="/">Reference Atlas</a>} />
      </MantineProvider>,
    );

    expect(html).not.toContain('<nav');
    expect(html).not.toContain('Open navigation');
    expect(html).not.toContain('role="dialog"');
  });
});
