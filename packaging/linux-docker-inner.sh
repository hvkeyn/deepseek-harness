#!/usr/bin/env bash
# Runs inside debian:bullseye (glibc 2.31). Builds DeepSeek Harness from the
# read-only /src checkout and writes publishable artifacts to /out.
#
# The old base image is the point: the native addon built here loads on older
# Debian releases than one built on a current host would. Keep this script
# self-contained; it is mounted into the container, not read from the checkout.
set -euo pipefail

NODE_VERSION="${NODE_VERSION:-22.20.0}"
DEBIAN_SNAPSHOT="${DEBIAN_SNAPSHOT:-}"

export DEBIAN_FRONTEND=noninteractive

# Debian bullseye LTS ended and the live security mirror returns 404; pin the
# package archive to a snapshot when one is requested.
if [[ -n "${DEBIAN_SNAPSHOT}" ]]; then
  cat >/etc/apt/sources.list <<EOF
deb http://snapshot.debian.org/archive/debian/${DEBIAN_SNAPSHOT}/ bullseye main contrib
deb http://snapshot.debian.org/archive/debian/${DEBIAN_SNAPSHOT}/ bullseye-updates main contrib
deb http://snapshot.debian.org/archive/debian-security/${DEBIAN_SNAPSHOT}/ bullseye-security main
EOF
  echo 'Acquire::Check-Valid-Until "false";' >/etc/apt/apt.conf.d/99snapshot
  echo 'Acquire::Retries "5";' >>/etc/apt/apt.conf.d/99snapshot
fi

rm -rf /var/lib/apt/lists/*
mkdir -p /var/lib/apt/lists/partial
apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false update -qq
apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false install -y -qq --no-install-recommends \
  ca-certificates curl xz-utils git build-essential python3 file \
  >/tmp/apt.log

# Node.js official build: needs glibc >= 2.28, which bullseye provides.
case "$(dpkg --print-architecture)" in
  amd64) NODE_ARCH=x64 ;;
  arm64) NODE_ARCH=arm64 ;;
  *) echo "linux-docker-inner: unsupported architecture $(dpkg --print-architecture)" >&2; exit 1 ;;
esac
echo ">> installing Node.js ${NODE_VERSION} (${NODE_ARCH})"
curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" -o /tmp/node.tar.xz
mkdir -p /opt/node
tar -xJf /tmp/node.tar.xz -C /opt/node --strip-components=1
export PATH="/opt/node/bin:${PATH}"
corepack enable >/dev/null 2>&1 || true
node --version
echo "glibc: $(ldd --version 2>&1 | awk 'NR==1')"

# Build in the container filesystem: /src may be a host mount with a filesystem
# that does not support the symlinks and permissions pnpm relies on.
echo ">> copying checkout"
rm -rf /work
mkdir -p /work
tar -C /src \
    --exclude=node_modules --exclude=dist --exclude=dist-exe \
    --exclude=apps/desktop/.desktop-build --exclude=.dsh-build \
    --exclude=apps/desktop/.env.windows --exclude=apps/desktop/.env.macos \
    --exclude=apps/desktop/.env.linux \
    -cf - . | tar -C /work -xf -
cd /work

echo ">> pnpm install --frozen-lockfile"
corepack pnpm install --frozen-lockfile

echo ">> pnpm run build"
corepack pnpm run build

echo ">> pnpm run release:pack --family dsh"
mkdir -p /out/packed
corepack pnpm run release:pack --family dsh --out /out/packed

VERSION="$(node -p "require('/work/package.json').version")"
ARCH="$(dpkg --print-architecture)"
tar -czf "/out/deepseek-harness-${VERSION}-linux-${ARCH}-built.tar.gz" -C /work \
   --exclude=node_modules --exclude=.git --exclude=dist --exclude=apps/desktop/.desktop-build \
   --exclude=apps/desktop/.env.windows --exclude=apps/desktop/.env.macos \
   --exclude=apps/desktop/.env.linux .

echo
echo ">> artifacts"
ls -lh /out /out/packed
echo "done"
