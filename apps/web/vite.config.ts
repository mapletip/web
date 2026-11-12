import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { msw } from 'msw/vite';
import { nitro } from 'nitro/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/** Mock mode: MSW answers the MapleKit data origin from a synthetic release. */
const mockMode = process.env['API_MODE'] === 'msw';

const config = defineConfig({
  envPrefix: ['VITE_', 'API_MODE'],
  resolve: {
    tsconfigPaths: true,
    alias: mockMode
      ? {
          '@/config/maplekit': fileURLToPath(
            new URL('./src/mocks/maplekit.ts', import.meta.url),
          ),
        }
      : {},
  },
  server: { host: '127.0.0.1' },
  plugins: [
    ...(mockMode ? [msw()] : []),
    tanstackStart(),
    nitro(
      mockMode
        ? {
            // msw/node reads a .wasm file at runtime; tracing copies the whole package.
            traceDeps: ['@mswjs/interceptors*'],
            // Never overwrite the production build.
            output: { dir: '.output-msw' },
          }
        : {},
    ),
    viteReact(),
  ],
});

export default config;
