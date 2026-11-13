import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { readDesktopRuntime, writeDesktopRuntimeAsync } from '../src/runtime-tree.ts'
import { runtimeFixture } from './runtime-fixture.ts'

it('seals the same descriptor concurrently as it does serially', async () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-runtime-async-'))
  try {
    const serial = runtimeFixture(root)
    const concurrent = await writeDesktopRuntimeAsync(root, serial.release, serial.sharedPackages.map(entry => entry.name))
    expect(concurrent).toEqual(serial)
    expect(readDesktopRuntime(root)).toEqual(serial)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
