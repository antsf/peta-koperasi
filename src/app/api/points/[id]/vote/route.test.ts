import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockSingle = vi.fn()
const mockInsert = vi.fn()
const mockEqChain = vi.fn()

const mockVotesResult = {
  insert: mockInsert,
}

const mockPointsResult = {
  select: vi.fn(() => ({
    eq: vi.fn(() => ({ single: mockSingle })),
  })),
  update: vi.fn(() => ({ eq: mockEqChain })),
}

const mockSupabaseClient = {
  from: vi.fn((table: string) => {
    if (table === 'koperasi_points') return mockPointsResult
    if (table === 'votes') return mockVotesResult
    return {}
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => mockSupabaseClient,
}))

vi.mock('@/lib/hash', () => ({
  hashPII: vi.fn().mockResolvedValue('hashed-value'),
  extractIP: vi.fn().mockReturnValue('127.0.0.1'),
}))

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------
const { POST } = await import('./route')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeVoteRequest(body: Record<string, string>): NextRequest {
  return new NextRequest('https://example.com/api/points/test-id/vote', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'x-fingerprint': 'test-fingerprint',
    },
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/points/[id]/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts valid upvote', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'test-id', status: 'pending', upvotes: 0, downvotes: 0 },
      error: null,
    })
    mockInsert.mockResolvedValue({ error: null })
    mockEqChain.mockResolvedValue({ error: null })

    const res = await POST(makeVoteRequest({ vote_type: 'up' }), {
      params: Promise.resolve({ id: 'test-id' }),
    })
    expect(res.status).toBe(200)
  })

  it('rejects invalid vote_type', async () => {
    const res = await POST(makeVoteRequest({ vote_type: 'invalid' }), {
      params: Promise.resolve({ id: 'test-id' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects duplicate vote', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'test-id', status: 'pending', upvotes: 0, downvotes: 0 },
      error: null,
    })
    mockInsert.mockResolvedValue({ error: { code: '23505' } })

    const res = await POST(makeVoteRequest({ vote_type: 'up' }), {
      params: Promise.resolve({ id: 'test-id' }),
    })
    expect(res.status).toBe(409)
  })

  it('rejects vote on approved point', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'test-id', status: 'approved', upvotes: 3, downvotes: 0 },
      error: null,
    })

    const res = await POST(makeVoteRequest({ vote_type: 'up' }), {
      params: Promise.resolve({ id: 'test-id' }),
    })
    expect(res.status).toBe(422)
  })

  it('returns 404 for non-existent point', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

    const res = await POST(makeVoteRequest({ vote_type: 'up' }), {
      params: Promise.resolve({ id: 'non-existent' }),
    })
    expect(res.status).toBe(404)
  })
})