import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import type { Preview } from '@storybook/react-vite';

import '@/styles.css';

const preview: Preview = {
  initialGlobals: {
    viewport: { value: 'desktop', isRotated: false },
  },
  decorators: [
    (Story) => (
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        defaultColorScheme="dark"
        forceColorScheme="dark"
      >
        <Story />
      </MantineProvider>
    ),
  ],
  parameters: {
    a11y: { test: 'error' },
    backgrounds: { disable: true },
    layout: 'centered',
    options: {
      // Plain alphabetical order; no hand-maintained order list to keep in
      // sync as components are added, renamed or regrouped.
      storySort: { method: 'alphabetical' },
    },
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
