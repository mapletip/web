import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Thumbnail } from '@/components/Thumbnail';

function renderThumbnail(thumbnail: ReactNode) {
  return renderToString(
    <MantineProvider theme={theme} forceColorScheme="dark">
      {thumbnail}
    </MantineProvider>,
  );
}

describe('Thumbnail server rendering', () => {
  it('renders a resolved image with its square size and lazy loading', () => {
    const html = renderThumbnail(
      <Thumbnail src="/images/record.svg" size={40} alt="Record image" />,
    );

    expect(html.match(/<img\b/gu)).toHaveLength(1);
    expect(html).toContain('src="/images/record.svg"');
    expect(html).toContain('alt="Record image"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('width:calc(2.5rem * var(--mantine-scale))');
    expect(html).toContain('height:calc(2.5rem * var(--mantine-scale))');
  });

  it('renders the fallback image when src is absent', () => {
    const html = renderThumbnail(<Thumbnail size={32} />);

    expect(html.match(/<img\b/gu)).toHaveLength(1);
    expect(html).toContain('data-fallback="true"');
    expect(html).toContain('src="data:image/svg+xml,');
  });

  it('defaults alt to an empty string', () => {
    const html = renderThumbnail(
      <Thumbnail src="/images/record.svg" size={24} />,
    );

    expect(html).toContain('alt=""');
  });
});
