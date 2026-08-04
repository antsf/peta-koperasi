'use client'

import { useState, useRef, useEffect } from 'react'
import { getFingerprint } from '@/lib/fingerprint'

interface LatLng { lat: number; lng: number }

export function SubmitForm() {
  const [pin, setPin] = useState<LatLng | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState<string | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const pinMarkerRef = useRef<L.Marker | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Initialize mini map for pin placement
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    ;(async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      const map = L.map(mapContainerRef.current!, {
        center: [-2.5, 118.0],
        zoom: 5,
        maxBounds: [[-11, 95], [6, 141]],
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        setPin({ lat, lng })

        if (pinMarkerRef.current) {
          pinMarkerRef.current.setLatLng([lat, lng])
        } else {
          pinMarkerRef.current = L.marker([lat, lng], {
            icon: L.divIcon({
              className: '',
              html: `<div style="width:24px;height:32px;background:#0B6E4F;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(28,25,23,0.3)" />`,
              iconSize: [24, 32],
              iconAnchor: [12, 32],
            }),
          }).addTo(map)
        }
      })

      mapRef.current = map
    })()

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!pin) { setError('Pilih lokasi koperasi di peta'); return }

    setSubmitting(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('latitude', String(pin.lat))
    formData.set('longitude', String(pin.lng))

    try {
      const fingerprint = await getFingerprint()
      const res = await fetch('/api/points', {
        method: 'POST',
        headers: { 'x-fingerprint': fingerprint },
        body: formData,
      })
      const json = await res.json()

      if (res.status === 429) { setError('Terlalu banyak pengiriman. Coba lagi nanti.'); return }
      if (!res.ok) { setError(json.error ?? 'Gagal mengirim. Coba lagi.'); return }

      setSuccess(true)
      form.reset()
      setPin(null)
      setPhotoName(null)
      if (pinMarkerRef.current) { pinMarkerRef.current.remove(); pinMarkerRef.current = null }
    } catch {
      setError('Gagal mengirim. Periksa koneksi internet Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-card p-8 text-center">
        <div className="text-4xl mb-4" aria-hidden="true">✓</div>
        <h2 className="font-heading font-semibold text-xl text-green-800 mb-2">Terima kasih!</h2>
        <p className="text-green-700 mb-6">
          Data koperasi Anda sudah diterima dan sedang menunggu verifikasi dari komunitas.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2.5 bg-primary text-white font-medium rounded-button hover:bg-primary-hover transition-colors duration-180"
        >
          Tambah Koperasi Lain
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Map pin picker */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Lokasi di Peta <span className="text-danger text-xs">(wajib)</span>
        </label>
        <p className="text-xs text-text-secondary mb-2">Klik pada peta untuk menentukan lokasi koperasi</p>
        <div
          ref={mapContainerRef}
          className="w-full h-56 rounded-xl border-2 border-border bg-surface-raised overflow-hidden"
          aria-label="Peta untuk menentukan lokasi"
          role="application"
        />
        {pin && (
          <p className="mt-1 text-xs text-green-700 flex items-center gap-1">
            <span aria-hidden="true">✓</span>
            Lokasi dipilih: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
          </p>
        )}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
          Nama Koperasi <span className="text-danger text-xs">(wajib)</span>
        </label>
        <p className="text-xs text-text-secondary mb-1.5">Nama lengkap koperasi sesuai akta atau papan nama</p>
        <input
          id="name" name="name" type="text" required maxLength={200} autoComplete="off"
          className="w-full h-11 px-3 border-2 border-border rounded-lg text-sm text-text-primary bg-surface focus:outline-none focus:border-primary transition-colors duration-120"
          placeholder="cth. Koperasi Simpan Pinjam Maju Bersama"
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-text-primary mb-1">
          Alamat <span className="text-danger text-xs">(wajib)</span>
        </label>
        <input
          id="address" name="address" type="text" required
          className="w-full h-11 px-3 border-2 border-border rounded-lg text-sm text-text-primary bg-surface focus:outline-none focus:border-primary transition-colors duration-120"
          placeholder="cth. Jl. Raya Desa No. 12"
        />
      </div>

      {/* Region fields — 2-column on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="kelurahan" className="block text-sm font-medium text-text-primary mb-1">
            Kelurahan / Desa
          </label>
          <input
            id="kelurahan" name="kelurahan" type="text"
            className="w-full h-11 px-3 border-2 border-border rounded-lg text-sm text-text-primary bg-surface focus:outline-none focus:border-primary transition-colors duration-120"
          />
        </div>
        <div>
          <label htmlFor="kecamatan" className="block text-sm font-medium text-text-primary mb-1">
            Kecamatan
          </label>
          <input
            id="kecamatan" name="kecamatan" type="text"
            className="w-full h-11 px-3 border-2 border-border rounded-lg text-sm text-text-primary bg-surface focus:outline-none focus:border-primary transition-colors duration-120"
          />
        </div>
        <div>
          <label htmlFor="kabupaten" className="block text-sm font-medium text-text-primary mb-1">
            Kabupaten / Kota <span className="text-danger text-xs">(wajib)</span>
          </label>
          <input
            id="kabupaten" name="kabupaten" type="text" required
            className="w-full h-11 px-3 border-2 border-border rounded-lg text-sm text-text-primary bg-surface focus:outline-none focus:border-primary transition-colors duration-120"
          />
        </div>
        <div>
          <label htmlFor="provinsi" className="block text-sm font-medium text-text-primary mb-1">
            Provinsi <span className="text-danger text-xs">(wajib)</span>
          </label>
          <input
            id="provinsi" name="provinsi" type="text" required
            className="w-full h-11 px-3 border-2 border-border rounded-lg text-sm text-text-primary bg-surface focus:outline-none focus:border-primary transition-colors duration-120"
          />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1">
            Nomor Telepon
          </label>
          <input
            id="phone" name="phone" type="tel" autoComplete="tel"
            className="w-full h-11 px-3 border-2 border-border rounded-lg text-sm font-mono text-text-primary bg-surface focus:outline-none focus:border-primary transition-colors duration-120"
            placeholder="cth. 0812-3456-7890"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
            Email
          </label>
          <input
            id="email" name="email" type="email" autoComplete="email"
            className="w-full h-11 px-3 border-2 border-border rounded-lg text-sm text-text-primary bg-surface focus:outline-none focus:border-primary transition-colors duration-120"
          />
        </div>
      </div>

      {/* Photo */}
      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-text-primary mb-1">
          Foto Koperasi
        </label>
        <p className="text-xs text-text-secondary mb-1.5">
          Foto gedung atau kegiatan koperasi. Maksimal 5MB (JPG, PNG, WebP).
        </p>
        <label
          htmlFor="photo"
          className="flex items-center gap-3 h-11 px-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors duration-120 bg-surface"
        >
          <span className="text-text-disabled text-sm" aria-hidden="true">📷</span>
          <span className="text-sm text-text-secondary">
            {photoName ?? 'Pilih foto...'}
          </span>
        </label>
        <input
          id="photo" name="photo" type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={e => setPhotoName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-12 bg-primary text-white font-medium rounded-button hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-180 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            Mengirim...
          </>
        ) : 'Kirim Data'}
      </button>
    </form>
  )
}
