#!/usr/bin/env bash
# Smoke tests a single-architecture mapletip/web container image, whether it
# was built locally (PR feedback) or pulled by digest from GHCR (publish
# jobs). Shared so both paths exercise identical checks.
#
# CONTAINER_CLI selects the CLI (defaults to docker, matching hosted GitHub
# Actions runners); set it to podman for local use.
set -euo pipefail

cli="${CONTAINER_CLI:-docker}"
image="$1"
port="${2:-18087}"
name="web-smoke-$$"

"$cli" run --detach --name "$name" \
  --read-only --cap-drop=ALL --security-opt=no-new-privileges \
  --user 1000:1000 -e PORT=8087 -p "$port:8087" \
  "$image"
trap '"$cli" logs "$name" || true; "$cli" rm -f "$name" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 30); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/api/healthz")" = 200 ]; then
    break
  fi
  sleep 1
done

test "$(curl -s "http://127.0.0.1:$port/api/healthz")" = ok
curl -s -D "/tmp/smoke-health-headers-$$" -o /dev/null "http://127.0.0.1:$port/api/healthz"
grep -qi '^cache-control: no-store' "/tmp/smoke-health-headers-$$"
test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/nope")" = 404

# Bash pattern matching rather than a pipe into grep -q, since grep -q can
# close its end early and SIGPIPE the writer under pipefail.
home_status=$(curl -s -o "/tmp/smoke-home-body-$$" -w '%{http_code}' "http://127.0.0.1:$port/")
test "$home_status" = 200
home_page=$(</tmp/smoke-home-body-$$)
rm -f "/tmp/smoke-home-body-$$"
[[ "$home_page" == *'<title>MapleTip — Coming soon</title>'* ]]
[[ "$home_page" == *'Coming soon'* ]]

asset=$(printf '%s' "$home_page" | grep -o '/assets/[^"]*\.js' | head -1)
test -n "$asset"
test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port$asset")" = 200

test "$("$cli" exec "$name" id -u)" = 1000
"$cli" exec "$name" sh -c 'touch /smoke-readonly-check' 2>/dev/null && exit 1

"$cli" stop --timeout 10 "$name"
test "$("$cli" inspect --format '{{.State.ExitCode}}' "$name")" = 0
