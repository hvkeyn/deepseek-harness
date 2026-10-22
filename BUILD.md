# Building DeepSeek Harness

This repository is a checkout of [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) that follows the upstream releases — currently `dsh-v0.2.1-rc.2` (`0.2.1-rc.2`) — with a cross-platform build system added at the root: `build.sh` for Linux/Debian, `build.bat` for Windows, and `packaging/` for a reproducible "universal Debian" build. The application itself (the `dsh` agent harness, its Web UI, and the Electron Desktop shell) is upstream code; the added scripts only orchestrate the documented upstream commands. The Linux Desktop target is the one exception: `linux-x64` in `apps/desktop/scripts/package-target.ts` is a fork-local extension, so upstream [`apps/desktop/packaging/README.md`](apps/desktop/packaging/README.md) still lists Linux as an unsupported Desktop release target.

The canonical upstream documentation remains authoritative: see `docs/development.md` for the contributor setup, [`apps/desktop/packaging/README.md`](apps/desktop/packaging/README.md) for Desktop packaging, [`apps/desktop/windows-signing/README.md`](apps/desktop/windows-signing/README.md) for signing, and [`apps/desktop/publishing/README.md`](apps/desktop/publishing/README.md) for publication.

The official client build marks the sidebar name with an `HVKeyn Edition` badge. The Desktop welcome window shows the same marker beside its wordmark, and every Windows installer page carries it: `apps/desktop/scripts/installer-brand-badge.ps1` paints the pill into the installer artwork while the native resources are prepared, on the wordmark line and under the uninstaller's card. `--pack` and the Desktop packaging build that official profile, and `--pack` supplies the source commit and product version it embeds. A plain `pnpm run build` remains a local build: it keeps the shell's local-build label and shows no badge.

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

### Windows version and signature

The Desktop application runs on Windows 10 and newer. It ships Electron 44 (Chromium 140), while Electron 22 was the last major that supported Windows 7, 8, and 8.1 ([deprecation notice](https://www.electronjs.org/blog/windows-7-to-8-1-deprecation-notice)); the bundled runtime also needs Node 22 or newer, which does not run on those systems. A Windows 7 build would require an Electron ≤22 fork of the whole application, so these scripts do not produce one.

The installer is built unsigned because Windows trusts a signature only from a certificate a public CA issued after an identity check; upstream's release pipeline holds that as an EV token, and a local checkout cannot create it. `packaging/sign-windows-selfsigned.ps1` instead generates a self-signed code-signing certificate, signs the installer, and exports the public certificate:

```
powershell -ExecutionPolicy Bypass -File packaging\sign-windows-selfsigned.ps1 -File dist\win\deepseek-harness-<version>-win-x64.exe
```

That signature covers the file's bytes, but Windows reports "Unknown publisher" until the exported `.cer` is installed under Trusted Root Certification Authorities on the machine that should accept it. Signing after packaging also invalidates the electron-builder blockmap, so regenerate it before an artifact feeds an update channel.

### Updates from this fork's releases

An unsigned build ships no update feed unless the deployment names one, because there is no signing identity to check a downloaded installer against. `DSH_DESKTOP_UPDATE_FEED_URL` supplies one: it takes an absolute HTTPS location, replaces the packaged feed URL, and is written into `resources/app-update.yml` together with the channel. This fork points it at its own releases:

```
DSH_DESKTOP_UPDATE_FEED_URL=https://github.com/hvkeyn/deepseek-harness/releases/latest/download/
```

A build made with that setting emits `nightly.yml` (the `nightly` channel is the only one an `-rc` version may use) and a `.exe.blockmap` beside the installer. Publish both with the installer itself: `nightly.yml` records the installer's size and SHA-512, so the yml and the executable must come from the same build. The installed application then reads `<feed>/nightly.yml`, compares versions, and downloads the next release when one appears; without the yml it reports that the application has no packaged update source.

#### Cutting a release that installed copies can update to

The updater compares semantic versions, so a rebuild of the same version never reaches anyone: raise the version first. The repository owns one family version for all 343 packages, and the bump tool rewrites and commits it together:

```
pnpm run release:dsh 0.2.2          # patch | minor | major | x.y.z
pnpm exec tsx scripts/release/verify.ts --family dsh
```

Then build, sign, and publish under a tag named after the version:

```
build.bat --desktop                              # produces dist\win\deepseek-harness-0.2.2-win-x64-unsigned.exe
new-item -itemtype directory dist\release-0.2.2
copy dist\win\deepseek-harness-0.2.2-win-x64-unsigned.exe dist\release-0.2.2\
powershell packaging\sign-windows-selfsigned.ps1 -File dist\release-0.2.2\deepseek-harness-0.2.2-win-x64-hvkeyn-signed.exe -CertificateOut dist\release-0.2.2\deepseek-harness-0.2.2-win-x64-hvkeyn-signed.cer
```

Copy `nightly.yml` and the `.exe.blockmap` from `apps/desktop/.desktop-build/targets/win-x64/unsigned-artifacts/`, write `SHA256SUMS.txt` over the release directory, then create the release and upload every file from it:

```
gh release create binaries-0.2.2 -R hvkeyn/deepseek-harness --title "HVKeyn Edition 0.2.2" --notes-file notes.md dist\release-0.2.2\* apps\desktop\.desktop-build\targets\win-x64\unsigned-artifacts\nightly.yml
```

Keep the release a normal (not prerelease) release: `releases/latest/download/nightly.yml` only resolves through the newest normal release, and that URL is what installed builds poll. An installed copy of an older version then offers the update by itself.

### Windows 7 clients

A Windows 7 machine cannot run the Desktop application, but it can drive a harness that runs elsewhere: the Web UI is the whole product, and every tool, terminal, and file operation executes on the Host. Run the Host on a supported machine and open its address from the Windows 7 client:

```
dsh web --host 192.168.1.20 --port 7766 --public-url http://192.168.1.20:7766 --trusted-host 192.168.1.20:7766
```

`--host` takes one concrete address of a local interface (wildcards are rejected), and the command prints the URL carrying the session token; open it on the client. For a shared network, add `--tls-cert`/`--tls-key` and an `https://` `--public-url`.

The browser must satisfy the client's ES2022 build target plus the ES2023/ES2024 built-ins the bundles call. `apps/web/src/compat.ts` installs the missing ones (`Promise.withResolvers`, `Array.prototype.toSorted` and `toReversed`, `URL.canParse`) before any client module evaluates, which leaves the final browsers that still run on Windows 7 usable: Chrome or Edge 109, and Firefox 115 ESR. Firefox ESR keeps receiving security fixes; Chrome 109 does not. Treat the client machine as untrusted and keep the Host on a network you control.

Styling is the remaining gap, and it is cosmetic rather than structural: the built stylesheet uses `:has()` fifteen times and `color-mix()` ten times. Firefox 115 supports `color-mix()` but not `:has()`, and Chrome 109 supports `:has()` but not `color-mix()`, so conditional states or computed colors degrade. Closing that gap means replacing those selectors and color expressions with older equivalents, which this fork has not done yet.

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

## Build time

The release pack is the longest single step: it turns every workspace package into a tarball. `build.sh` and `build.bat` now pass `--concurrency 4` (override with `DSH_PACK_CONCURRENCY`), and the Desktop packaging packs the runtime it bundles concurrently as well (`DSH_DESKTOP_WINDOWS_PACK_CONCURRENCY`, default 4; macOS keeps `DSH_DESKTOP_MACOS_PACK_CONCURRENCY`). On the workstation this fork was built on, the 343-package pack dropped from 683 s to 91 s with byte-identical tarball contents, and the publish-order file keeps the family order, so only wall-clock time changes.

For iteration, `pnpm run build:artifacts` skips the aggregate checks, a packaging run records every stage under `apps/desktop/.desktop-build/packaging-runs/`, and `pnpm run package:desktop:win:x64:dir` stops after the unpacked application instead of building the installer.

Two more levers are built in. `build.sh --desktop` and `build.bat --desktop` alone skip the publishable tarball set, so an installer-only rebuild does not pay for it. The Desktop runtime installs its pinned package set with `--prefer-offline`, and the Debian CI job caches the pnpm store, so a repeat build resolves from disk instead of re-downloading hundreds of packages; a cold runtime install was measured at 452 s against 113 s warm.

The runtime preparation keeps pnpm's store and registry-metadata cache under the target's build root (`apps/desktop/.desktop-build/targets/<target>/pnpm-store` and `pnpm-cache`) instead of a temporary directory that each run discarded. The installed tree stays disposable, so only fetched inputs are reused: `pnpm run clean` removes both along with the rest of `.desktop-build`. Measured on the same machine, `prepare:dsh` went from 499 s on an empty cache to 282 s on a repeat run, with `runtime:lockfile` dropping from 234 s to 95 s and `runtime:install` from 94 s to 22 s.

The descriptor that seals the runtime is hashed concurrently since this fork added `writeDesktopRuntimeAsync` for the production path, which cut that stage from about 140 s to the cost of eight parallel readers.

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

## Harness bundles (fork-local)

A harness bundle is one harness stored as a directory an editor can rewrite as a unit: `harness.json`, `system-prompt.md`, `skills/<name>/SKILL.md`, `subagents/<name>.md`, `scripts/<name>.<ts|mjs|cjs|js|py|sh>`, and an optional `cordis.patch.yml`. The surface and its checks port the editable-harness idea of [Harness²](https://github.com/google-research/harness2) (Apache-2.0); no code is copied, and nothing here is wired into a shipped profile yet.

```
pnpm run harness:bundle validate path/to/bundle
pnpm run harness:bundle diff path/to/old path/to/new
pnpm run harness:bundle summary path/to/bundle
```

Validation rejects a bundle that escapes its directory, carries a credential-shaped file or `node_modules`, declares an off-surface component, or exceeds the per-file and total limits. Every problem is reported at once, with the path that raised it, so a retry loop can feed the message back verbatim. `diff` compares two bundles by content and `summary` reports the component census plus the always-on characters — the text every request pays for.

## Continuous integration

`.github/workflows/build-app.yml` builds the application on a `debian:bookworm` container and on `windows-latest` and uploads the resulting `dist/` trees, so a change that breaks either platform's build is caught before merge. Both jobs pin the same Node 22 and the `packageManager` pnpm version as the local scripts.
