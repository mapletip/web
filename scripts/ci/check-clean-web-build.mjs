import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const outputDir = resolve('apps/web/.output');
const configPath = resolve('apps/web/src/config/maplekit.ts');
const forbidden = [
  'mockServiceWorker',
  '@mswjs',
  'virtual:msw',
  'Plain Pebble',
  'Twin Sprout',
  'Native Alpha',
  'Patchy Records',
];

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const outputStat = await stat(outputDir).catch(() => undefined);
if (!outputStat?.isDirectory()) {
  throw new Error(`Production output does not exist: ${outputDir}`);
}

const files = await listFiles(outputDir);
const workerPath = resolve(outputDir, 'public/mockServiceWorker.js');
if (files.includes(workerPath)) {
  throw new Error(
    'Production output unexpectedly contains mockServiceWorker.js.',
  );
}

const matches = [];
let outputContainsPin = false;
const source = await readFile(configPath, 'utf8');
const pin = /sha256:\s*'([a-f0-9]{64})'/u.exec(source)?.[1];
if (pin === undefined)
  throw new Error('Could not read the production release pin.');

for (const path of files) {
  const content = await readFile(path, 'utf8');
  for (const marker of forbidden) {
    if (content.includes(marker)) matches.push(`${path}: ${marker}`);
  }
  if (content.includes(pin)) outputContainsPin = true;
}

if (matches.length > 0) {
  throw new Error(
    `Production build contains mock data or code:\n${matches.join('\n')}`,
  );
}
if (!outputContainsPin) {
  throw new Error(
    'Production output does not contain the pinned production release digest.',
  );
}
