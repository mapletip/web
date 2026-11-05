# syntax=docker/dockerfile:1

# Official Node.js 26 Debian Slim, pinned to the multi-platform OCI index
# digest for node:26-trixie-slim. Refresh deliberately after verifying both
# linux/amd64 and linux/arm64.
FROM node:26-trixie-slim@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072 AS builder

WORKDIR /app

RUN npm install --global pnpm@12.16.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/component-library/package.json packages/component-library/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/theme/package.json packages/theme/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# Nitro externalizes React in the server build so the CommonJS
# use-sync-external-store shim and the bundled ESM modules share one React
# instance. Those runtime packages are therefore not included in .output.
RUN mkdir -p /app/runtime/node_modules \
  && cp -R node_modules/.pnpm/react@*/node_modules/react /app/runtime/node_modules/react \
  && cp -R node_modules/.pnpm/react-dom@*/node_modules/react-dom /app/runtime/node_modules/react-dom \
  && cp -R node_modules/.pnpm/scheduler@*/node_modules/scheduler /app/runtime/node_modules/scheduler

FROM node:26-trixie-slim@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072 AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

WORKDIR /app

# The application runs from the generated Nitro output only; npm is part of the
# official Node base image but is not needed at runtime.
RUN rm -rf /usr/local/lib/node_modules/npm \
  && rm -f /usr/local/bin/npm /usr/local/bin/npx

COPY --from=builder /app/apps/web/.output ./.output
COPY --from=builder /app/runtime/node_modules ./node_modules

USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
