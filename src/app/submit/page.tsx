import type { Metadata } from 'next'
import { SubmitPageClient } from './submit-page-client'

export const metadata: Metadata = {
  title: 'Tambah Koperasi — Peta Koperasi Desa Merah Putih',
  description: 'Tambahkan koperasi desa ke peta komunitas.',
}

export default function SubmitPage() {
  return (
    <div className="flex-1">
      <div className="max-w-2xl mx-auto w-full px-4 py-8 pb-12">
        <div className="mb-8">
          <h1 className="font-heading font-semibold text-3xl text-text-primary mb-2">
            Tambah Koperasi
          </h1>
          <p className="text-text-secondary">
            Data yang Anda kirim akan ditinjau oleh komunitas sebelum ditampilkan di peta.
            Dibutuhkan 3 suara setuju dari komunitas untuk memverifikasi.
          </p>
        </div>
        <SubmitPageClient />
      </div>
    </div>
  )
}
