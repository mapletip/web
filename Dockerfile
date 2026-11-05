# syntax=docker/dockerfile:1

# Official Node.js 26 Debian Slim, pinned to the multi-platform OCI index
# digest for node:26-trixie-slim.
FROM node:26-trixie-slim@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072 AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME/bin:$PATH

WORKDIR /app

# get-pnpm installs the pnpm version from the repository's packageManager pin.
COPY package.json ./
RUN npx --yes get-pnpm --no-modify-path

FROM base AS pruner

WORKDIR /app

COPY . .

RUN pnpm dlx turbo@2.11.10 prune @mapletip/web --docker

FROM base AS installer

WORKDIR /app

COPY --from=pruner /app/out/json/ ./
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ ./
RUN pnpm build

FROM node:26-trixie-slim@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072 AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

WORKDIR /app

COPY --from=installer /app/apps/web/.output ./.output

USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
