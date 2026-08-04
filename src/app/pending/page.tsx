import type { Metadata } from 'next'
import { getPointsInViewport } from '@/lib/geo'

export const dynamic = 'force-dynamic'
import { VoteButtons } from '@/components/vote-buttons'
import { StatusBadge } from '@/components/status-badge'
import { PhotoDisplay } from '@/components/photo-display'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Verifikasi Koperasi — Peta Koperasi Desa Merah Putih',
  description: 'Bantu komunitas memverifikasi data koperasi baru.',
}

// Fetch all pending points (Indonesia-wide viewport)
async function getPendingPoints() {
  return getPointsInViewport(
    { north: 6, south: -11, east: 141, west: 95 },
    'pending'
  )
}

export default async function PendingPage() {
  const { points } = await getPendingPoints()

  return (
    <div>
    <div className="max-w-4xl mx-auto w-full px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading font-semibold text-3xl text-text-primary mb-2">
          Verifikasi Koperasi
        </h1>
        <p className="text-text-secondary mb-1">
          Bantu komunitas memverifikasi data koperasi baru.
        </p>
        <p className="text-sm text-text-secondary">
          Data yang mendapat <strong>3 suara setuju</strong> akan otomatis tampil di peta.
        </p>
      </div>

      {points.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4" aria-hidden="true">✓</div>
          <h2 className="font-heading font-semibold text-xl text-text-primary mb-2">
            Semua data sudah diverifikasi
          </h2>
          <p className="text-text-secondary mb-6">
            Tidak ada koperasi yang menunggu verifikasi saat ini.
            Terima kasih atas kontribusi komunitas!
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-button hover:bg-primary-hover transition-colors duration-180"
          >
            Tambah Koperasi Baru
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-text-secondary mb-6">
            <span className="font-medium text-text-primary">{points.length}</span> koperasi menunggu verifikasi
          </p>

          <div className="space-y-4">
            {points.map(point => (
              <article
                key={point.id}
                className="bg-surface border border-border rounded-card p-6 shadow-card"
                aria-labelledby={`pending-${point.id}-name`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={point.status} />
                      <span className="text-xs text-text-disabled">
                        {point.upvotes > 0 && `${3 - point.upvotes} suara lagi`}
                      </span>
                    </div>
                    <h2
                      id={`pending-${point.id}-name`}
                      className="font-heading font-semibold text-lg text-text-primary mb-1 truncate"
                    >
                      {point.name}
                    </h2>
                    <p className="text-sm text-text-secondary">
                      {point.kabupaten}, {point.provinsi}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <VoteButtons
                      pointId={point.id}
                      initialUpvotes={point.upvotes ?? 0}
                      initialDownvotes={point.downvotes ?? 0}
                      status={point.status}
                    />
                    <Link
                      href={`/point/${point.id}`}
                      className="text-xs text-primary hover:text-primary-hover transition-colors duration-120"
                    >
                      Lihat detail →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
    </div>
  )
}
