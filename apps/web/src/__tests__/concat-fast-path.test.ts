import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

/**
 * V8 switches off its fast Array.prototype.concat for the whole process once any
 * object gets a Symbol.isConcatSpreadable property. seroval 1.7.6 did that at
 * import time, which made the MapleKit SDK's validators take 27–31 s on large
 * packs. A fresh Node process reads V8's protector after importing the framework.
 */
function concatFastPathAfterImport({ specifier }: { specifier: string }) {
  const output = execFileSync(
    process.execPath,
    [
      '--allow-natives-syntax',
      '--input-type=module',
      '-e',
      `await import(${JSON.stringify(specifier)}); console.log(%IsConcatSpreadableProtector());`,
    ],
    { encoding: 'utf8' },
  );
  return output.trim() === 'true';
}

describe('Array.prototype.concat fast path', () => {
  it.each(['@tanstack/react-router', '@tanstack/react-start'])(
    'stays on after importing %s',
    (specifier) => {
      expect(concatFastPathAfterImport({ specifier })).toBe(true);
    },
  );
});
