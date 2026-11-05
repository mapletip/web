import { readFile } from 'node:fs/promises';

const expected = (
  await readFile(new URL('../.nvmrc', import.meta.url), 'utf8')
).trim();
const expectedMajor = expected.split('.')[0];
const actualMajor = process.versions.node.split('.')[0];

if (actualMajor !== expectedMajor) {
  console.error(
    `MapleTip web requires Node.js ${expectedMajor}.x; this is Node.js ${process.versions.node}.`,
  );
  console.error(
    `Install Node.js ${expected} from .nvmrc (see README.md), then retry.`,
  );
  process.exit(1);
}
