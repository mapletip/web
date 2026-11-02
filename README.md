# web

pnpm + [Turborepo](https://turborepo.dev/) monorepo.

## Packages

- `@mapletip/web`: TanStack Start app in `apps/web`
- `@mapletip/theme`: shared Maple Twilight Mantine theme
- `@mapletip/component-library`: Mantine components and Storybook
- `@mapletip/config`: shared tooling configs

## Setup

Requires Node (see `.nvmrc`) and pnpm via corepack:

```sh
corepack enable pnpm
pnpm install
```

## Commands

| Command                | What it does                                |
| ---------------------- | ------------------------------------------- |
| `pnpm dev`             | TanStack Start app on http://localhost:3000 |
| `pnpm storybook`       | Storybook on http://localhost:6006          |
| `pnpm build-storybook` | Static Storybook build                      |
| `pnpm test`            | Tests                                       |
| `pnpm lint`            | ESLint                                      |
| `pnpm typecheck`       | TypeScript                                  |
| `pnpm format`          | Prettier                                    |
