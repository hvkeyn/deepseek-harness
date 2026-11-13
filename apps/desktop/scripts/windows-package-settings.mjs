/** Resolve file-owned Windows packaging settings before packaging starts. */

/**
 * Validate the signature-cache worker limit and the package-worker limit without accessing signing hardware.
 * @param {NodeJS.ProcessEnv} environment File-owned Windows packaging settings.
 * @returns {{signatureCacheConcurrency: number, packConcurrency: number}} Worker limits, defaulting to four when omitted.
 */
export function resolveWindowsPackageSettings(environment) {
  const value = environment.DSH_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY ?? '4'
  if (!/^[1-8]$/u.test(value)) {
    throw new Error('desktop package: DSH_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY must be an integer from 1 to 8')
  }
  // The runtime pack turns hundreds of workspace packages into tarballs; a single worker serialises
  // that for no benefit, and the publish-order file keeps the family order whatever the concurrency.
  const pack = environment.DSH_DESKTOP_WINDOWS_PACK_CONCURRENCY ?? '4'
  if (!/^[1-8]$/u.test(pack)) {
    throw new Error('desktop package: DSH_DESKTOP_WINDOWS_PACK_CONCURRENCY must be an integer from 1 to 8')
  }
  return { signatureCacheConcurrency: Number(value), packConcurrency: Number(pack) }
}
