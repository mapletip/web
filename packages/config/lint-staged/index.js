/**
 * Shared base; repos spread this and add repo-specific entries. Keys are
 * granular (rather than one glob for everything) so a consumer repo can
 * delete exactly the key it handles differently — e.g. a repo that lints
 * YAML with `ansible-lint` instead of prettier drops `'*.{yaml,yml}'`.
 *
 * @type {Record<string, string | string[]>}
 */
export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,mjs,cjs}': 'prettier --write',
  '*.json': 'prettier --write',
  '*.md': 'prettier --write',
  '*.{yaml,yml}': 'prettier --write',
};
