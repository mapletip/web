import { MantineProvider } from '@mantine/core';
import type { Preview } from '@storybook/react-vite';

import { PALETTES } from '@/palette-studio/palettes.data';
import { resolvePaletteTheme } from '@/palette-studio/themeAdapter';

import '@/styles.css';

const preview: Preview = {
  globalTypes: {
    colorScheme: {
      description: 'Mantine color scheme',
      toolbar: {
        title: 'Color scheme',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'light', title: 'Light', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
    brandPalette: {
      description: 'MapleTip brand palette exploration',
      toolbar: {
        title: 'Palette',
        icon: 'paintbrush',
        items: PALETTES.map((p) => {
          let prefix: string;
          if (p.id === 'approved-v7') {
            prefix = '★ ';
          } else if (p.category === 'new-direction') {
            if (p.reviewStatus === 'Shortlist') prefix = '✦ ';
            else if (p.reviewStatus === 'Conditional') prefix = '◆ ';
            else prefix = '▲ ';
          } else if (p.category === 'historical-regional') {
            prefix = '🗺 ';
          } else {
            prefix = '📜 ';
          }
          return {
            value: p.id,
            title: `${prefix}${p.name}${p.reviewStatus === 'Shortlist' ? ' [Shortlist]' : ''}`,
          };
        }),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    colorScheme: 'dark',
    brandPalette: 'approved-v7',
    viewport: { value: 'desktop', isRotated: false },
  },
  decorators: [
    (Story, context) => {
      const colorScheme =
        (context.globals['colorScheme'] as 'light' | 'dark') ?? 'dark';
      const brandPaletteId = context.globals['brandPalette'] as
        | string
        | undefined;
      const { theme, cssVariablesResolver } =
        resolvePaletteTheme(brandPaletteId);

      return (
        <MantineProvider
          key={`${brandPaletteId ?? 'approved-v7'}-${colorScheme}`}
          theme={theme}
          cssVariablesResolver={cssVariablesResolver}
          forceColorScheme={colorScheme}
        >
          <Story />
        </MantineProvider>
      );
    },
  ],
  parameters: {
    a11y: { test: 'error' },
    layout: 'centered',
    viewport: {
      options: {
        phone: {
          name: 'Phone 375×812',
          styles: { width: '375px', height: '812px' },
          type: 'mobile',
        },
        smallPhone: {
          name: 'Small phone 320×640',
          styles: { width: '320px', height: '640px' },
          type: 'mobile',
        },
        mobileBreakpoint: {
          name: 'Mobile breakpoint 500×800',
          styles: { width: '500px', height: '800px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet 900×768',
          styles: { width: '900px', height: '768px' },
          type: 'tablet',
        },
        desktopMin: {
          name: 'Desktop 1080×768',
          styles: { width: '1080px', height: '768px' },
          type: 'desktop',
        },
        desktop: {
          name: 'Desktop 1366×768',
          styles: { width: '1366px', height: '768px' },
          type: 'desktop',
        },
        wideDesktop: {
          name: 'Wide desktop 1920×1080',
          styles: { width: '1920px', height: '1080px' },
          type: 'desktop',
        },
      },
    },
  },
};

export default preview;
