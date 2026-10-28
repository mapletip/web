#!/usr/bin/env bash
# Run the Storybook visual regression suite inside the official Playwright Linux
# image, which is the only supported rendering environment for approved
# baselines. CI uses the same image tag, derived from the `playwright` catalog
# pin in pnpm-workspace.yaml.
#
#   ./scripts/visual-regression.sh test     # compare against approved baselines
#   ./scripts/visual-regression.sh update   # regenerate baselines (review the diff)
#
# Requires docker or podman (override detection with CONTAINER_ENGINE).
# Build Storybook first: `pnpm build-storybook` from the repository root.
set -euo pipefail

mode="${1:-test}"
case "$mode" in
  test | update) ;;
  *)
    echo "usage: $0 [test|update]" >&2
    exit 2
    ;;
esac

package_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_root="$(cd "$package_root/../.." && pwd)"

version="$(
  sed -nE "s/^[[:space:]]+playwright:[[:space:]]*['\"]?([0-9]+\.[0-9]+\.[0-9]+)['\"]?.*$/\1/p" \
    "$repo_root/pnpm-workspace.yaml"
)"
if [ -z "$version" ]; then
  echo "Could not read the playwright pin from pnpm-workspace.yaml" >&2
  exit 1
fi

if [ ! -f "$package_root/storybook-static/iframe.html" ]; then
  echo "Build Storybook first: pnpm build-storybook" >&2
  exit 1
fi

if [ -n "${CONTAINER_ENGINE:-}" ]; then
  engine="$CONTAINER_ENGINE"
elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  engine=docker
elif command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then
  engine=podman
else
  echo "Neither docker nor podman is usable (is the engine running?)." >&2
  exit 1
fi

suite=(test --config playwright.visual.config.ts)
if [ "$mode" = update ]; then
  # Explicit `all`: the config pins `updateSnapshots: 'none'` so no other run
  # can create or accept a baseline.
  suite+=(--update-snapshots=all)
fi

engine_args=(run --rm --init --ipc=host -e HOME=/tmp)
case "$engine" in
  podman)
    engine_args+=(--userns=keep-id --security-opt label=disable)
    ;;
  *)
    engine_args+=(-u "$(id -u):$(id -g)")
    ;;
esac

# Mount at the same absolute path so pnpm's symlinked node_modules resolve.
exec "$engine" "${engine_args[@]}" \
  -v "$repo_root:$repo_root" \
  -w "$package_root" \
  "mcr.microsoft.com/playwright:v${version}-resolute" \
  ./node_modules/.bin/playwright "${suite[@]}"
