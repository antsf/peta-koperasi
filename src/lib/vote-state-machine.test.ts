import { describe, it, expect } from 'vitest'
import type { PointStatus } from '@/types'

// ---------------------------------------------------------------------------
// State machine logic extracted from vote/route.ts for unit testing.
// This mirrors the exact thresholds and transition rules in the route handler.
// ---------------------------------------------------------------------------

const UPVOTE_APPROVE_THRESHOLD = 3
const DOWNVOTE_FLAG_THRESHOLD = 3
const DOWNVOTE_REMOVE_THRESHOLD = 6
const UPVOTE_OVERRIDE_THRESHOLD = 5

function computeNewStatus(
  currentStatus: PointStatus,
  upvotes: number,
  downvotes: number,
): PointStatus {
  if (currentStatus === 'pending') {
    if (upvotes >= UPVOTE_APPROVE_THRESHOLD) return 'approved'
    if (downvotes >= DOWNVOTE_FLAG_THRESHOLD) return 'flagged'
    return 'pending'
  }
  if (currentStatus === 'flagged') {
    if (downvotes >= DOWNVOTE_REMOVE_THRESHOLD) return 'removed'
    if (upvotes >= UPVOTE_OVERRIDE_THRESHOLD) return 'approved'
    return 'flagged'
  }
  // approved / removed — no transition
  return currentStatus
}

// ---------------------------------------------------------------------------
// pending → approved
// ---------------------------------------------------------------------------
describe('pending → approved', () => {
  it('transitions at exactly 3 upvotes', () => {
    expect(computeNewStatus('pending', 3, 0)).toBe('approved')
  })

  it('transitions above 3 upvotes', () => {
    expect(computeNewStatus('pending', 5, 0)).toBe('approved')
  })

  it('does NOT transition at 2 upvotes', () => {
    expect(computeNewStatus('pending', 2, 0)).toBe('pending')
  })
})

// ---------------------------------------------------------------------------
// pending → flagged
// ---------------------------------------------------------------------------
describe('pending → flagged', () => {
  it('transitions at exactly 3 downvotes', () => {
    expect(computeNewStatus('pending', 0, 3)).toBe('flagged')
  })

  it('transitions above 3 downvotes', () => {
    expect(computeNewStatus('pending', 0, 5)).toBe('flagged')
  })

  it('does NOT transition at 2 downvotes', () => {
    expect(computeNewStatus('pending', 0, 2)).toBe('pending')
  })

  it('upvote threshold takes priority over downvote when both met', () => {
    // Edge case: upvotes reach approve threshold even with many downvotes
    expect(computeNewStatus('pending', 3, 3)).toBe('approved')
  })
})

// ---------------------------------------------------------------------------
// flagged → removed
// ---------------------------------------------------------------------------
describe('flagged → removed', () => {
  it('transitions at exactly 6 downvotes', () => {
    expect(computeNewStatus('flagged', 0, 6)).toBe('removed')
  })

  it('transitions above 6 downvotes', () => {
    expect(computeNewStatus('flagged', 0, 8)).toBe('removed')
  })

  it('does NOT transition at 5 downvotes', () => {
    expect(computeNewStatus('flagged', 0, 5)).toBe('flagged')
  })
})

// ---------------------------------------------------------------------------
// flagged → approved (community override)
// ---------------------------------------------------------------------------
describe('flagged → approved (override)', () => {
  it('transitions at exactly 5 upvotes', () => {
    expect(computeNewStatus('flagged', 5, 0)).toBe('approved')
  })

  it('transitions above 5 upvotes', () => {
    expect(computeNewStatus('flagged', 7, 0)).toBe('approved')
  })

  it('does NOT transition at 4 upvotes', () => {
    expect(computeNewStatus('flagged', 4, 0)).toBe('flagged')
  })

  it('remove threshold takes priority over override when both met', () => {
    // If downvotes >= 6 AND upvotes >= 5, removed wins (checked first in route)
    expect(computeNewStatus('flagged', 5, 6)).toBe('removed')
  })
})

// ---------------------------------------------------------------------------
// Terminal states — no transitions
// ---------------------------------------------------------------------------
describe('terminal states', () => {
  it('approved stays approved regardless of votes', () => {
    expect(computeNewStatus('approved', 100, 100)).toBe('approved')
  })

  it('removed stays removed regardless of votes', () => {
    expect(computeNewStatus('removed', 100, 100)).toBe('removed')
  })
})

// ---------------------------------------------------------------------------
// Boundary conditions
// ---------------------------------------------------------------------------
describe('boundary values', () => {
  it('pending with 0 votes stays pending', () => {
    expect(computeNewStatus('pending', 0, 0)).toBe('pending')
  })

  it('flagged with 0 votes stays flagged', () => {
    expect(computeNewStatus('flagged', 0, 0)).toBe('flagged')
  })

  it('pending: exactly 1 below approve threshold stays pending', () => {
    expect(computeNewStatus('pending', UPVOTE_APPROVE_THRESHOLD - 1, 0)).toBe('pending')
  })

  it('flagged: exactly 1 below remove threshold stays flagged', () => {
    expect(computeNewStatus('flagged', 0, DOWNVOTE_REMOVE_THRESHOLD - 1)).toBe('flagged')
  })
})
