import {
  ColorSchemeScript,
  localStorageColorSchemeManager,
  MantineProvider,
  type MantineColorSchemeManager,
} from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { act, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import '@/styles.css';

const STORAGE_KEY = 'mantine-color-scheme-value';

/** What a server without browser storage sees: always the shell default. */
const serverColorSchemeManager: MantineColorSchemeManager = {
  get: (defaultValue) => defaultValue,
  set: () => undefined,
  clear: () => undefined,
  subscribe: () => undefined,
  unsubscribe: () => undefined,
};

function buildTree(manager: MantineColorSchemeManager): ReactElement {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="dark"
      colorSchemeManager={manager}
    >
      <main>
        <h1>MapleTip</h1>
        <p>First-paint theme verification</p>
      </main>
    </MantineProvider>
  );
}

/** Execute the document-shell script exactly as a browser would at first paint. */
function runColorSchemeScript(markup: string): void {
  const parsed = new DOMParser().parseFromString(markup, 'text/html');
  const source = parsed.querySelector('script')?.textContent;
  if (source === null || source === undefined) {
    throw new Error('ColorSchemeScript rendered no inline script');
  }

  const script = document.createElement('script');
  script.textContent = source;
  document.head.append(script);
  script.remove();
}

let cleanup: (() => void) | undefined;

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  document.documentElement.removeAttribute('data-mantine-color-scheme');
  window.localStorage.clear();
});

async function hydrate(
  clientManager: MantineColorSchemeManager,
): Promise<{ readonly errors: unknown[] }> {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

  const host = document.createElement('div');
  host.innerHTML = renderToString(buildTree(serverColorSchemeManager));
  document.body.append(host);

  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;

  await act(async () => {
    root = hydrateRoot(host, buildTree(clientManager), {
      onRecoverableError: (error) => errors.push(error),
    });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });

  cleanup = () => {
    act(() => root?.unmount());
    host.remove();
  };

  return { errors };
}

describe('color-scheme first paint', () => {
  it('paints dark before hydration when no preference is stored', async () => {
    runColorSchemeScript(
      renderToString(<ColorSchemeScript defaultColorScheme="dark" />),
    );
    expect(
      document.documentElement.getAttribute('data-mantine-color-scheme'),
    ).toBe('dark');

    const { errors } = await hydrate(localStorageColorSchemeManager());

    expect(errors).toEqual([]);
    expect(
      document.documentElement.getAttribute('data-mantine-color-scheme'),
    ).toBe('dark');
    expect(getComputedStyle(document.body).backgroundColor).toBe(
      'rgb(15, 19, 23)',
    );
  });

  it('paints a saved light preference without a hydration mismatch', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'light');
    runColorSchemeScript(
      renderToString(<ColorSchemeScript defaultColorScheme="dark" />),
    );
    expect(
      document.documentElement.getAttribute('data-mantine-color-scheme'),
    ).toBe('light');

    const { errors } = await hydrate(localStorageColorSchemeManager());

    expect(errors).toEqual([]);
    expect(
      document.documentElement.getAttribute('data-mantine-color-scheme'),
    ).toBe('light');
    expect(getComputedStyle(document.body).backgroundColor).toBe(
      'rgb(250, 246, 239)',
    );
  });
});
