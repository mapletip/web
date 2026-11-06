#!/usr/bin/env bash
# Attaches a verified candidate digest to its selectable production tag,
# only after confirming the tag is either absent or already points at that
# same digest, and confirms afterward that it actually landed.
set -euo pipefail

ref="$1"
candidate_digest="$2"

# A nonzero exit from `oras resolve` means either "no such tag" (expected
# on a first publish) or an unrelated failure (auth, connectivity, timeout,
# 5xx). Only the former is safe to treat as "create the tag"; anything else
# must fail closed rather than risk a duplicate or missing promotion.
set +e
resolved=$(oras resolve "$ref" 2>&1)
resolve_status=$?
set -e

if [ "$resolve_status" -eq 0 ]; then
  if [ "$resolved" != "$candidate_digest" ]; then
    echo "Release $ref already exists and points at a different digest ($resolved); refusing to overwrite it." >&2
    exit 1
  fi
  echo "Release $ref already points at the verified digest; nothing to do."
elif [[ "$resolved" == *"${ref}: not found"* ]]; then
  echo "$resolved"
  oras tag "${ref%:*}@${candidate_digest}" "${ref##*:}"
else
  echo "$resolved" >&2
  echo "Could not determine whether $ref already exists; refusing to publish." >&2
  exit 1
fi

# Confirm the tag actually landed on the expected digest, rather than
# assuming an ambiguous network outcome succeeded.
final_digest=$(oras resolve "$ref")
test "$final_digest" = "$candidate_digest"
