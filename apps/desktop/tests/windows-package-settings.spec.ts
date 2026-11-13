import { expect, it } from 'vitest'
import { resolveWindowsPackageSettings } from '../scripts/windows-package-settings.mjs'

it('defaults both worker limits to four', () => {
  expect(resolveWindowsPackageSettings({})).toEqual({ signatureCacheConcurrency: 4, packConcurrency: 4 })
})

it('reads each limit independently', () => {
  expect(resolveWindowsPackageSettings({
    DSH_DESKTOP_WINDOWS_PACK_CONCURRENCY: '8',
    DSH_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY: '2',
  })).toEqual({ signatureCacheConcurrency: 2, packConcurrency: 8 })
  expect(resolveWindowsPackageSettings({ DSH_DESKTOP_WINDOWS_PACK_CONCURRENCY: '1' }))
    .toEqual({ signatureCacheConcurrency: 4, packConcurrency: 1 })
})

it.each(['', '0', '-1', '1.5', '1e2', '9', 'Infinity'])('rejects invalid pack concurrency %j', (value) => {
  expect(() => resolveWindowsPackageSettings({ DSH_DESKTOP_WINDOWS_PACK_CONCURRENCY: value }))
    .toThrow('PACK_CONCURRENCY')
})

it.each(['', '0', '9', '1.5'])('keeps rejecting invalid signature-cache concurrency %j', (value) => {
  expect(() => resolveWindowsPackageSettings({ DSH_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY: value }))
    .toThrow('SIGNATURE_CACHE_CONCURRENCY')
})
