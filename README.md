# @mapletip/web

pnpm + [Turborepo](https://turborepo.dev/) monorepo.

## Packages

- `@mapletip/web`: TanStack Start app in `apps/web`
- `@mapletip/theme`: shared Maple Twilight Mantine theme
- `@mapletip/component-library`: Mantine components and Storybook
- `@mapletip/config`: shared tooling configs

## Setup

Install the Node version in `.nvmrc` with your version manager, then install
pnpm with npm:

```sh
npm install --global pnpm
pnpm install --frozen-lockfile
```

## Commands

| Command                | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `pnpm dev`             | TanStack Start app on http://localhost:3000  |
| `pnpm build`           | Component library and Start production build |
| `pnpm storybook`       | Storybook on http://localhost:6006           |
| `pnpm build-storybook` | Static Storybook build                       |
| `pnpm test`            | Tests                                        |
| `pnpm lint`            | ESLint                                       |
| `pnpm typecheck`       | TypeScript                                   |
| `pnpm format`          | Prettier                                     |
