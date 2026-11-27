import { MantineProvider } from '@mantine/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { CategorizedItemRow } from '../../browse/project';
import { scrolls } from '../scrolls';

const row: CategorizedItemRow = {
  key: 'practice-scroll',
  sourceId: 'practice-scroll',
  itemClass: 'consume',
  name: 'Practice Scroll',
  icon: 'a'.repeat(64),
  targetLabel: 'hat',
  kind: 'scrolls',
  kindPath: ['all', 'use', 'scrolls'],
};

describe('scroll media', () => {
  it('overlays the scroll on a published equipment picture', () => {
    const html = renderToStaticMarkup(
      <MantineProvider>
        {scrolls.card.media(row, {
          coverage: undefined,
          relations: {},
          scrollTargetIcons: { hat: 'b'.repeat(64) },
        })}
      </MantineProvider>,
    );
    expect(html).toContain('b'.repeat(64));
    expect(html).toContain('a'.repeat(64));
    expect(html.match(/<img\b/gu)).toHaveLength(2);
  });

  it('uses the scroll picture when the equipment picture is missing', () => {
    const html = renderToStaticMarkup(
      <MantineProvider>
        {scrolls.card.media(row, {
          coverage: undefined,
          relations: {},
          scrollTargetIcons: {},
        })}
      </MantineProvider>,
    );
    expect(html).toContain('a'.repeat(64));
    expect(html.match(/<img\b/gu)).toHaveLength(1);
  });
});
