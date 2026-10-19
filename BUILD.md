# Building DeepSeek Harness

This repository is a checkout of [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) that follows the upstream releases — currently `dsh-v0.2.1-rc.2` (`0.2.1-rc.2`) — with a cross-platform build system added at the root: `build.sh` for Linux/Debian, `build.bat` for Windows, and `packaging/` for a reproducible "universal Debian" build. The application itself (the `dsh` agent harness, its Web UI, and the Electron Desktop shell) is upstream code; the added scripts only orchestrate the documented upstream commands. The Linux Desktop target is the one exception: `linux-x64` in `apps/desktop/scripts/package-target.ts` is a fork-local extension, so upstream [`apps/desktop/packaging/README.md`](apps/desktop/packaging/README.md) still lists Linux as an unsupported Desktop release target.

The canonical upstream documentation remains authoritative: see `docs/development.md` for the contributor setup, [`apps/desktop/packaging/README.md`](apps/desktop/packaging/README.md) for Desktop packaging, [`apps/desktop/windows-signing/README.md`](apps/desktop/windows-signing/README.md) for signing, and [`apps/desktop/publishing/README.md`](apps/desktop/publishing/README.md) for publication.

## Prerequisites

| Need | Linux | Windows |
|---|---|---|
| Node.js | 22.19+ or 24+ (`engines` in `package.json`) | 22.19+ or 24+ (Node 24 is what upstream local and CI packaging runs) |
| pnpm | the `packageManager` pin, currently `pnpm@11.28.5` | same |
| Git | 2.26 or newer | 2.26 or newer |
| C/C++ toolchain | `build-essential` | Visual C++ Build Tools with a Windows SDK |
| Python | `python3` | Python 3; set `PYTHON` when it is absent from `PATH` |
| Other tools | `curl`, `xz-utils`, `file` | PowerShell 7, `tar` |

`corepack enable` resolves the pinned pnpm when `pnpm --version` does not already answer; `build.sh` and `build.bat` fall back to `npx --yes pnpm@11.28.5` when Corepack is missing. Git 2.26 or newer is required on both platforms because `pnpm install` runs the worktree-local Lefthook hook setup. The C/C++ toolchain and Python 3 are needed for the native addon (`pnpm run build:native-system`), for dependencies that compile at install time, and on Windows for the installer's native helper.

Only the Desktop steps add requirements. Windows produces the unsigned installer without any EV certificate or upload credentials. Linux needs Electron's runtime shared libraries, listed under [Linux Desktop (AppImage)](#linux-desktop-appimage), and an x64 build host.

## Windows

Run the batch entry point from the repository root:

```
build.bat
```

Options: `--desktop` also produces an unsigned Desktop installer through `pnpm run package:desktop:win:x64:unsigned` and copies the `.exe` into `dist\win`; it requires `apps/desktop/.env.windows` (copy `apps/desktop/.env.windows.example` and fill in `DSH_DESKTOP_APP_ID`, the mandatory-update policy settings including a real HTTPS origin, and `DOWNLOAD_TEST_RELEASE_ID`). `--pack` also emits the publishable `dsh` npm tarballs into `dist\packed`; `--no-install` reuses an existing `node_modules`.

Run `build.bat --desktop` on a Windows x64 host. Packaging needs network access to npm, GitHub release assets, and nodejs.org; stage logs stay under `apps\desktop\.desktop-build\packaging-runs\`. Add `--check` to `pnpm run package:desktop:win:x64:unsigned` to validate configuration and tooling without building.

Upstream also supports a machine-preset mode for CI-style runs: `DSH_PACKAGING_CONFIG_DIR` names an absolute directory holding `presets/<test|production>.env` and `secrets/windows-signing.env`, and `DSH_PACKAGING_PRESET` selects the preset. A missing preset file fails instead of falling back to `.env.windows`; unsigned and preparation-only runs never read the signing file. `build.bat` uses the dotenv path and needs no preset.

## Linux and Debian

Run the shell entry point from the repository root:

```
./build.sh
```

The same options are available: `--desktop`, `--pack`, `--bundle`, and `--no-install`. `--bundle` writes a `dist/deepseek-harness-<version>-linux-<arch>.tar.gz` archive of the built tree. `--desktop` builds the Linux Desktop AppImage and copies it to `dist/linux-desktop`; it requires `apps/desktop/.env.linux` (copy `apps/desktop/.env.linux.example`) and the Electron runtime libraries listed below.

The script installs dependencies with `pnpm install --frozen-lockfile` and then runs the complete repository build with `pnpm run build`. Both steps are exactly the upstream commands; the script only adds prerequisite checks and output placement.

## Linux Desktop (AppImage)

The Desktop application builds as a Linux x64 AppImage through the upstream Electron release pipeline, extended here with a `linux-x64` target. Build it from a Linux x64 host (native Debian/Ubuntu or WSL 2):

```
cp apps/desktop/.env.linux.example apps/desktop/.env.linux
./build.sh --desktop
```

`pnpm run package:desktop:linux:x64` is the underlying command; `pnpm run package:desktop:linux:x64:dir` stops at the unpacked application. The AppImage lands in `apps/desktop/.desktop-build/targets/linux-x64/artifacts/` and is copied to `dist/linux-desktop`.

Building and smoking the packaged application runs the Electron binary, so the build host needs Electron's shared libraries. On Debian/Ubuntu:

```
sudo apt install libnss3 libnspr4 libgbm1 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libpango-1.0-0 libcairo2 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgtk-3-0 libatspi2.0-0 libasound2
```

On Ubuntu 24.04 and later the ATK, CUPS, GTK, AT-SPI and ALSA packages carry the `t64` suffix.

Linux packages `asar` disabled so the runtime is a plain directory (`resources/app`). Electron's ASAR file system reports the missing `@deepseek-ai/libreoffice-kit-linux-x64-glibc` engine as present, which makes the Office kit throw instead of falling back to its bundled WASM engine; unpacked files avoid that false positive and let DOCX, XLSX and PPTX conversion run.

`apps/desktop/.env.linux` owns release settings for the target (never the shell); `DSH_DESKTOP_APP_ID` is required and the npm registry may be overridden. Linux carries no mandatory-update policy, so no update origin is configured and the packaged shell does not restrict its platform at startup. Packaging writes no release completion record, `--build-version auto` is rejected, and the upload commands cannot publish a Linux artifact.

## Universal Debian build (old glibc)

A build produced on a current distribution links against that distribution's glibc and may not start on older Debian releases. To target a wide range of systems, build inside an old Debian image:

```
./build.sh --docker
```

This delegates to `packaging/package-linux-docker.sh`, which runs `packaging/linux-docker-inner.sh` inside `debian:bullseye` (glibc 2.31). The inner script pins `apt` to a `snapshot.debian.org` archive because bullseye's live mirrors have expired, installs Node.js from the official Linux build, copies the checkout into the container filesystem (so pnpm's symlinks and permissions are preserved off a bind mount), and writes the results to `dist/linux`. Docker on the host is the only extra requirement; the container installs its own toolchain.

Environment overrides: `LINUX_IMAGE` (base image), `NODE_VERSION` (Node.js runtime), `DEBIAN_SNAPSHOT` (snapshot timestamp; empty uses live mirrors), and `LINUX_OUT` (host output directory).

## Debian rootfs build without Docker

When Docker is unavailable, `packaging/package-linux-debootstrap.sh` builds the same way with `debootstrap`: it creates a Debian rootfs, installs the toolchain and Electron runtime libraries, and builds the AppImage inside it. Run it as root from a Linux host:

```
sudo packaging/package-linux-debootstrap.sh
```

By default it targets Debian 12 (`bookworm`, glibc 2.36) and writes the AppImage to `dist/linux-bookworm`. Because the native addons compile against that release's glibc, the AppImage starts on Debian 12 and newer. Overrides: `SUITE` (Debian release), `DEBIAN_MIRROR`, `NODE_VERSION`, `ROOTFS`, and `LINUX_OUT`. `./build.sh --desktop` builds against the running distribution instead (for example Ubuntu 24.04), so use this script when the target is Debian 12.

## Artifacts

`dist/packed` holds the publishable `@deepseek-ai/dsh` npm tarballs produced by `pnpm run release:pack --family dsh`. `dist/linux` holds the Docker build output, `dist/linux-bookworm` the debootstrap output, `dist/linux-desktop` the Linux Desktop AppImage, and `dist/win` the Windows Desktop installer. Distribute or install the npm tarballs with `npm i -g ./dist/packed/deepseek-ai-dsh-*.tgz`, then run `dsh web`.

The archive and rootfs builders exclude `node_modules`, `dist`, the Desktop build directories, and every `apps/desktop/.env.*` release file, so a produced tarball never carries local credentials.

## Running

From a source checkout, build once and launch the Web UI:

```
pnpm run build
pnpm dsh web
```

On Windows the equivalent is `build.bat` followed by `pnpm dsh web`.

## Desktop platform support

The upstream Desktop release pipeline supports macOS and Windows x64. `apps/desktop/scripts/package-target.ts` defines the fixed targets `mac-arm64`, `mac-x64`, `win-x64`, and the fork-local `linux-x64`, and its host checks require a matching build host (Linux x64 for `linux-x64`). `build.bat --desktop` produces the unsigned Windows installer for local testing, which needs no EV token; `build.sh --desktop` produces the Linux AppImage. `dsh web` and `dsh` run on Linux without a Desktop installer as well.

## Updating from upstream

This checkout follows upstream releases instead of merging them: the fork owns one commit holding the released tree plus the local build changes. An update replaces that tree and re-applies the delta, which the previous fork commit still describes because the release tree sits beside it in the same repository:

```
git remote add upstream https://github.com/deepseek-ai/deepseek-harness.git   # once
git fetch --depth=1 upstream tag dsh-v<version>
git diff FETCH_HEAD HEAD > /tmp/fork-delta.patch
git checkout -f FETCH_HEAD
git apply --3way /tmp/fork-delta.patch
pnpm run clean
```

`pnpm run clean` is required, not optional: a package that upstream deleted keeps its ignored `lib/` output in the checkout, and a bundle step that still resolves that residue fails with a missing-export error against the new source. Resolve the conflicts `git apply --3way` reports, rebuild, then publish the new state as the next single commit (`git checkout --orphan`, `git add -A`, `git commit`).

## Continuous integration

`.github/workflows/build-app.yml` builds the application on a `debian:bookworm` container and on `windows-latest` and uploads the resulting `dist/` trees, so a change that breaks either platform's build is caught before merge. Both jobs pin the same Node 22 and the `packageManager` pnpm version as the local scripts.
