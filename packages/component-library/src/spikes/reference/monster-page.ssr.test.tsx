import { MantineProvider } from '@mantine/core';
import { renderToString } from 'react-dom/server';
import { expect, test } from 'vitest';

import { createSampleMonsters, sortSampleMonsters } from './support/fixtures';
import { MonsterPage } from './support/MonsterPage';

test('server HTML of the full composition (plain Node)', () => {
  expect(typeof window).toBe('undefined');
  const html = renderToString(
    <MantineProvider>
      <MonsterPage />
    </MantineProvider>,
  );
  const rows = sortSampleMonsters(createSampleMonsters(100), {
    field: 'exp',
    direction: 'desc',
  });
  const positions = rows.map((r) => html.indexOf(`href="${r.href}"`));
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect(positions).toEqual([...positions].sort((a, b) => a - b)); // sort order preserved
  expect(html).toContain('<table');
  expect(html).toContain('aria-label="Monster cards"'); // cards markup present too
  expect(html).toMatch(/aria-labelledby="[^"]+"/u);
  expect(html).toContain(', sorted descending');
  expect(html).toContain('href="?page=2"');
  expect(html).toContain('aria-label="Monster filters"');
  console.info(`[ref] SSR html raw=${html.length}`);
});
