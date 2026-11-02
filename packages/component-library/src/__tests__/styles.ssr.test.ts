import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Node project: the check reads the package on disk, which the browser
// projects cannot do. It guards the curated Mantine stylesheet list that
// `src/styles.css` maintains by hand.
const require = createRequire(import.meta.url);
const mantineStylesDir = path.dirname(
  require.resolve('@mantine/core/styles/Button.layer.css'),
);
const srcRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const stylesEntry = readFileSync(path.join(srcRoot, 'styles.css'), 'utf8');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return /\.tsx?$/u.test(entry.name) ? [entryPath] : [];
  });
}

/** Mantine components imported by the library's source. */
function importedComponents(): Set<string> {
  const components = new Set<string>();
  for (const file of sourceFiles(srcRoot)) {
    if (file.includes(`${path.sep}__tests__${path.sep}`)) continue;
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(
      /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'@mantine\/core'/gu,
    )) {
      for (const specifier of match[1]!.split(',')) {
        const name = specifier
          .trim()
          .split(/\s+as\s+/u)[0]!
          .trim();
        if (name !== '' && /^[A-Z]/u.test(name)) components.add(name);
      }
    }
  }
  return components;
}

/** Stylesheets the entry point imports, as Mantine component names. */
function importedStylesheets(): string[] {
  return [
    ...stylesEntry.matchAll(
      /@import\s+'@mantine\/core\/styles\/([\w-]+)\.layer\.css'/gu,
    ),
  ].map((match) => match[1]!);
}

/**
 * Component stylesheets in the order Mantine's own bundle defines them.
 * Components share specificity, and rules inside one layer resolve by source
 * order, so the upstream order is part of the contract (UnstyledButton has to
 * precede Button, for example).
 */
function upstreamStylesheetOrder(): string[] {
  // A class only identifies its owner when exactly one stylesheet defines it;
  // hashed component classes qualify, shared utility classes do not.
  const classOwners = new Map<string, string[]>();
  for (const file of readdirSync(mantineStylesDir)) {
    if (!file.endsWith('.layer.css')) continue;
    const stylesheet = file.slice(0, -'.layer.css'.length);
    for (const [, className] of readFileSync(
      path.join(mantineStylesDir, file),
      'utf8',
    ).matchAll(/\.([A-Za-z_][\w-]*)/gu)) {
      if (className === undefined) continue;
      const owners = classOwners.get(className) ?? [];
      if (!owners.includes(stylesheet)) owners.push(stylesheet);
      classOwners.set(className, owners);
    }
  }
  const classToStylesheet = new Map(
    [...classOwners]
      .filter(([, owners]) => owners.length === 1)
      .map(([className, owners]) => [className, owners[0]!]),
  );

  const bundle = readFileSync(
    path.join(mantineStylesDir, '..', 'styles.layer.css'),
    'utf8',
  );
  const seen = new Set<string>();
  for (const [, className] of bundle.matchAll(/\.([A-Za-z_][\w-]*)/gu)) {
    const stylesheet = classToStylesheet.get(className ?? '');
    if (stylesheet !== undefined) seen.add(stylesheet);
  }
  return [...seen];
}

describe('styles entry point', () => {
  it('imports every stylesheet it names', () => {
    const missing = importedStylesheets().filter(
      (name) => !existsSync(path.join(mantineStylesDir, `${name}.layer.css`)),
    );

    expect(missing).toEqual([]);
  });

  it('keeps component stylesheets in the upstream order', () => {
    const upstream = upstreamStylesheetOrder();
    const imported = importedStylesheets().filter((name) =>
      upstream.includes(name),
    );

    expect(imported).toEqual(
      upstream.filter((name) => imported.includes(name)),
    );
  });

  it('covers every Mantine component the source imports', () => {
    const imported = new Set(importedStylesheets());
    const uncovered = [...importedComponents()].filter(
      (component) =>
        existsSync(path.join(mantineStylesDir, `${component}.layer.css`)) &&
        !imported.has(component),
    );

    expect(uncovered).toEqual([]);
  });
});
