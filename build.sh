#!/usr/bin/env bash
# Build DeepSeek Harness from source on Linux (Debian/Ubuntu).
#
# Mirrors the build ergonomics of the KARAT Chat project: one entry script that
# installs dependencies, builds the shipped artifacts, and optionally packages.
# For a Debian release that runs on older systems (universal Debian, old glibc)
# use --docker, which builds inside debian:bullseye via packaging/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

DO_DESKTOP=0
DO_PACK=0
DO_DOCKER=0
DO_BUNDLE=0
SKIP_INSTALL=0

usage() {
  cat <<'EOF'
Usage: ./build.sh [options]

  (no options)    install dependencies and run the complete repository build
  --desktop       additionally package the Desktop AppImage (Linux) or installer
                  (Windows/macOS build hosts; Windows uses build.bat)
  --pack          additionally produce the publishable dsh npm tarballs
  --bundle        additionally tar the built tree into dist/ (portable archive)
  --docker        build on Debian bullseye in Docker (universal Debian); implies
                  install + build + pack inside the container
  --no-install    reuse an existing node_modules instead of running pnpm install
  -h, --help      show this help

Outputs land in dist/.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --desktop) DO_DESKTOP=1 ;;
    --pack) DO_PACK=1 ;;
    --bundle) DO_BUNDLE=1 ;;
    --docker) DO_DOCKER=1 ;;
    --no-install) SKIP_INSTALL=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "build.sh: unknown option '$arg'" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ "$DO_DOCKER" -eq 1 ]]; then
  exec "${ROOT}/packaging/package-linux-docker.sh" "$@"
fi

# --- prerequisites -----------------------------------------------------------

if ! command -v node >/dev/null 2>&1; then
  echo "build.sh: Node.js is required (22.19+ or 24+). Install it from https://nodejs.org/" >&2
  exit 1
fi

NODE_VERSION="$(node -p 'process.versions.node')"
NODE_MAJOR="${NODE_VERSION%%.*}"
NODE_REST="${NODE_VERSION#*.}"
NODE_MINOR="${NODE_REST%%.*}"
if ! { [[ "$NODE_MAJOR" -eq 22 && "$NODE_MINOR" -ge 19 ]] || [[ "$NODE_MAJOR" -ge 24 ]]; }; then
  echo "build.sh: Node.js ${NODE_VERSION} is unsupported; the repository requires 22.19+ or 24+" >&2
  exit 1
fi
echo "Node.js ${NODE_VERSION}"

PNPM=()
if command -v pnpm >/dev/null 2>&1; then
  PNPM=(pnpm)
elif command -v corepack >/dev/null 2>&1; then
  corepack enable pnpm >/dev/null 2>&1 || true
  PNPM=(corepack pnpm)
elif command -v npx >/dev/null 2>&1; then
  PNPM=(npx --yes pnpm@11.28.5)
else
  echo "build.sh: pnpm is required. Run 'corepack enable' with Node.js 22+ installed." >&2
  exit 1
fi

VERSION="$(node -p "require('./package.json').version")"
ARCH="$(uname -m)"
echo "DeepSeek Harness ${VERSION} (${ARCH})"

mkdir -p dist

# --- build -------------------------------------------------------------------

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  echo ">> pnpm install --frozen-lockfile"
  "${PNPM[@]}" install --frozen-lockfile
fi

if [[ "$DO_PACK" -eq 1 ]]; then
  # The official client profile embeds the source commit and the product version,
  # which are also what mark the artifacts as this fork's edition. A caller may
  # supply the commit: a container checkout belongs to another user, so Git
  # refuses to read it even though the sources are present.
  if [[ -z "${DSH_CLIENT_COMMIT_HASH:-}" ]]; then
    if ! PACK_COMMIT="$(git rev-parse --short HEAD 2>/dev/null)"; then
      echo "build.sh: --pack needs the packed commit; set DSH_CLIENT_COMMIT_HASH when Git cannot read this checkout." >&2
      exit 1
    fi
    export DSH_CLIENT_COMMIT_HASH="$PACK_COMMIT"
  fi
  export DSH_CLIENT_VERSION="$VERSION"
  echo ">> pnpm run build:official"
  "${PNPM[@]}" run build:official
else
  echo ">> pnpm run build"
  "${PNPM[@]}" run build
fi

# --- packaging ---------------------------------------------------------------

if [[ "$DO_PACK" -eq 1 ]]; then
  # The pack fans out over the workspace: the publish-order file keeps the family order.
  PACK_CONCURRENCY="${DSH_PACK_CONCURRENCY:-4}"
  echo ">> pnpm run release:pack --family dsh --concurrency ${PACK_CONCURRENCY}"
  mkdir -p "dist/packed"
  "${PNPM[@]}" run release:pack --family dsh --out "dist/packed" --concurrency "${PACK_CONCURRENCY}"
fi

if [[ "$DO_BUNDLE" -eq 1 ]]; then
  BUNDLE="dist/deepseek-harness-${VERSION}-linux-${ARCH}.tar.gz"
  echo ">> tar ${BUNDLE}"
  tar --exclude=.git --exclude=apps/desktop/.desktop-build --exclude=dist \
      --exclude=apps/desktop/.env.windows --exclude=apps/desktop/.env.macos \
      --exclude=apps/desktop/.env.linux \
      -czf "$BUNDLE" -C "$ROOT" .
fi

if [[ "$DO_DESKTOP" -eq 1 ]]; then
  if [[ ! -f "apps/desktop/.env.linux" ]]; then
    echo "build.sh: Desktop packaging needs apps/desktop/.env.linux" >&2
    echo "          Copy apps/desktop/.env.linux.example to .env.linux and set DSH_DESKTOP_APP_ID." >&2
    exit 1
  fi
  echo ">> pnpm run package:desktop:linux:x64"
  "${PNPM[@]}" run package:desktop:linux:x64
  shopt -s nullglob
  appimages=(apps/desktop/.desktop-build/targets/linux-x64/artifacts/*.AppImage)
  shopt -u nullglob
  if (( ${#appimages[@]} > 0 )); then
    mkdir -p dist/linux-desktop
    cp -f "${appimages[@]}" dist/linux-desktop/
    echo ">> AppImage(s) copied to dist/linux-desktop"
  fi
fi

echo
echo "Done. Run the Web UI with:"
echo "  ${PNPM[*]} dsh web"
