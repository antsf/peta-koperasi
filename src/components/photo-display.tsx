import Image from 'next/image'
import type { PointStatus } from '@/types'

interface PhotoDisplayProps {
  photoUrl: string | null
  pointName: string
  status: PointStatus
}

/**
 * Renders cooperative photo when status is NOT 'removed' AND photo_url is set.
 * Voters need to see the photo to verify the submission before voting.
 * Only hidden for 'removed' points.
 */
export function PhotoDisplay({ photoUrl, pointName, status }: PhotoDisplayProps) {
  const showPhoto = status !== 'removed' && photoUrl !== null

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
          {status === 'approved' ? 'Belum ada foto' : 'Foto belum diunggah'}
        </p>
      </div>
    </div>
  )
}