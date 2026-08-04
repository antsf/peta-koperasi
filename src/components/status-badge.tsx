import type { PointStatus } from '@/types'

const STATUS_STYLES: Record<PointStatus, string> = {
  pending:  'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100  text-green-800  border-green-300',
  flagged:  'bg-orange-100 text-orange-800 border-orange-300',
  removed:  'bg-stone-100  text-stone-600  border-stone-300',
}

const STATUS_DOT: Record<PointStatus, string> = {
  pending:  'bg-yellow-500',
  approved: 'bg-green-600',
  flagged:  'bg-orange-500',
  removed:  'bg-stone-400',
}

const STATUS_LABELS: Record<PointStatus, { id: string; en: string }> = {
  pending:  { id: 'Menunggu', en: 'Pending' },
  approved: { id: 'Terverifikasi', en: 'Verified' },
  flagged:  { id: 'Ditandai', en: 'Flagged' },
  removed:  { id: 'Dihapus', en: 'Removed' },
}

interface StatusBadgeProps {
  status: PointStatus
  locale?: 'id' | 'en'
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, locale = 'id', size = 'sm' }: StatusBadgeProps) {
  const label = STATUS_LABELS[status][locale]
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
