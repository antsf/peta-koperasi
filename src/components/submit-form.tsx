'use client'

import { useState, useRef, useEffect } from 'react'
import { getFingerprint } from '@/lib/fingerprint'

interface LatLng { lat: number; lng: number }

const inputClass = [
  'w-full h-11 px-3',
  'border-2 border-border rounded-lg',
  'text-sm text-text-primary bg-surface',
  'outline-none',
  'transition-[border-color] duration-120 ease-out',
  'focus:border-primary',
].join(' ')

export function SubmitForm() {
  const [pin, setPin] = useState<LatLng | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const pinMarkerRef = useRef<L.Marker | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

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
              html: `<div style="width:24px;height:32px;background:#0B6E4F;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(11,110,79,0.35)" />`,
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
      if (photoPreview) { URL.revokeObjectURL(photoPreview) }
    }
  }, [photoPreview])

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
      setPhotoPreview(null)
      if (pinMarkerRef.current) { pinMarkerRef.current.remove(); pinMarkerRef.current = null }
    } catch {
      setError('Gagal mengirim. Periksa koneksi internet Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="submit-success bg-status-approved-bg border border-status-approved-border rounded-card p-8 text-center">
        <div
          className="w-14 h-14 rounded-full bg-status-approved-bg border-2 border-status-approved-border flex items-center justify-center mx-auto mb-4"
          aria-hidden="true"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14532D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="font-heading font-semibold text-xl text-status-approved-text mb-2">Terima kasih!</h2>
        <p className="text-status-approved-text/80 mb-6 text-sm leading-relaxed">
          Data koperasi sudah diterima dan sedang menunggu verifikasi dari komunitas.
          Dibutuhkan 3 suara setuju untuk ditampilkan di peta.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2.5 bg-primary text-white font-medium rounded-button text-sm transition-[background-color,transform] duration-180 ease-out hover:bg-primary-hover active:scale-[0.97]"
        >
          Tambah Koperasi Lain
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 pb-8" noValidate>
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
          <p className="mt-1.5 text-xs text-status-approved-text flex items-center gap-1.5 submit-pin-confirm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Lokasi dipilih: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
          </p>
        )}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
          Nama Koperasi <span className="text-danger text-xs">(wajib)</span>
        </label>
        <p className="text-xs text-text-secondary mb-1.5">Nama lengkap sesuai akta atau papan nama</p>
        <input
          id="name" name="name" type="text" required maxLength={200} autoComplete="off"
          className={inputClass}
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
          className={inputClass}
          placeholder="cth. Jl. Raya Desa No. 12"
        />
      </div>

      {/* Region fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="kelurahan" className="block text-sm font-medium text-text-primary mb-1">Kelurahan / Desa</label>
          <input id="kelurahan" name="kelurahan" type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="kecamatan" className="block text-sm font-medium text-text-primary mb-1">Kecamatan</label>
          <input id="kecamatan" name="kecamatan" type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="kabupaten" className="block text-sm font-medium text-text-primary mb-1">
            Kabupaten / Kota <span className="text-danger text-xs">(wajib)</span>
          </label>
          <input id="kabupaten" name="kabupaten" type="text" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="provinsi" className="block text-sm font-medium text-text-primary mb-1">
            Provinsi <span className="text-danger text-xs">(wajib)</span>
          </label>
          <input id="provinsi" name="provinsi" type="text" required className={inputClass} />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1">Nomor Telepon</label>
          <input
            id="phone" name="phone" type="tel" autoComplete="tel"
            className={`${inputClass} font-mono`}
            placeholder="cth. 0812-3456-7890"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">Email</label>
          <input
            id="email" name="email" type="email" autoComplete="email"
            className={inputClass}
          />
        </div>
      </div>

      {/* Photo */}
      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-text-primary mb-1">
          Foto Koperasi
        </label>
        <p className="text-xs text-text-secondary mb-1.5">
          Foto gedung atau kegiatan koperasi. Maks. 5MB (JPG, PNG, WebP).
        </p>
        <label
          htmlFor="photo"
          className="flex items-center gap-3 h-11 px-3 border-2 border-dashed border-border rounded-lg cursor-pointer bg-surface transition-[border-color,background-color] duration-120 ease-out hover:border-primary hover:bg-surface-raised"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-disabled shrink-0" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span className="text-sm text-text-secondary truncate">
            {photoName ?? 'Pilih foto...'}
          </span>
        </label>
        <input
          id="photo" name="photo" type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) {
              setPhotoName(file.name)
              if (photoPreview) { URL.revokeObjectURL(photoPreview) }
              setPhotoPreview(URL.createObjectURL(file))
            } else {
              setPhotoName(null)
              setPhotoPreview(null)
            }
          }}
        />
        {photoPreview && (
          <div className="mt-3 relative">
            <img
              src={photoPreview}
              alt="Preview foto koperasi"
              className="w-full h-48 object-cover rounded-xl border-2 border-border"
            />
            <button
              type="button"
              onClick={() => {
                if (photoPreview) { URL.revokeObjectURL(photoPreview) }
                setPhotoPreview(null)
                setPhotoName(null)
                const input = document.getElementById('photo') as HTMLInputElement
                if (input) { input.value = '' }
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors duration-120"
              aria-label="Hapus foto"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div
          className="submit-error bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-12 bg-primary text-white font-medium rounded-button text-sm transition-[background-color,transform,opacity] duration-180 ease-out hover:bg-primary-hover active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            Mengirim...
          </>
        ) : 'Kirim Data'}
      </button>
    </form>
  )
}
