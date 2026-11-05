#!/usr/bin/env bash
# Smoke tests a single-architecture mapletip/web container image, whether it
# was built locally (PR feedback) or pulled by digest from GHCR (publish
# jobs). Shared so both paths exercise identical checks.
set -euo pipefail

image="$1"
port="${2:-18087}"
name="web-smoke-$$"

docker run --detach --name "$name" \
  --read-only --cap-drop=ALL --security-opt=no-new-privileges \
  --user 1000:1000 -e PORT=8087 -p "$port:8087" \
  "$image"
trap 'docker logs "$name" || true; docker rm -f "$name" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 30); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/api/healthz")" = 200 ]; then
    break
  fi
  sleep 1
done

test "$(curl -s "http://127.0.0.1:$port/api/healthz")" = ok
curl -s -D "/tmp/smoke-health-headers-$$" -o /dev/null "http://127.0.0.1:$port/api/healthz"
grep -qi '^cache-control: no-store' "/tmp/smoke-health-headers-$$"
test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/")" = 200
test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/nope")" = 404

asset=$(curl -s "http://127.0.0.1:$port/" | grep -o '/assets/[^"]*\.js' | head -1)
test -n "$asset"
test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port$asset")" = 200

test "$(docker exec "$name" id -u)" = 1000

docker stop --timeout 10 "$name"
test "$(docker inspect --format '{{.State.ExitCode}}' "$name")" = 0
