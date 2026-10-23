import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const STRICTNESS_KEYS = [
  'strict',
  'exactOptionalPropertyTypes',
  'noUncheckedIndexedAccess',
  'noImplicitOverride',
  'noImplicitReturns',
  'noUnusedLocals',
  'noUnusedParameters',
  'isolatedModules',
];

const PER_TARGET_KEYS = new Set([
  'target',
  'lib',
  'module',
  'moduleResolution',
  'types',
  'jsx',
  'noEmit',
]);

const TS_PRESETS = ['node', 'vite-react', 'react-library'];

/** @type {Array<[string, () => Promise<void>]>} */
const checks = [
  [
    'root deps and devDeps all use the catalog',
    async () => {
      const manifest = JSON.parse(
        await readFile(new URL('../package.json', import.meta.url), 'utf8'),
      );
      for (const field of ['dependencies', 'devDependencies']) {
        for (const [name, spec] of Object.entries(manifest[field])) {
          assert.ok(
            spec.startsWith('catalog:'),
            `${field}.${name} is "${spec}" — pnpm update is known to inline ` +
              'catalog: refs; restore the catalog reference',
          );
        }
      }
    },
  ],
  [
    'eslint/node',
    async () => {
      const { node } = await import('../eslint/node.js');
      assert.ok(node(import.meta.dirname).length > 0);
    },
  ],
  [
    'eslint/react',
    async () => {
      const { react } = await import('../eslint/react.js');
      assert.ok(react(import.meta.dirname).length > 0);
    },
  ],
  [
    'eslint/vitest',
    async () => {
      const { default: vitestRules } = await import('../eslint/vitest.js');
      assert.ok(vitestRules.length > 0);
    },
  ],
  [
    'prettier',
    async () => {
      const { default: config } = await import('../prettier/index.js');
      assert.equal(config.singleQuote, true);
    },
  ],
  [
    'lint-staged',
    async () => {
      const { default: config } = await import('../lint-staged/index.js');
      assert.ok(config['*.{ts,tsx}']);
    },
  ],
  [
    'vitest/react',
    async () => {
      const { react } = await import('../vitest/react.js');
      const config = react();
      assert.ok(config.test);
      assert.equal(config.test.environment, 'jsdom');
      assert.notEqual(
        react().plugins,
        config.plugins,
        'factory must not share plugin instances',
      );
    },
  ],
  [
    'vitest/browser',
    async () => {
      const { browser } = await import('../vitest/browser.js');
      const config = browser();
      assert.ok(config.test?.browser);
      assert.equal(config.test.browser.enabled, true);
      assert.notEqual(
        browser().plugins,
        config.plugins,
        'factory must not share plugin instances',
      );
    },
  ],
  [
    'vite/lib',
    async () => {
      const { lib } = await import('../vite/lib.js');
      const config = lib();
      assert.ok(config.build);
      assert.ok(config.build.lib);
      const entry = config.build.lib.entry;
      assert.ok(Array.isArray(entry) && entry.length > 0);
      assert.ok(config.build.rollupOptions);
      const output = config.build.rollupOptions.output;
      assert.ok(Array.isArray(output) && output.length === 1);
    },
  ],
  [
    'typescript presets agree on shared strictness',
    async () => {
      const presets = Object.fromEntries(
        await Promise.all(
          TS_PRESETS.map(async (name) => [
            name,
            JSON.parse(
              await readFile(
                new URL(`../typescript/${name}.json`, import.meta.url),
                'utf8',
              ),
            ).compilerOptions,
          ]),
        ),
      );
      const nodeOptions = presets.node;

      for (const [name, options] of Object.entries(presets)) {
        const sharedKeys = Object.keys(nodeOptions).filter(
          (key) => key in options && !PER_TARGET_KEYS.has(key),
        );
        assert.ok(sharedKeys.length > 0);
        for (const key of sharedKeys) {
          assert.deepEqual(
            nodeOptions[key],
            options[key],
            `compilerOptions.${key} diverges between node.json and ${name}.json`,
          );
        }
        for (const key of STRICTNESS_KEYS) {
          assert.ok(key in options, `${name}.json missing ${key}`);
        }
      }
    },
  ],
];

let failed = false;
for (const [name, check] of checks) {
  try {
    await check();
    console.log(`ok ${name}`);
  } catch (error) {
    failed = true;
    console.error(
      `FAIL ${name}:`,
      error instanceof Error ? error.message : error,
    );
  }
}
process.exit(failed ? 1 : 0);
