import { NextRequest, NextResponse } from 'next/server'
import { VoteSchema } from '@/lib/validation'
import { createServerClient } from '@/lib/supabase/server'
import { hashPII, extractIP } from '@/lib/hash'
import type { PointStatus } from '@/types'

const UPVOTE_APPROVE_THRESHOLD = 3
const DOWNVOTE_FLAG_THRESHOLD = 3
const DOWNVOTE_REMOVE_THRESHOLD = 6
const UPVOTE_OVERRIDE_THRESHOLD = 5

// POST /api/points/[id]/vote — cast a community vote
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pointId } = await params

  // Parse and validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = VoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid vote_type' },
      { status: 400 }
    )
  }

  const { vote_type } = parsed.data

  // Hash PII at entry — before any DB interaction
  const rawIP = extractIP(req.headers.get('x-forwarded-for'))
  const rawFingerprint = req.headers.get('x-fingerprint') ?? 'unknown'
  const [hashedIP, hashedFingerprint] = await Promise.all([
    hashPII(rawIP),
    hashPII(rawFingerprint),
  ])

  const supabase = createServerClient()

  // Fetch the current point status
  const { data: point, error: fetchError } = await supabase
    .from('koperasi_points')
    .select('id, status, upvotes, downvotes')
    .eq('id', pointId)
    .single()

  if (fetchError || !point) {
    return NextResponse.json({ error: 'Point not found' }, { status: 404 })
  }

  // Voting is only open on pending and flagged points
  if (point.status !== 'pending' && point.status !== 'flagged') {
    return NextResponse.json(
      { error: 'Voting is closed for this submission.' },
      { status: 422 }
    )
  }

  // Insert vote — unique index (point_id, voter_ip, voter_fingerprint) enforces dedup
  const { error: voteError } = await supabase.from('votes').insert({
    point_id: pointId,
    vote_type,
    voter_ip: hashedIP,
    voter_fingerprint: hashedFingerprint,
  })

  if (voteError) {
    // Postgres unique violation code
    if (voteError.code === '23505') {
      return NextResponse.json(
        { error: 'You have already voted on this submission.' },
        { status: 409 }
      )
    }
    console.error('Vote insert error:', voteError)
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 503 })
  }

  // Update cached counters
  const newUpvotes = vote_type === 'up' ? point.upvotes + 1 : point.upvotes
  const newDownvotes = vote_type === 'down' ? point.downvotes + 1 : point.downvotes

  // Determine new status per SPEC.md §5.2 state machine
  let newStatus: PointStatus = point.status as PointStatus

  if (point.status === 'pending') {
    if (newUpvotes >= UPVOTE_APPROVE_THRESHOLD) newStatus = 'approved'
    else if (newDownvotes >= DOWNVOTE_FLAG_THRESHOLD) newStatus = 'flagged'
  } else if (point.status === 'flagged') {
    if (newDownvotes >= DOWNVOTE_REMOVE_THRESHOLD) newStatus = 'removed'
    else if (newUpvotes >= UPVOTE_OVERRIDE_THRESHOLD) newStatus = 'approved'
  }

  await supabase
    .from('koperasi_points')
    .update({ upvotes: newUpvotes, downvotes: newDownvotes, status: newStatus })
    .eq('id', pointId)

  return NextResponse.json({
    data: { upvotes: newUpvotes, downvotes: newDownvotes, status: newStatus },
    message: 'Vote recorded.',
  })
}
