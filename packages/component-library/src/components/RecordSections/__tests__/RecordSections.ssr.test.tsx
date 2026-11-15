import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RecordSections } from '@/components/RecordSections';

describe('RecordSections server rendering', () => {
  it('renders native section links, heading targets and open content in server HTML', () => {
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <RecordSections
          sections={[
            {
              id: 'locations',
              title: 'Locations',
              count: 3,
              content: 'Three places',
            },
            {
              id: 'drops',
              title: 'Drops',
              count: 'unknown',
              content: 'Drop content',
            },
          ]}
        />
      </MantineProvider>,
    );

    expect(html).toContain('<nav');
    expect(html).toContain('aria-label="Record sections"');
    expect(html).toContain('href="#locations"');
    expect(html).toContain('href="#drops"');
    expect(html).toContain('<h2');
    expect(html).toContain('id="locations"');
    expect(html).toContain('id="drops"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('Three places');
    expect(html).toContain('Drop content');
  });
});
