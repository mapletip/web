import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { AppHeader } from '../components/AppHeader/AppHeader';
import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'MapleTip',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <a className="skip-to-main" href="#main-content">
        Skip to content
      </a>
      <AppHeader />
      <Outlet />
    </>
  );
}

function RootDocument({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" data-mantine-color-scheme="dark">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" forceColorScheme="dark" />
        <HeadContent />
      </head>
      <body>
        <MantineProvider
          theme={theme}
          cssVariablesResolver={cssVariablesResolver}
          defaultColorScheme="dark"
          forceColorScheme="dark"
        >
          {children}
        </MantineProvider>
        <Scripts />
      </body>
    </html>
  );
}
