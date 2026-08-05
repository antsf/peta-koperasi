import type { PointStatus } from '@/types'

const STATUS_STYLES: Record<PointStatus, string> = {
  pending:  'bg-status-pending-bg text-status-pending-text border-status-pending-border',
  approved: 'bg-status-approved-bg text-status-approved-text border-status-approved-border',
  flagged:  'bg-status-flagged-bg text-status-flagged-text border-status-flagged-border',
  removed:  'bg-status-removed-bg text-status-removed-text border-status-removed-border',
}

const STATUS_DOT: Record<PointStatus, string> = {
  pending:  'bg-status-pending-text',
  approved: 'bg-status-approved-text',
  flagged:  'bg-status-flagged-text',
  removed:  'bg-status-removed-text',
}

const STATUS_LABELS: Record<PointStatus, string> = {
  pending:  'Menunggu',
  approved: 'Terverifikasi',
  flagged:  'Ditandai',
  removed:  'Dihapus',
}

interface StatusBadgeProps {
  status: PointStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const label = STATUS_LABELS[status]
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${STATUS_STYLES[status]} ${sizeClasses}`}
      role="status"
      aria-label={`Status: ${label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} aria-hidden="true" />
      {label}
    </span>
  )
}
