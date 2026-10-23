import { MantineProvider } from '@mantine/core';
import type { Preview } from '@storybook/react-vite';

import { theme } from '../src/theme';
import '../src/styles.css';

const preview: Preview = {
  globalTypes: {
    colorScheme: {
      description: 'Mantine color scheme',
      toolbar: {
        title: 'Color scheme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { colorScheme: 'light' },
  decorators: [
    (Story, context) => (
      <MantineProvider
        theme={theme}
        forceColorScheme={context.globals['colorScheme'] as 'light' | 'dark'}
      >
        <Story />
      </MantineProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
};

export default preview;
