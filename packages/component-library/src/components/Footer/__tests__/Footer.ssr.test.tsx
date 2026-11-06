import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Footer } from '@/components/Footer';
import type { FooterGroup } from '@/components/Footer';

const groups = [
  {
    id: 'explore',
    title: 'Explore',
    links: [
      { id: 'collections', label: 'Collections', href: '/collections' },
      { id: 'maps', label: 'Maps', href: '/maps' },
    ],
  },
] satisfies readonly FooterGroup[];

function renderFooter(node: ReactNode) {
  return renderToString(
    <MantineProvider theme={theme} forceColorScheme="dark">
      {node}
    </MantineProvider>,
  );
}

describe('Footer server rendering', () => {
  it('renders meaningful landmarks, links and host legal content', () => {
    const html = renderFooter(
      <Footer
        brand={<a href="/">Reference Atlas</a>}
        description="A neutral reference surface."
        groups={groups}
        legal={
          <p>
            Read the <a href="/privacy">Privacy notice</a>.
          </p>
        }
      />,
    );

    expect(html).toContain('<footer');
    expect(html).toContain('href="/collections"');
    expect(html).toContain('href="/maps"');
    expect(html).toContain('aria-label="Footer navigation"');
    expect(html).toContain('>Explore</h2>');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('A neutral reference surface.');

    const labelledBy = /aria-labelledby="([^"]+)"/u.exec(html)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);

    expect(html).not.toContain('target=');
    expect(html).not.toContain('rel=');
  });

  it('omits regions and landmarks that the host did not supply', () => {
    const minimal = renderFooter(<Footer brand={<a href="/">Atlas</a>} />);
    expect(minimal).toContain('<footer');
    expect(minimal).not.toContain('<nav');
    expect(minimal).not.toContain('<h2');
    expect(minimal).not.toContain('<ul');

    const emptyGroups = renderFooter(
      <Footer
        groups={[{ id: 'empty', title: 'Empty', links: [] }]}
        legal={<p>Legal text</p>}
      />,
    );
    expect(emptyGroups).not.toContain('<nav');
    expect(emptyGroups).not.toContain('Empty');
  });

  it('renders nothing when every optional region is absent', () => {
    expect(renderToString(<Footer />)).toBe('');
  });

  it('renders host-selected heading levels and router-aware links', () => {
    const html = renderFooter(
      <Footer
        groups={groups}
        headingLevel={3}
        renderLink={(link, props) => (
          <a
            href={props.href}
            className={props.className}
            data-link-id={link.id}
            data-router="true"
          >
            {props.children}
          </a>
        )}
      />,
    );

    expect(html).toContain('>Explore</h3>');
    expect(html).not.toContain('<h2');
    expect(html).toContain('data-router="true"');
    expect(html).toContain('href="/collections"');
  });
});
