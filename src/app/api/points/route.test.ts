import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks — vi.mock is hoisted, factory runs before imports
// ---------------------------------------------------------------------------
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockUpload = vi.fn()
const mockEqChain = vi.fn()

const mockFromResult = {
  insert: vi.fn(() => ({
    select: vi.fn(() => ({ single: mockSingle })),
  })),
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: mockSingle,
      order: vi.fn(() => ({ order: vi.fn() })),
    })),
    count: vi.fn(() => ({
      eq: vi.fn(() => ({ single: mockSingle })),
    })),
  })),
  update: vi.fn(() => ({ eq: mockEqChain })),
}

const mockSupabaseClient = {
  from: vi.fn(() => mockFromResult),
  storage: { from: vi.fn(() => ({ upload: mockUpload })) },
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => mockSupabaseClient,
}))

vi.mock('@/lib/hash', () => ({
  hashPII: vi.fn().mockResolvedValue('hashed-value'),
  extractIP: vi.fn().mockReturnValue('127.0.0.1'),
}))

// ---------------------------------------------------------------------------
// Import AFTER mocks are set up
// ---------------------------------------------------------------------------
const { POST, GET } = await import('./route')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeFormData(data: Record<string, string | File>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value)
  }
  return fd
}

function makeRequest(formData: FormData): NextRequest {
  return new NextRequest('https://example.com/api/points', {
    method: 'POST',
    body: formData,
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'x-fingerprint': 'test-fingerprint',
    },
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/points', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validPayload = {
    name: 'Koperasi Desa Maju',
    latitude: '-6.2088',
    longitude: '106.8456',
    address: 'Jl. Merdeka No. 1',
    kabupaten: 'Jakarta Pusat',
    provinsi: 'DKI Jakarta',
  }

  it('accepts valid submission', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'test-id' }, error: null })
    const res = await POST(makeRequest(makeFormData(validPayload)))
    expect(res.status).toBe(201)
  })

  it('rejects empty name', async () => {
    const res = await POST(makeRequest(makeFormData({ ...validPayload, name: '' })))
    expect(res.status).toBe(400)
  })

  it('rejects missing required fields', async () => {
    const res = await POST(makeRequest(makeFormData({ name: 'Test' })))
    expect(res.status).toBe(400)
  })

  it('rejects out-of-bounds coordinates', async () => {
    const res = await POST(makeRequest(makeFormData({ ...validPayload, latitude: '0', longitude: '0' })))
    expect(res.status).toBe(400)
  })

  it('rejects honeypot filled', async () => {
    const res = await POST(makeRequest(makeFormData({ ...validPayload, website: 'bot-spam' })))
    expect(res.status).toBe(400)
  })

  it('rejects invalid photo type', async () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const res = await POST(makeRequest(makeFormData({ ...validPayload, photo: file })))
    expect(res.status).toBe(400)
  })

  it('rejects oversized photo', async () => {
    const bigBuffer = new ArrayBuffer(6 * 1024 * 1024)
    const file = new File([bigBuffer], 'big.jpg', { type: 'image/jpeg' })
    const res = await POST(makeRequest(makeFormData({ ...validPayload, photo: file })))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/points', () => {
  it('rejects missing viewport params', async () => {
    const req = new NextRequest('https://example.com/api/points')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})