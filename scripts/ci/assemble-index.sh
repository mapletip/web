#!/usr/bin/env bash
# Assembles the multiarch index from the two already-verified per-platform
# digests only (never a mutable tag), then re-reads it back from the
# registry to confirm the descriptors it actually contains match. Run from
# the directory containing one file per digest (named by hex digest, as
# `actions/download-artifact` with merge-multiple produces). Prints the
# resulting index digest to stdout.
set -euo pipefail

sha="$1"
tag="sha-${sha:0:12}"

images=()
for digest in *; do
  [[ "$digest" =~ ^[a-f0-9]{64}$ ]]
  images+=("ghcr.io/mapletip/web@sha256:${digest}")
done
test "${#images[@]}" = 2

docker buildx imagetools create \
  --tag "ghcr.io/mapletip/web:${tag}" \
  --annotation "index:org.opencontainers.image.revision=${sha}" \
  "${images[@]}"

inspect=$(docker buildx imagetools inspect "ghcr.io/mapletip/web:${tag}" --raw)
digest=$(docker buildx imagetools inspect "ghcr.io/mapletip/web:${tag}" --format '{{json .Manifest.digest}}' | tr -d '"')

# Reject a malformed index digest before it can reach the release payload.
[[ "$digest" =~ ^sha256:[a-f0-9]{64}$ ]]

revision=$(echo "$inspect" | jq -r '.annotations["org.opencontainers.image.revision"] // ""')
test "$revision" = "$sha"

# Exactly the two tested platforms, exactly once each, no extra or
# substitute manifests (attestations, duplicate arches, etc).
manifest_count=$(echo "$inspect" | jq '.manifests | length')
test "$manifest_count" = 2

for arch in amd64 arm64; do
  count=$(echo "$inspect" | jq --arg arch "$arch" \
    '[.manifests[] | select(.platform.os == "linux" and .platform.architecture == $arch)] | length')
  test "$count" = 1
done

# The index references exactly the two already-tested digests, not a
# substituted one.
for image in "${images[@]}"; do
  tested_digest="${image#*@}"
  count=$(echo "$inspect" | jq --arg digest "$tested_digest" '[.manifests[] | select(.digest == $digest)] | length')
  test "$count" = 1
done

echo "$digest"
