'use client'

/**
 * Browser fingerprint utility using FingerprintJS (open-source).
 * Returns a stable visitor ID for vote dedup.
 * This value is sent as x-fingerprint header on vote and submit requests.
 * It is SHA-256 hashed server-side before storage — raw value never persisted.
 */

let fpPromise: Promise<string> | null = null

export async function getFingerprint(): Promise<string> {
  if (fpPromise) return fpPromise

  fpPromise = (async () => {
    const FingerprintJS = await import('@fingerprintjs/fingerprintjs')
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    return result.visitorId
  })()

  return fpPromise
}
