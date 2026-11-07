import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ItemIcon, ITEM_ICON_PLACEHOLDER } from '../ItemIcon';

describe('ItemIcon SSR markup', () => {
  it('renders lazy decorative image with media URL when icon digest is present', () => {
    const validContentId = 'a'.repeat(64);
    const html = renderToString(
      <MantineProvider theme={theme}>
        <ItemIcon icon={validContentId} />
      </MantineProvider>,
    );

    expect(html).toContain('loading="lazy"');
    expect(html).toContain('alt=""');
    expect(html).toContain(
      `https://d0.mapletip.com/media/images/aa/${validContentId}.png`,
    );
  });

  it('renders neutral local placeholder without network URL when icon is absent', () => {
    const html = renderToString(
      <MantineProvider theme={theme}>
        <ItemIcon icon={undefined} />
      </MantineProvider>,
    );

    expect(html).toContain('alt=""');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('data:image/svg+xml');
    expect(html).not.toContain('https://d0.mapletip.com');
  });

  it('provides a valid placeholder data URI', () => {
    expect(ITEM_ICON_PLACEHOLDER.startsWith('data:image/svg+xml')).toBe(true);
    expect(ITEM_ICON_PLACEHOLDER).toContain("width='32'");
    expect(ITEM_ICON_PLACEHOLDER).toContain("height='32'");
  });
});
