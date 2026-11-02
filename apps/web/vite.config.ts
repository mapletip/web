import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

const config = defineConfig({
  resolve: {
    alias: {
      // The component library is consumed from source, so its internal `@/`
      // imports must resolve against the package rather than this app.
      '@': path.resolve(
        import.meta.dirname,
        '../../packages/component-library/src',
      ),
      '#': path.resolve(import.meta.dirname, 'src'),
    },
    tsconfigPaths: true,
  },
  plugins: [tanstackStart(), viteReact()],
});

export default config;
