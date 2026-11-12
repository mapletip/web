import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EntityChip } from '@/components/EntityChip';

function renderChip(name: string, linked: boolean): string {
  return renderToString(
    <MantineProvider theme={theme} forceColorScheme="dark">
      <EntityChip
        name={name}
        iconSrc="/images/synthetic-item.svg"
        destination={
          linked ? { href: '/maplestory/monsters/synthetic-100100' } : undefined
        }
        trailing={<button type="button">Confirmed</button>}
      />
    </MantineProvider>,
  );
}

describe('EntityChip server rendering', () => {
  it('renders the destination as a plain anchor in server HTML', () => {
    const html = renderChip('Synthetic item', true);

    expect(html).toContain('<a');
    expect(html).toContain('href="/maplestory/monsters/synthetic-100100"');
    expect(html).toContain('Synthetic item');
    expect(html).toContain('/images/synthetic-item.svg');
  });

  it('renders the trailing control after the link, not inside it', () => {
    const html = renderChip('Synthetic item', true);

    expect(html.indexOf('</a>')).toBeLessThan(html.indexOf('<button'));
    expect(html).toContain('Confirmed');
  });

  it('renders no anchor when the chip has no destination', () => {
    const html = renderChip('Synthetic item', false);

    expect(html).not.toContain('<a');
    expect(html).toContain('Synthetic item');
    expect(html).toContain('<button');
  });
});
