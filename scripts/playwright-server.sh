#!/usr/bin/env bash
# Runs the official Playwright image as a remote browser server for hosts
# that can't run Chromium natively (e.g. Fedora CoreOS). Vitest connects to
# it when PLAYWRIGHT_WS_ENDPOINT is set; see packages/config/vitest/browser.js.
set -euo pipefail

name=playwright-server
port="${PLAYWRIGHT_SERVER_PORT:-3333}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "${1:-up}" in
  up)
    # Image must match the installed playwright client version exactly.
    version="$(cd "$root/packages/component-library" && node -p "require('playwright/package.json').version")"
    if podman container exists "$name"; then
      echo "$name already running"
    else
      podman run -d --rm --init --name "$name" --network host \
        --user pwuser --workdir /home/pwuser \
        "mcr.microsoft.com/playwright:v${version}-noble" \
        npx -y "playwright@${version}" run-server --port "$port" --host 127.0.0.1 >/dev/null
      echo "$name started (playwright ${version})"
    fi
    echo "export PLAYWRIGHT_WS_ENDPOINT=ws://127.0.0.1:${port}/"
    ;;
  down)
    podman stop "$name" >/dev/null && echo "$name stopped"
    ;;
  *)
    echo "usage: $0 [up|down]" >&2
    exit 1
    ;;
esac
