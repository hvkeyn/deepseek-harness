/**
 * Validate the file-owned Windows worker limits before packaging starts.
 * @param environment Windows packaging settings loaded from .env.windows.
 * @returns Signature-cache and package-worker limits from one to eight, defaulting to four when omitted; invalid values throw.
 */
export function resolveWindowsPackageSettings(environment: NodeJS.ProcessEnv): {
  signatureCacheConcurrency: number
  packConcurrency: number
}
