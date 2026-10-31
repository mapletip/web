import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';

const config: StorybookConfig = {
  stories: [
    '../src/components/**/__stories__/**/*.stories.@(ts|tsx)',
    '../src/brand/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
    // `--host localhost` binds the IPv4 and IPv6 loopback addresses; allowedHosts
    // stays limited to loopback names so LAN addresses are not exposed.
    allowedHosts: ['localhost', '127.0.0.1', '::1', '[::1]'],
  },
  viteFinal: (viteConfig) => {
    viteConfig.resolve = viteConfig.resolve ?? {};
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      '@': path.join(import.meta.dirname, '../src'),
    };
    return viteConfig;
  },
};

export default config;
