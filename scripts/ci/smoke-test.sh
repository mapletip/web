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
# Rejected Monster build slugs and the removed demo route are deterministic and
# never touch the network; valid catalog pages need the live pinned release, so
# those are verified in the explicit integration step instead.
test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/maplestory/unknown/monsters")" = 404
test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/maplestory/cw-launch/monsters")" = 404
test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/demo/faceted-browser")" = 404

# Bash pattern matching rather than a pipe into grep -q, since grep -q can
# close its end early and SIGPIPE the writer under pipefail.
home_status=$(curl -s -o "/tmp/smoke-home-body-$$" -w '%{http_code}' "http://127.0.0.1:$port/")
test "$home_status" = 200
home_page=$(</tmp/smoke-home-body-$$)
rm -f "/tmp/smoke-home-body-$$"

# Root-layout structure shared by every route (skip link + its target, and
# the header's brand mark), not page-specific copy that will change.
[[ "$home_page" == *'<a class="skip-to-main" href="#main-content">Skip to content</a>'* ]]
[[ "$home_page" == *'id="main-content"'* ]]
[[ "$home_page" == *'/brand/mapletip-mark.svg'* ]]

# A herestring avoids piping between two processes, so there's nothing to
# SIGPIPE under pipefail. `-m1` only caps matching *lines*, and this HTML is
# one line, so take the first match with bash parameter expansion instead
# of piping grep's (possibly multi-match) output into `head -1`.
assets=$(grep -o '/assets/[^"]*\.js' <<<"$home_page")
asset=${assets%%$'\n'*}
test -n "$asset"
test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port$asset")" = 200

test "$("$cli" exec "$name" id -u)" = 1000
"$cli" exec "$name" sh -c 'touch /smoke-readonly-check' 2>/dev/null && exit 1

"$cli" stop --timeout 10 "$name"
test "$("$cli" inspect --format '{{.State.ExitCode}}' "$name")" = 0
