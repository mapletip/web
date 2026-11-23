import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { StaticMap } from '@/components/StaticMap';

describe('StaticMap server rendering', () => {
  it('positions markers and connector lines in the server response', () => {
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <StaticMap
          image={{
            src: '/synthetic-image.svg',
            width: 400,
            height: 200,
            alt: 'Synthetic landscape',
          }}
          markers={[
            {
              id: 'quarter',
              x: 100,
              y: 50,
              label: 'Quarter point',
              content: <span>Quarter point</span>,
            },
            {
              id: 'edge',
              x: 400,
              y: 200,
              label: 'Edge point',
              content: <span>Edge point</span>,
            },
          ]}
          connectors={[{ id: 'quarter-edge', from: 'quarter', to: 'edge' }]}
          loading="lazy"
          unavailableMessage="Image unavailable."
        />
      </MantineProvider>,
    );
    const stage = html.match(/<div\b[^>]*role="group"[^>]*>/u)?.[0];
    const quarter = html.match(
      /<span\b[^>]*data-marker-position="quarter"[^>]*>/u,
    )?.[0];
    const edge = html.match(
      /<span\b[^>]*data-marker-position="edge"[^>]*>/u,
    )?.[0];

    expect(stage).toContain('--interactive-map-image-aspect-ratio:2');
    expect(quarter).toContain('left:25%');
    expect(quarter).toContain('top:25%');
    expect(edge).toContain('left:100%');
    expect(edge).toContain('top:100%');
    expect(html).toContain('<line');
    expect(html).toContain('x1="100"');
    expect(html).toContain('y1="50"');
    expect(html).toContain('x2="400"');
    expect(html).toContain('y2="200"');
  });
});
