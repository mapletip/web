import { MantineProvider } from '@mantine/core';
import { useEffect } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import '../../styles.css';
import { theme } from '../../theme';

import { MonsterPage } from './support/MonsterPage';

function Mark({ done }: { done: () => void }): null {
  useEffect(done, [done]);
  return null;
}
const tree = (done: () => void) => (
  <MantineProvider theme={theme}>
    <MonsterPage />
    <Mark done={done} />
  </MantineProvider>
);
const snap = (host: HTMLElement) => {
  const r = (e: Element | null) =>
    e
      ? {
          h: Math.round(e.getBoundingClientRect().height),
          w: Math.round(e.getBoundingClientRect().width),
          t: Math.round(e.getBoundingClientRect().top),
        }
      : null;
  return {
    table: r(host.querySelector('table')),
    row: r(host.querySelector('tbody tr')),
    rail: r(host.querySelector('aside')),
    host: r(host),
  };
};

test('hydrates the full composition without errors or layout change', async () => {
  document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  await page.viewport(1440, 900);
  const html = renderToString(tree(() => {}));
  const host = document.createElement('div');
  document.body.append(host);
  host.innerHTML = html;
  const before = snap(host);
  const errors: unknown[] = [];
  const logged: unknown[] = [];
  const original = console.error;
  console.error = (...a: unknown[]) => logged.push(a);
  let mounted = false;
  const root = hydrateRoot(
    host,
    tree(() => {
      mounted = true;
    }),
    { onRecoverableError: (e) => errors.push(e) },
  );
  await vi.waitFor(() => expect(mounted).toBe(true), { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 300));
  console.error = original;
  const after = snap(host);
  root.unmount();
  host.remove();
  expect(errors).toEqual([]);
  expect(logged).toEqual([]);
  expect(after).toEqual(before);
});
