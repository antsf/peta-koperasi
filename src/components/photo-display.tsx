import Image from 'next/image'
import type { PointStatus } from '@/types'

interface PhotoDisplayProps {
  photoUrl: string | null
  pointName: string
  status: PointStatus
}

/**
 * Renders cooperative photo only when status === 'approved' AND photo_url is set.
 * Shows a placeholder otherwise — never reveals photos for pending/flagged/removed points.
 */
export function PhotoDisplay({ photoUrl, pointName, status }: PhotoDisplayProps) {
  const showPhoto = status === 'approved' && photoUrl !== null

  if (showPhoto) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface-raised">
        <Image
          src={photoUrl!}
          alt={`Foto koperasi ${pointName}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 600px"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div
      className="w-full aspect-video rounded-xl bg-surface-raised flex items-center justify-center"
      aria-label="Foto belum tersedia"
      role="img"
    >
      <div className="text-center text-text-disabled">
        <div className="text-3xl mb-2" aria-hidden="true">📷</div>
        <p className="text-sm">
          {status === 'approved' ? 'Belum ada foto' : 'Foto tersedia setelah terverifikasi'}
        </p>
      </div>
    </div>
  )
}
