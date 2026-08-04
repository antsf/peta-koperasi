/**
 * PII hashing utility.
 * Raw IP addresses and browser fingerprints MUST be hashed before any storage.
 * This is the ONLY place in the codebase that handles raw PII strings.
 */

/**
 * SHA-256 hash a string using the Web Crypto API.
 * Returns a lowercase hex string.
 */
export async function hashPII(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Extract the real client IP from the x-forwarded-for header.
 * Returns 'unknown' if the header is missing.
 * NEVER store the return value directly — always pass through hashPII first.
 */
export function extractIP(forwardedFor: string | null): string {
  if (!forwardedFor) return 'unknown'
  // x-forwarded-for can be a comma-separated list; take the first (client) IP
  const firstIP = forwardedFor.split(',')[0].trim()
  return firstIP || 'unknown'
}
