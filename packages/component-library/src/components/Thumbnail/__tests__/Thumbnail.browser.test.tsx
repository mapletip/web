import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { Thumbnail } from '@/components/Thumbnail';

describe('Thumbnail in the browser', () => {
  it('shows the fallback image when the source fails to load', async () => {
    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        <Thumbnail
          src="data:image/png;base64,not-an-image"
          size={40}
          alt="Invalid source"
        />
      </MantineProvider>,
    );

    await expect
      .element(page.getByRole('img', { name: 'Invalid source' }))
      .toHaveAttribute('data-fallback', 'true');
  });
});
