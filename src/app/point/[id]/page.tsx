import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPointById } from '@/lib/geo'

export const dynamic = 'force-dynamic'
import { StatusBadge } from '@/components/status-badge'
import { PhotoDisplay } from '@/components/photo-display'
import { VoteButtons } from '@/components/vote-buttons'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const point = await getPointById(id)
  if (!point) return { title: 'Tidak ditemukan' }

  return {
    title: `${point.name} — Peta Koperasi Desa Merah Putih`,
    description: `Koperasi di ${point.kabupaten}, ${point.provinsi}. Lihat lokasi dan kontak.`,
  }
}

export default async function PointDetailPage({ params }: Props) {
  const { id } = await params
  const point = await getPointById(id)

  if (!point) notFound()

  const canVote = point.status === 'pending' || point.status === 'flagged'

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-6 transition-colors duration-120"
      >
        ← Kembali ke Peta
      </Link>

      {/* Status */}
      <div className="mb-4">
        <StatusBadge status={point.status} size="md" />
      </div>

      {/* Name */}
      <h1 className="font-heading font-semibold text-3xl text-text-primary mb-1 leading-snug">
        {point.name}
      </h1>
      <p className="text-text-secondary mb-6">
        {point.kecamatan ? `${point.kecamatan} · ` : ''}
        {point.kabupaten}, {point.provinsi}
      </p>

      {/* Photo */}
      <div className="mb-8">
        <PhotoDisplay
          photoUrl={point.photo_url}
          pointName={point.name}
          status={point.status}
        />
      </div>

      {/* Details grid */}
      <div className="bg-surface border border-border rounded-card p-6 shadow-card mb-6 space-y-4">
        <h2 className="font-heading font-semibold text-lg text-text-primary border-b border-border pb-3">
          Informasi Koperasi
        </h2>

        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-medium text-text-secondary uppercase tracking-wide">Alamat</dt>
            <dd className="text-sm text-text-primary mt-0.5">{point.address}</dd>
          </div>

          {point.kelurahan && (
            <div>
              <dt className="text-xs font-medium text-text-secondary uppercase tracking-wide">Kelurahan / Desa</dt>
              <dd className="text-sm text-text-primary mt-0.5">{point.kelurahan}</dd>
            </div>
          )}

          {point.kecamatan && (
            <div>
              <dt className="text-xs font-medium text-text-secondary uppercase tracking-wide">Kecamatan</dt>
              <dd className="text-sm text-text-primary mt-0.5">{point.kecamatan}</dd>
            </div>
          )}

          <div>
            <dt className="text-xs font-medium text-text-secondary uppercase tracking-wide">Kabupaten / Kota</dt>
            <dd className="text-sm text-text-primary mt-0.5">{point.kabupaten}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-text-secondary uppercase tracking-wide">Provinsi</dt>
            <dd className="text-sm text-text-primary mt-0.5">{point.provinsi}</dd>
          </div>

          {point.phone && (
            <div>
              <dt className="text-xs font-medium text-text-secondary uppercase tracking-wide">Telepon</dt>
              <dd className="mt-0.5">
                <a
                  href={`tel:${point.phone}`}
                  className="text-sm font-mono text-primary hover:text-primary-hover transition-colors duration-120"
                >
                  {point.phone}
                </a>
              </dd>
            </div>
          )}

          {point.email && (
            <div>
              <dt className="text-xs font-medium text-text-secondary uppercase tracking-wide">Email</dt>
              <dd className="mt-0.5">
                <a
                  href={`mailto:${point.email}`}
                  className="text-sm text-primary hover:text-primary-hover transition-colors duration-120 break-all"
                >
                  {point.email}
                </a>
              </dd>
            </div>
          )}

          <div>
            <dt className="text-xs font-medium text-text-secondary uppercase tracking-wide">Ditambahkan</dt>
            <dd className="text-sm text-text-primary mt-0.5 font-mono">
              {new Date(point.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Community verification */}
      <div className="bg-surface border border-border rounded-card p-6 shadow-card">
        <h2 className="font-heading font-semibold text-lg text-text-primary mb-1">
          Verifikasi Komunitas
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {canVote
            ? 'Apakah data koperasi ini terlihat benar?'
            : `Data ini sudah ${point.status === 'approved' ? 'terverifikasi' : 'dihapus'} oleh komunitas.`}
        </p>

        {canVote ? (
          <VoteButtons
            pointId={point.id}
            initialUpvotes={point.upvotes}
            initialDownvotes={point.downvotes}
            status={point.status}
          />
        ) : (
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="text-green-600">▲</span>
              {point.upvotes} setuju
            </span>
            <span className="flex items-center gap-1">
              <span className="text-danger">▼</span>
              {point.downvotes} tidak setuju
            </span>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
