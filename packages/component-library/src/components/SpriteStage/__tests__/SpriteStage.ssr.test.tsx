import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SpriteStage } from '@/components/SpriteStage';
import type { SpriteStageProps } from '@/components/SpriteStage';

function renderStage(props: Partial<SpriteStageProps>): string {
  return renderToString(
    <MantineProvider theme={theme} forceColorScheme="dark">
      <SpriteStage
        name="Synthetic sprite"
        unavailableMessage="No sprite is available for this record."
        {...props}
      />
    </MantineProvider>,
  );
}

/** Collect the opening tags of one element type, whatever their attributes. */
function countTags(html: string, tag: string): number {
  return html.match(new RegExp(`<${tag}\\b`, 'gu'))?.length ?? 0;
}

describe('SpriteStage server rendering', () => {
  it('renders one named sprite and no controls', () => {
    const html = renderStage({ src: '/sprite.svg' });

    expect(countTags(html, 'img')).toBe(1);
    expect(html).toContain('src="/sprite.svg"');
    expect(html).toContain('alt="Synthetic sprite"');
    expect(html).toContain('loading="lazy"');
    expect(countTags(html, 'button')).toBe(0);
    expect(countTags(html, 'a')).toBe(0);
    expect(countTags(html, 'input')).toBe(0);
    expect(html).not.toContain('tabindex');
  });

  it('renders the pedestal as decorative markup', () => {
    const html = renderStage({ src: '/sprite.svg' });

    // Three empty decorations: floor, glow and contact shadow.
    expect(html.match(/aria-hidden="true"><\/span>/gu)).toHaveLength(3);
  });

  it('renders the supplied dimensions as image attributes', () => {
    const html = renderStage({ src: '/sprite.svg', width: 120, height: 160 });

    expect(html).toContain('width="120"');
    expect(html).toContain('height="160"');
  });

  it('renders the unavailable message when there is no sprite', () => {
    const html = renderStage({});

    expect(html).toContain('No sprite is available for this record.');
    expect(countTags(html, 'img')).toBe(0);
    expect(html).toContain('data-unavailable="true"');
  });
});
