import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { afterEach, describe, expect, it } from 'vitest';
import { commands, page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { MarkerStage } from '@/components/MarkerStage';

const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#789"/></svg>')}`;

async function mount() {
  await render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <MarkerStage
        image={{
          src: image,
          width: 400,
          height: 200,
          alt: 'Synthetic image',
        }}
        markers={[
          {
            id: 'selected',
            x: 100,
            y: 50,
            label: 'Selected point',
            content: <span aria-hidden="true">A</span>,
          },
        ]}
        selectedIds={['selected']}
        unavailableMessage="Image unavailable."
      />
    </MantineProvider>,
  );
}

afterEach(async () => {
  await commands.emulateMedia({ forcedColors: 'none' });
});

describe('MarkerStage selected marker ring', () => {
  it('remains visible in forced-colours mode', async () => {
    await commands.emulateMedia({ forcedColors: 'active' });
    await mount();

    const target = page
      .getByRole('button', { name: 'Selected point' })
      .element();
    const style = getComputedStyle(target);

    expect(style.outlineStyle).toBe('solid');
    expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThan(0);
    expect(style.outlineOffset).toBe('2px');
  });
});
