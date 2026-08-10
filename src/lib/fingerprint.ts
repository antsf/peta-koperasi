'use client'

let fpPromise: Promise<string> | null = null

async function generateFallbackId(): Promise<string> {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function getFingerprint(): Promise<string> {
  if (fpPromise) return fpPromise

  fpPromise = (async () => {
    try {
      const FingerprintJS = await import('@fingerprintjs/fingerprintjs')
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      return result.visitorId
    } catch {
      fpPromise = null
      return generateFallbackId()
    }
  })()

  return fpPromise
}
