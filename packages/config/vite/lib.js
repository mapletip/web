import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

/**
 * Vite library-mode base: type declarations, externalized dependencies,
 * per-module output preserving the src/ layout. ESM-only by default; pass
 * `formats: ['es', 'cjs']` for dual output.
 *
 * @param {{ entry?: string[], formats?: ('es' | 'cjs')[], cssFileName?: string }} [options]
 */
export function lib({
  entry = ['src/index.ts'],
  formats = ['es'],
  cssFileName,
} = {}) {
  return defineConfig({
    plugins: [
      dts({
        tsconfigPath: './tsconfig.json',
        entryRoot: 'src',
        exclude: [
          '**/__tests__/**',
          '**/__stories__/**',
          '**/.storybook/**',
          '**/fixtures/**',
          '**/test-support/**',
          '**/*.test.*',
          '**/*.stories.*',
          '**/vitest.config.*',
          '**/vite*.config.*',
          '**/styles.ts',
        ],
      }),
      externalizeDeps(),
    ],
    build: {
      sourcemap: true,
      lib: {
        entry,
        ...(cssFileName !== undefined ? { cssFileName } : {}),
      },
      rolldownOptions: {
        output: formats.map((format) => ({
          format,
          exports: 'auto',
          entryFileNames: format === 'es' ? '[name].js' : '[name].cjs',
          preserveModules: true,
          preserveModulesRoot: 'src',
        })),
      },
    },
  });
}
