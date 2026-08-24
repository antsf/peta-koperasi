import Link from 'next/link'
import Image from 'next/image'
import { StatusBadge } from './status-badge'
import type { KoperasiPoint } from '@/types'

interface PointCardProps {
  point: KoperasiPoint
  showVotes?: boolean
}

export async function PointCard({ point, showVotes = false }: PointCardProps) {
  return (
    <article
      className="bg-surface border border-border rounded-card p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-180 ease-out-custom"
      aria-labelledby={`point-${point.id}-name`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <StatusBadge status={point.status} />
        {showVotes && (
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="text-status-approved-text" aria-hidden="true">▲</span>
              <span aria-label={`${point.upvotes} upvotes`}>{point.upvotes}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-danger" aria-hidden="true">▼</span>
              <span aria-label={`${point.downvotes} downvotes`}>{point.downvotes}</span>
            </span>
          </div>
        )}
      </div>

      <h2
        id={`point-${point.id}-name`}
        className="font-heading font-semibold text-xl text-text-primary mb-1 leading-snug"
      >
        {point.name}
      </h2>

      <p className="text-sm text-text-secondary mb-4">
        {point.kecamatan ? `${point.kecamatan} · ` : ''}
        {point.kabupaten}, {point.provinsi}
      </p>

      {/* Photo — shown for all statuses except removed */}
      {point.photo_url && point.status !== 'removed' && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 bg-surface-raised">
          <Image
            src={point.photo_url}
            alt={`Foto koperasi ${point.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      )}
      {!point.photo_url && (
        <div className="w-full aspect-video rounded-lg mb-4 bg-surface-raised flex items-center justify-center">
          <span className="text-text-disabled text-sm" aria-hidden="true">
            {point.status === 'approved' ? 'Belum ada foto' : 'Foto belum diunggah'}
          </span>
        </div>
      )}

      {/* Address */}
      <div className="flex items-start gap-2 text-sm text-text-secondary mb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-text-disabled" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span>{point.address}</span>
      </div>

      {/* Contact */}
      {point.phone && (
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-disabled" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <a
            href={`tel:${point.phone}`}
            className="font-mono hover:text-primary transition-colors duration-120"
          >
            {point.phone}
          </a>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <Link
          href={`/point/${point.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-120"
        >
          Lihat Detail
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}
