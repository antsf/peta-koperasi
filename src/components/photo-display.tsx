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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2" aria-hidden="true">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
        </svg>
        <p className="text-sm">
          {status === 'approved' ? 'Belum ada foto' : 'Foto belum diunggah'}
        </p>
      </div>
    </div>
  )
}