import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { Thumbnail } from '@/components/Thumbnail';

describe('Thumbnail in the browser', () => {
  it('keeps natural dimensions within the magnified square without smoothing', async () => {
    const sizes = [
      { label: 'Small', width: 4, height: 4 },
      { label: 'Exact', width: 20, height: 20 },
      { label: 'Large', width: 80, height: 80 },
      { label: 'Wide', width: 32, height: 8 },
      { label: 'Tall', width: 8, height: 32 },
    ];

    await render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        {sizes.map(({ label, width, height }) => (
          <Thumbnail
            key={label}
            src={`data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="gold"/></svg>`,
            )}`}
            size={40}
            magnify={2}
            alt={label}
          />
        ))}
      </MantineProvider>,
    );

    for (const { label, width, height } of sizes) {
      const locator = page.getByRole('img', { name: label });
      await expect
        .poll(() => (locator.element() as HTMLImageElement).naturalWidth)
        .toBe(width);
      const image = locator.element() as HTMLImageElement;
      const style = getComputedStyle(image);
      const box = image.parentElement?.getBoundingClientRect();

      expect(image.naturalHeight).toBe(height);
      expect(style.width).toBe('20px');
      expect(style.height).toBe('20px');
      expect(style.objectFit).toBe('scale-down');
      expect(style.transform).toBe('matrix(2, 0, 0, 2, 0, 0)');
      expect(style.imageRendering).toBe('pixelated');
      expect(box?.width).toBe(40);
      expect(box?.height).toBe(40);
    }
  });

  it('keeps the full fallback box for missing and broken magnified images', async () => {
    await render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <Thumbnail size={40} magnify={2.5} alt="Missing" />
        <Thumbnail
          src="data:image/png;base64,not-an-image"
          size={40}
          magnify={2.5}
          alt="Broken"
        />
      </MantineProvider>,
    );

    for (const name of ['Missing', 'Broken']) {
      const locator = page.getByRole('img', { name });
      await expect.element(locator).toHaveAttribute('data-fallback', 'true');
      const image = locator.element();
      const style = getComputedStyle(image);
      expect(style.width).toBe('40px');
      expect(style.height).toBe('40px');
      expect(style.transform).toBe('none');
      expect(image.getBoundingClientRect().width).toBe(40);
    }
  });

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
