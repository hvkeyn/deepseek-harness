/** Validate the assembled application, including native Office conversion outside ASAR. */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { resolveDesktopBuildTarget, resolveDesktopTargetBuildPaths } from './desktop-build-paths.mjs'
import { readDesktopRuntime, verifyDesktopRuntime } from '../src/runtime-tree.ts'
import { verifyWindowsCode } from './windows-runtime-signature.mjs'
import { smokePreparedRuntime } from './smoke-prepared-runtime.ts'
import { resolveDesktopPackageTarget } from './package-target.ts'

const paths = resolveDesktopTargetBuildPaths()
const { values } = parseArgs({ options: { unsigned: { type: 'boolean', default: false } }, allowPositionals: false })
const target = resolveDesktopBuildTarget()
const windows = target === 'win-x64'
const artifacts = values.unsigned ? paths.unsignedArtifacts : paths.artifacts
let application: string
if (windows) application = join(artifacts, 'win-unpacked')
else if (target === 'linux-x64') application = join(artifacts, 'linux-unpacked')
else application = join(artifacts, target === 'mac-arm64' ? 'mac-arm64' : 'mac', 'DeepSeek Harness.app', 'Contents')
const resources = join(application, windows || target === 'linux-x64' ? 'resources' : 'Resources')
let executable: string
if (windows) executable = join(application, 'DeepSeek Harness.exe')
else if (target === 'linux-x64') executable = join(application, 'deepseek-harness')
else executable = join(application, 'MacOS', 'DeepSeek Harness')
const appBundle = existsSync(join(resources, 'app.asar')) ? 'app.asar' : 'app'
const descriptor = await verifyDesktopRuntime(paths.dsh, readDesktopRuntime(paths.dsh).release.version,
  resolveDesktopPackageTarget(target))
if (windows && !values.unsigned) await verifyWindowsCode(application)
await smokePreparedRuntime(join(resources, appBundle, 'dsh'), executable, join(resources, 'runtime'), descriptor)
