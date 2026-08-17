#!/usr/bin/env bash
set -euo pipefail

# Phoenix Awaken OS image scaffold.
# The script fails closed when required image tooling is unavailable.

if ! command -v podman >/dev/null 2>&1; then
  echo "Missing podman. Install Podman in a dedicated Fedora/Ubuntu build environment." >&2
  exit 2
fi

if ! command -v bootc-image-builder >/dev/null 2>&1; then
  echo "Missing bootc-image-builder. Install it before producing a disk image or ISO." >&2
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="localhost/phoenix-awaken-os:dev"
OUTPUT_DIR="${ROOT_DIR}/output"
mkdir -p "${OUTPUT_DIR}"

podman build --file "${ROOT_DIR}/Containerfile" --tag "${IMAGE}" "${ROOT_DIR}"

# The exact image-builder type and filesystem configuration will be selected
# after validating the first image in a virtual machine. Never point this at a
# physical disk without explicit operator review.
podman run --rm --privileged \
  -v "${OUTPUT_DIR}:/output" \
  -v /var/lib/containers/storage:/var/lib/containers/storage \
  quay.io/bootc-org/bootc-image-builder:latest \
  --type qcow2 \
  --local \
  "${IMAGE}"

printf 'Image artifacts are under %s\n' "${OUTPUT_DIR}"
