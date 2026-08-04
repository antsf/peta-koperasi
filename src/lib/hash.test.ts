import { describe, it, expect } from 'vitest'
import { hashPII, extractIP } from './hash'

describe('hashPII', () => {
  it('returns a 64-char hex string (SHA-256)', async () => {
    const result = await hashPII('192.168.1.1')
    expect(result).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic — same input same output', async () => {
    const a = await hashPII('test-fingerprint')
    const b = await hashPII('test-fingerprint')
    expect(a).toBe(b)
  })

  it('different inputs produce different hashes', async () => {
    const a = await hashPII('user-a')
    const b = await hashPII('user-b')
    expect(a).not.toBe(b)
  })

  it('never returns the raw input', async () => {
    const input = '203.0.113.42'
    const result = await hashPII(input)
    expect(result).not.toBe(input)
    expect(result).not.toContain(input)
  })

  it('handles empty string', async () => {
    const result = await hashPII('')
    expect(result).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('extractIP', () => {
  it('returns first IP from x-forwarded-for chain', () => {
    expect(extractIP('1.2.3.4, 5.6.7.8')).toBe('1.2.3.4')
  })

  it('returns single IP with no chain', () => {
    expect(extractIP('203.0.113.42')).toBe('203.0.113.42')
  })

  it('returns "unknown" for null header', () => {
    expect(extractIP(null)).toBe('unknown')
  })

  it('trims whitespace from IP', () => {
    expect(extractIP('  10.0.0.1  ')).toBe('10.0.0.1')
  })
})
