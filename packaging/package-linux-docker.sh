#!/usr/bin/env bash
# Build DeepSeek Harness inside an old Debian image so the produced native
# artifacts link against an older glibc and load on a wide range of Debian
# releases ("universal Debian"). Mirrors the KARAT Chat packaging wrapper.
#
# Usage: packaging/package-linux-docker.sh [--pack]
# Environment:
#   LINUX_IMAGE      base image (default debian:bullseye, glibc 2.31)
#   LINUX_DOCKERFILE build a custom image instead of pulling LINUX_IMAGE
#   NODE_VERSION     Node.js runtime to install (default 22.20.0)
#   DEBIAN_SNAPSHOT  snapshot.debian.org timestamp; empty uses live mirrors
#   LINUX_OUT        host output directory (default <repo>/dist/linux)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="${LINUX_IMAGE:-debian:bullseye}"
NODE_VERSION="${NODE_VERSION:-22.20.0}"
DEBIAN_SNAPSHOT="${DEBIAN_SNAPSHOT:-20260831T000000Z}"
OUT="${LINUX_OUT:-${ROOT}/dist/linux}"
INNER="${ROOT}/packaging/linux-docker-inner.sh"

if ! command -v docker >/dev/null 2>&1; then
  echo "package-linux-docker.sh: docker is required" >&2
  exit 1
fi

mkdir -p "$OUT"

echo "Docker image : ${IMAGE}"
echo "Node.js      : ${NODE_VERSION}"
echo "Snapshot     : ${DEBIAN_SNAPSHOT:-<live mirrors>}"
echo "Output       : ${OUT}"

if ! docker image inspect "${IMAGE}" >/dev/null 2>&1; then
  echo "Pulling ${IMAGE}..."
  docker pull "${IMAGE}"
fi

docker run --rm \
  --dns 8.8.8.8 --dns 1.1.1.1 \
  -e NODE_VERSION="${NODE_VERSION}" \
  -e DEBIAN_SNAPSHOT="${DEBIAN_SNAPSHOT}" \
  -v "${ROOT}:/src:ro" \
  -v "${OUT}:/out" \
  -v "${INNER}:/inner.sh:ro" \
  "${IMAGE}" \
  bash /inner.sh

echo
echo "Artifacts in ${OUT}:"
ls -lh "${OUT}"
