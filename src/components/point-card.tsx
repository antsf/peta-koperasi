import Link from 'next/link'
import Image from 'next/image'
import { StatusBadge } from './status-badge'
import type { KoperasiPoint } from '@/types'

interface PointCardProps {
  point: KoperasiPoint
  locale?: 'id' | 'en'
  showVotes?: boolean
}

export function PointCard({ point, locale = 'id', showVotes = false }: PointCardProps) {
  return (
    <article
      className="bg-surface border border-border rounded-card p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-180 ease-out-custom"
      aria-labelledby={`point-${point.id}-name`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <StatusBadge status={point.status} locale={locale} />
        {showVotes && (
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="text-green-600" aria-hidden="true">▲</span>
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

      {/* Photo — only shown for approved points */}
      {point.photo_url && point.status === 'approved' && (
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
            {point.status === 'approved' ? 'Belum ada foto' : '—'}
          </span>
        </div>
      )}

      {/* Address */}
      <div className="flex items-start gap-2 text-sm text-text-secondary mb-2">
        <span aria-hidden="true" className="mt-0.5 text-text-disabled">📍</span>
        <span>{point.address}</span>
      </div>

      {/* Contact */}
      {point.phone && (
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
          <span aria-hidden="true" className="text-text-disabled">📞</span>
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
