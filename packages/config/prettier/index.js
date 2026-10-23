import packagejson from 'prettier-plugin-packagejson';

/**
 * Prettier v3 defaults with the single evidence-backed deviation
 * (singleQuote) plus package.json field sorting. The plugin is passed as a
 * module, not a string: string plugin names resolve from the consumer's
 * node_modules, which pnpm's isolation breaks. Formatting keys are limited
 * to the subset oxfmt also understands so a future formatter swap stays
 * mechanical.
 *
 * @type {import('prettier').Config}
 */
export default {
  singleQuote: true,
  plugins: [packagejson],
};
