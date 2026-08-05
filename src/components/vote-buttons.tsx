'use client'

import { useState } from 'react'
import { getFingerprint } from '@/lib/fingerprint'
import type { VoteType, PointStatus } from '@/types'

interface VoteButtonsProps {
  pointId: string
  initialUpvotes: number
  initialDownvotes: number
  status: PointStatus
  onVoteComplete?: () => void
}

export function VoteButtons({ pointId, initialUpvotes, initialDownvotes, status, onVoteComplete }: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [voted, setVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<PointStatus>(status)

  const canVote = !voted && !loading && (currentStatus === 'pending' || currentStatus === 'flagged')

  async function castVote(voteType: VoteType) {
    if (!canVote) return
    setLoading(true)
    setError(null)

    try {
      const fingerprint = await getFingerprint()
      const res = await fetch(`/api/points/${pointId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fingerprint': fingerprint,
        },
        body: JSON.stringify({ vote_type: voteType }),
      })

      const json = await res.json()

      if (res.status === 409) {
        setShake(true)
        setTimeout(() => setShake(false), 400)
        setError('Anda sudah memilih')
        setVoted(true)
        return
      }

      if (!res.ok) {
        setError(json.error ?? 'Gagal mencatat suara')
        return
      }

      setUpvotes(json.data.upvotes)
      setDownvotes(json.data.downvotes)
      setCurrentStatus(json.data.status)
      setVoted(true)
      onVoteComplete?.()
    } catch {
      setError('Gagal mencatat suara')
    } finally {
      setLoading(false)
    }
  }

  const baseBtn = [
    'min-h-11 min-w-20',
    'flex items-center justify-center gap-2',
    'px-4 py-2 rounded-button border',
    'text-sm font-medium',
    'transition-[border-color,background-color,color,transform] duration-160 ease-out',
    'active:scale-[0.96]',
  ].join(' ')

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center gap-3 ${shake ? 'animate-shake' : ''}`}>
        <button
          onClick={() => castVote('up')}
          disabled={!canVote}
          className={`${baseBtn} ${
            voted && upvotes > initialUpvotes
              ? 'bg-status-approved-bg border-status-approved-border text-status-approved-text'
              : canVote
              ? 'border-border text-text-secondary hover:border-primary hover:text-primary hover:bg-surface-raised'
              : 'border-border text-text-disabled cursor-not-allowed opacity-60 active:scale-100'
          }`}
          aria-label={`Setuju — ${upvotes} suara`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 4l8 16H4z"/>
          </svg>
          <span>Setuju</span>
          <span>{upvotes}</span>
        </button>

        <button
          onClick={() => castVote('down')}
          disabled={!canVote}
          className={`${baseBtn} ${
            voted && downvotes > initialDownvotes
              ? 'bg-red-50 border-red-300 text-red-700'
              : canVote
              ? 'border-border text-text-secondary hover:border-danger hover:text-danger hover:bg-red-50'
              : 'border-border text-text-disabled cursor-not-allowed opacity-60 active:scale-100'
          }`}
          aria-label={`Tidak setuju — ${downvotes} suara`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 20l-8-16h16z"/>
          </svg>
          <span>Tidak</span>
          <span>{downvotes}</span>
        </button>
      </div>

      {error && (
        <p className="text-xs text-danger" role="alert">{error}</p>
      )}
    </div>
  )
}
