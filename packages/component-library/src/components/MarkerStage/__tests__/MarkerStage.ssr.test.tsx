import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MarkerStage } from '@/components/MarkerStage';
import type { MarkerStageProps } from '@/components/MarkerStage';

function renderStage(props: Partial<MarkerStageProps>): string {
  return renderToString(
    <MantineProvider theme={theme} forceColorScheme="dark">
      <MarkerStage
        image={{
          src: '/synthetic-image.svg',
          width: 400,
          height: 200,
          alt: 'Synthetic landscape',
        }}
        markers={[]}
        unavailableMessage="Image unavailable."
        {...props}
      />
    </MantineProvider>,
  );
}

describe('MarkerStage server rendering', () => {
  it('renders marker percentage positions without waiting for layout', () => {
    const html = renderStage({
      markers: [
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
      ],
      selectedIds: ['quarter'],
    });

    expect(html).toContain('aria-label="Synthetic landscape"');
    expect(html).toContain('alt="Synthetic landscape"');

    const quarter = html.match(
      /<button\b[^>]*data-marker-position="quarter"[^>]*>/u,
    )?.[0];
    const edge = html.match(
      /<button\b[^>]*data-marker-position="edge"[^>]*>/u,
    )?.[0];
    expect(quarter).toContain('left:25%');
    expect(quarter).toContain('top:25%');
    expect(quarter).toContain('data-marker-ids="quarter"');
    expect(quarter).toContain('data-selected="true"');
    expect(edge).toContain('left:100%');
    expect(edge).toContain('top:100%');
  });

  it('renders connector lines in the server response', () => {
    const html = renderStage({
      markers: [
        {
          id: 'first',
          x: 100,
          y: 50,
          label: 'First point',
          content: <span>First</span>,
        },
        {
          id: 'second',
          x: 300,
          y: 150,
          label: 'Second point',
          content: <span>Second</span>,
        },
      ],
      connectors: [{ id: 'first-second', from: 'first', to: 'second' }],
    });

    expect(html).toContain('<svg');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('<line');
    expect(html).toContain('x1="100"');
    expect(html).toContain('y1="50"');
    expect(html).toContain('x2="300"');
    expect(html).toContain('y2="150"');
  });
});
