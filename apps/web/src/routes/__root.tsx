import { ColorSchemeScript, MantineProvider, Text, Title } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { AppFooter } from '@/components/AppFooter/AppFooter';
import { AppHeader } from '@/components/AppHeader/AppHeader';
import appCss from '@/styles.css?url';

import shellClasses from './__root.module.css';

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
  notFoundComponent: NotFoundPage,
});

function RootLayout() {
  return (
    <div className={shellClasses['document']}>
      <div className={shellClasses['shell']}>
        <a className="skip-to-main" href="#main-content">
          Skip to content
        </a>
        <AppHeader />
        <Outlet />
      </div>
      <AppFooter />
    </div>
  );
}

function NotFoundPage() {
  return (
    <main id="main-content" tabIndex={-1} className={shellClasses['notFound']}>
      <Title order={1}>Page not found</Title>
      <Text>{"We couldn't find the page you're looking for!"}</Text>
      <Text>
        <Link to="/">Back to the MapleTip home page</Link>
      </Text>
    </main>
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
