#!/usr/bin/env bash
# Build the Linux Desktop AppImage inside an age-pinned Debian rootfs created with
# debootstrap, without Docker. The resulting native artifacts link against that
# Debian release's glibc, so the AppImage also starts on that release and newer.
#
# Usage (as root): packaging/package-linux-debootstrap.sh
# Environment:
#   SUITE         Debian release to build against (default bookworm = Debian 12)
#   DEBIAN_MIRROR Debian archive mirror (default http://deb.debian.org/debian)
#   NODE_VERSION  Node.js runtime installed in the rootfs (default 22.20.0)
#   ROOTFS        Rootfs directory (default /opt/dsh-rootfs-$SUITE)
#   LINUX_OUT     Host output directory (default <repo>/dist/linux-$SUITE)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SUITE="${SUITE:-bookworm}"
MIRROR="${DEBIAN_MIRROR:-http://deb.debian.org/debian}"
NODE_VERSION="${NODE_VERSION:-22.20.0}"
ROOTFS="${ROOTFS:-/opt/dsh-rootfs-$SUITE}"
OUT="${LINUX_OUT:-${ROOT}/dist/linux-$SUITE}"
BUILD_ROOT="/build/dsh"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "package-linux-debootstrap.sh: must run as root" >&2
  exit 1
fi

HOST_ARCH="$(dpkg --print-architecture)"
case "$HOST_ARCH" in
  amd64) NODE_ARCH=x64; DEB_ARCH=amd64 ;;
  arm64) NODE_ARCH=arm64; DEB_ARCH=arm64 ;;
  *) echo "package-linux-debootstrap.sh: unsupported host architecture $HOST_ARCH" >&2; exit 1 ;;
esac

# Electron's runtime shared libraries; names differ on Ubuntu 24.04 (t64 rename).
ELECTRON_LIBS="libnss3 libnspr4 libgbm1 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
libxfixes3 libxrandr2 libpango-1.0-0 libcairo2 libatk1.0-0 libatk-bridge2.0-0 \
libcups2 libgtk-3-0 libatspi2.0-0 libasound2"

echo "Suite          : ${SUITE}"
echo "Mirror         : ${MIRROR}"
echo "Rootfs         : ${ROOTFS}"
echo "Node.js        : ${NODE_VERSION}"
echo "Output         : ${OUT}"

echo ">> installing debootstrap on the host"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq debootstrap >/dev/null

if [[ ! -x "${ROOTFS}/bin/sh" ]]; then
  echo ">> debootstrap ${SUITE}"
  debootstrap --arch="${DEB_ARCH}" --variant=minbase "${SUITE}" "${ROOTFS}" "${MIRROR}"
fi

cleanup() {
  for mount in dev/pts dev proc sys; do
    umount "${ROOTFS}/${mount}" 2>/dev/null || true
  done
}
trap cleanup EXIT

echo ">> mounting pseudofilesystems"
mount --bind /dev "${ROOTFS}/dev" 2>/dev/null || true
mkdir -p "${ROOTFS}/dev/pts"
mount --bind /dev/pts "${ROOTFS}/dev/pts" 2>/dev/null || true
mount -t proc proc "${ROOTFS}/proc" 2>/dev/null || true
mount -t sysfs sys "${ROOTFS}/sys" 2>/dev/null || true
cp /etc/resolv.conf "${ROOTFS}/etc/resolv.conf"

mkdir -p "${OUT}"
rm -rf "${ROOTFS}${BUILD_ROOT}"
mkdir -p "${ROOTFS}${BUILD_ROOT}"
echo ">> copying checkout into the rootfs"
tar -C "${ROOT}" \
  --exclude=node_modules --exclude=dist --exclude=dist-exe --exclude=.desktop-build \
  --exclude=.git --exclude=apps/desktop/.desktop-build \
  --exclude=apps/desktop/.env.windows --exclude=apps/desktop/.env.macos \
  --exclude=apps/desktop/.env.linux \
  -cf - . | tar -C "${ROOTFS}${BUILD_ROOT}" -xf -

cat > "${ROOTFS}/build/build.sh" <<EOF
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
export PATH=/opt/node/bin:\$PATH
echo ">> apt: toolchain and Electron runtime libraries"
apt-get update -qq
apt-get install -y -qq --no-install-recommends \
  ca-certificates curl xz-utils git build-essential python3 file ${ELECTRON_LIBS} >/dev/null
echo ">> installing Node.js ${NODE_VERSION}"
curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" -o /tmp/node.tar.xz
mkdir -p /opt/node
tar -xJf /tmp/node.tar.xz -C /opt/node --strip-components=1
corepack enable >/dev/null 2>&1 || true
node --version
ldd --version 2>&1 | awk 'NR==1'
cd ${BUILD_ROOT}
cp apps/desktop/.env.linux.example apps/desktop/.env.linux
git init -q
git add -A
git -c user.email=build@dsh -c user.name=build commit -qm build
echo ">> pnpm install --frozen-lockfile"
corepack pnpm install --frozen-lockfile
echo ">> package:desktop:linux:x64"
corepack pnpm run package:desktop:linux:x64
EOF

echo ">> building inside the ${SUITE} rootfs"
chroot "${ROOTFS}" /bin/bash /build/build.sh

echo ">> collecting artifacts"
cp -f "${ROOTFS}${BUILD_ROOT}"/apps/desktop/.desktop-build/targets/linux-x64/artifacts/*.AppImage "${OUT}/"
ls -lh "${OUT}"
