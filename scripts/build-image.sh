#!/usr/bin/env bash
set -euo pipefail

# Phoenix Awaken OS image builder. This script only writes to the local output
# directory; it never targets a physical disk or USB device.

if ! command -v podman >/dev/null 2>&1; then
  echo "Missing podman. Install Podman in a dedicated Linux build environment." >&2
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="${IMAGE:-localhost/phoenix-awaken:dev}"
IMAGE_TYPE="${1:-iso}"
ROOTFS="${ROOTFS:-ext4}"
OUTPUT_DIR="${ROOT_DIR}/output/${IMAGE_TYPE}-${ROOTFS}"
mkdir -p "${OUTPUT_DIR}"

case "${IMAGE_TYPE}" in
  iso|qcow2|vmdk|raw) ;;
  *) echo "Unsupported image type: ${IMAGE_TYPE}. Use iso, qcow2, vmdk, or raw." >&2; exit 2 ;;
esac

if [[ "${SKIP_IMAGE_BUILD:-0}" != "1" ]]; then
  podman build --network=host --file "${ROOT_DIR}/Containerfile" --tag "${IMAGE}" "${ROOT_DIR}"
fi

if ! podman image exists "${IMAGE}"; then
  echo "Image not found: ${IMAGE}" >&2
  exit 2
fi

if ! podman image exists quay.io/centos-bootc/bootc-image-builder:latest; then
  podman pull quay.io/centos-bootc/bootc-image-builder:latest
fi

podman run --rm --privileged --network=host \
  -v "${OUTPUT_DIR}:/output" \
  -v /var/lib/containers/storage:/var/lib/containers/storage \
  quay.io/centos-bootc/bootc-image-builder:latest \
  --type "${IMAGE_TYPE}" \
  --use-librepo=True \
  --rootfs "${ROOTFS}" \
  "${IMAGE}"

printf 'Image artifacts are under %s\n' "${OUTPUT_DIR}"
