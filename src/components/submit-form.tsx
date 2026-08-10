'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { getFingerprint } from '@/lib/fingerprint'
import { reverseGeocode } from '@/lib/geocode'
import { SubmitPointSchema } from '@/lib/validation'
import type { ZodIssue } from 'zod'

const FIELD_LABELS: Record<string, string> = {
  name: 'Nama Koperasi',
  address: 'Alamat',
  kelurahan: 'Kelurahan / Desa',
  kecamatan: 'Kecamatan',
  kabupaten: 'Kabupaten / Kota',
  provinsi: 'Provinsi',
  phone: 'Nomor Telepon',
  email: 'Email',
  latitude: 'Latitude',
  longitude: 'Longitude',
}

function fieldMessage(issue: ZodIssue): string {
  const label = FIELD_LABELS[String(issue.path[0])] ?? 'Kolom'
  const field = String(issue.path[0])
  if (issue.code === 'too_small' || issue.code === 'invalid_type') {
    return `${label} wajib diisi`
  } else if (issue.code === 'invalid_format' && issue.format === 'email') {
    return `${label} harus format email yang valid`
  } else if (issue.code === 'too_big' && typeof issue.maximum === 'number') {
    return `${label} maksimal ${issue.maximum} karakter`
  } else if (
    issue.code === 'custom' &&
    (field === 'latitude' || field === 'longitude') &&
    /bounds|out of/i.test(issue.message)
  ) {
    return 'Koordinat harus di wilayah Indonesia'
  }
  return `${label}: ${issue.message}`
}

function collectFieldErrors(errors: ZodIssue[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const issue of errors) {
    const key = String(issue.path[0])
    const message = fieldMessage(issue)
    if (!map[key]) map[key] = message
  }
  return map
}

function formatSubmitErrors(errors: ZodIssue[]): string {
  const lines: string[] = []
  for (const issue of errors) {
    const message = fieldMessage(issue)
    if (!lines.includes(message)) lines.push(message)
  }
  return `Periksa kembali: ${lines.join('; ')}`
}

interface LatLng { lat: number; lng: number }

const INDONESIA_BOUNDS = { latMin: -11, latMax: 6, lngMin: 95, lngMax: 141 }

function isInsideIndonesia(lat: number, lng: number): boolean {
  return lat >= INDONESIA_BOUNDS.latMin && lat <= INDONESIA_BOUNDS.latMax
    && lng >= INDONESIA_BOUNDS.lngMin && lng <= INDONESIA_BOUNDS.lngMax
}

const inputClass = [
  'w-full h-11 px-3',
  'border-2 border-border rounded-lg',
  'text-sm text-text-primary bg-surface',
  'outline-none',
  'transition-[border-color] duration-120 ease-out',
  'focus:border-primary',
].join(' ')

const coordInputClass = [
  'w-full h-11 px-3 pr-10',
  'border-2 border-border rounded-lg',
  'text-sm text-text-primary bg-surface font-mono',
  'outline-none',
  'transition-[border-color] duration-120 ease-out',
  'focus:border-primary',
].join(' ')

export function SubmitForm() {
  const [pin, setPin] = useState<LatLng | null>(null)
  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')
  const [coordError, setCoordError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [photoName, setPhotoName] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const pinMarkerRef = useRef<L.Marker | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const settingFromMap = useRef(false)
  const addressRef = useRef<HTMLInputElement>(null)
  const kelurahanRef = useRef<HTMLInputElement>(null)
  const kecamatanRef = useRef<HTMLInputElement>(null)
  const kabupatenRef = useRef<HTMLInputElement>(null)
  const provinsiRef = useRef<HTMLInputElement>(null)
  const coordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const validateCoords = useCallback((lat: number, lng: number): string | null => {
    if (isNaN(lat) || isNaN(lng)) return 'Koordinat tidak valid'
    if (!isInsideIndonesia(lat, lng)) return 'Koordinat harus di wilayah Indonesia'
    return null
  }, [])

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors(prev => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const placePin = useCallback((map: L.Map, lat: number, lng: number) => {
    const L = (window as any).LeafletLib
    if (!L) return

    if (pinMarkerRef.current) {
      pinMarkerRef.current.setLatLng([lat, lng])
    } else {
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:24px;height:32px;background:#0B6E4F;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(11,110,79,0.35);cursor:grab" />`,
          iconSize: [24, 32],
          iconAnchor: [12, 32],
        }),
        draggable: true,
      })

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        setPin({ lat: pos.lat, lng: pos.lng })
        setLatInput(pos.lat.toFixed(5))
        setLngInput(pos.lng.toFixed(5))
        setCoordError(null)
        setGeocoding(true)
        reverseGeocode(pos.lat, pos.lng).then(result => {
          if (result) {
            if (addressRef.current) addressRef.current.value = result.address || addressRef.current.value
            if (kelurahanRef.current) kelurahanRef.current.value = result.kelurahan || kelurahanRef.current.value
            if (kecamatanRef.current) kecamatanRef.current.value = result.kecamatan || kecamatanRef.current.value
            if (kabupatenRef.current) kabupatenRef.current.value = result.kabupaten || kabupatenRef.current.value
            if (provinsiRef.current) provinsiRef.current.value = result.provinsi || provinsiRef.current.value
          }
          setGeocoding(false)
        })
      })

      marker.addTo(map)
      pinMarkerRef.current = marker
    }
  }, [])

  const updatePinFromCoords = useCallback((lat: number, lng: number, fromMap = false, preserveInputs = false) => {
    setPin({ lat, lng })
    if (!preserveInputs) {
      setLatInput(lat.toFixed(5))
      setLngInput(lng.toFixed(5))
    }
    setCoordError(null)
    if (!fromMap && mapRef.current) {
      mapRef.current.setView([lat, lng], 14)
      placePin(mapRef.current, lat, lng)
    }

    setGeocoding(true)
    reverseGeocode(lat, lng).then(result => {
      if (result) {
        if (addressRef.current) addressRef.current.value = result.address || addressRef.current.value
        if (kelurahanRef.current) kelurahanRef.current.value = result.kelurahan || kelurahanRef.current.value
        if (kecamatanRef.current) kecamatanRef.current.value = result.kecamatan || kecamatanRef.current.value
        if (kabupatenRef.current) kabupatenRef.current.value = result.kabupaten || kabupatenRef.current.value
        if (provinsiRef.current) provinsiRef.current.value = result.provinsi || provinsiRef.current.value
      }
      setGeocoding(false)
    })
  }, [placePin])

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Browser tidak mendukung geolokasi')
      return
    }

    setGeoLoading(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        updatePinFromCoords(latitude, longitude)
        setGeoLoading(false)
      },
      (err) => {
        setGeoLoading(false)
        if (err.code === 1) {
          setGeoError('Izin lokasi ditolak. Aktifkan di pengaturan browser.')
        } else if (err.code === 2) {
          setGeoError('Lokasi tidak tersedia. Coba lagi nanti.')
        } else {
          setGeoError('Gagal mendapatkan lokasi. Coba lagi.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [updatePinFromCoords])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    ;(async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).LeafletLib = L

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
        settingFromMap.current = true
        updatePinFromCoords(lat, lng, true)
        placePin(map, lat, lng)
        settingFromMap.current = false
      })

      mapRef.current = map
    })()

    return () => {
      if (coordTimerRef.current) clearTimeout(coordTimerRef.current)
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      if (photoPreview) { URL.revokeObjectURL(photoPreview) }
    }
  }, [photoPreview, updatePinFromCoords, placePin])

  const handleLatChange = (value: string) => {
    setLatInput(value)
    const lat = parseFloat(value)
    const lng = parseFloat(lngInput)
    if (!isNaN(lat) && !isNaN(lng)) {
      const err = validateCoords(lat, lng)
      setCoordError(err)
      if (!err && mapRef.current) {
        if (coordTimerRef.current) clearTimeout(coordTimerRef.current)
        coordTimerRef.current = setTimeout(() => updatePinFromCoords(lat, lng, false, true), 500)
      }
    } else {
      setCoordError(null)
    }
  }

  const handleLngChange = (value: string) => {
    setLngInput(value)
    const lat = parseFloat(latInput)
    const lng = parseFloat(value)
    if (!isNaN(lat) && !isNaN(lng)) {
      const err = validateCoords(lat, lng)
      setCoordError(err)
      if (!err && mapRef.current) {
        if (coordTimerRef.current) clearTimeout(coordTimerRef.current)
        coordTimerRef.current = setTimeout(() => updatePinFromCoords(lat, lng, false, true), 500)
      }
    } else {
      setCoordError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const lat = parseFloat(latInput)
    const lng = parseFloat(lngInput)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('latitude', String(lat))
    formData.set('longitude', String(lng))

    const payload = {
      name: String(formData.get('name') ?? ''),
      latitude: lat,
      longitude: lng,
      address: String(formData.get('address') ?? ''),
      kelurahan: String(formData.get('kelurahan') ?? '').trim() || undefined,
      kecamatan: String(formData.get('kecamatan') ?? '').trim() || undefined,
      kabupaten: String(formData.get('kabupaten') ?? ''),
      provinsi: String(formData.get('provinsi') ?? ''),
      phone: String(formData.get('phone') ?? '').trim() || undefined,
      email: String(formData.get('email') ?? '').trim() || undefined,
    }
    const parsed = SubmitPointSchema.safeParse(payload)
    if (!parsed.success) {
      setFieldErrors(collectFieldErrors(parsed.error.issues))
      setError(formatSubmitErrors(parsed.error.issues))
      return
    }

    setFieldErrors({})
    setSubmitting(true)
    setError(null)

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
      setLatInput('')
      setLngInput('')
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setSuccess(false)}
            className="min-h-11 px-6 py-2.5 bg-primary text-white font-medium rounded-button text-sm transition-[background-color,transform] duration-180 ease-out hover:bg-primary-hover active:scale-[0.97]"
          >
            Tambah Koperasi Lain
          </button>
          <a
            href="/"
            className="min-h-11 px-6 py-2.5 border border-border text-text-secondary font-medium rounded-button text-sm transition-[border-color,color] duration-120 hover:border-primary hover:text-primary flex items-center justify-center"
          >
            Kembali ke Peta
          </a>
        </div>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 pb-8" noValidate>
      {/* Name — first field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
          Nama Koperasi <span className="text-primary text-xs">(wajib)</span>
        </label>
        <p className="text-sm text-text-secondary mb-1.5">Nama lengkap sesuai akta atau papan nama</p>
        <input
          id="name" name="name" type="text" required maxLength={200} autoComplete="off"
          onInput={() => clearFieldError('name')}
          aria-invalid={fieldErrors.name ? true : undefined}
          className={`${inputClass}${fieldErrors.name ? ' border-danger' : ''}`}
          placeholder="cth. Koperasi Simpan Pinjam Maju Bersama"
        />
        {fieldErrors.name && (
          <p className="mt-1.5 text-sm text-danger">{fieldErrors.name}</p>
        )}
      </div>

      {/* Map pin picker */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Lokasi di Peta <span className="text-primary text-xs">(wajib)</span>
        </label>
        <p className="text-sm text-text-secondary mb-2">Klik pada peta, gunakan lokasi saya, atau isi koordinat manual</p>
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="w-full h-56 rounded-xl border-2 border-border bg-surface-raised overflow-hidden"
            aria-label="Peta untuk menentukan lokasi"
            role="application"
          />
          <button
            type="button"
            onClick={handleGeolocation}
            disabled={geoLoading}
            className="absolute bottom-3 right-3 z-[1000] min-h-11 min-w-11 bg-surface border-2 border-border rounded-full shadow-popup flex items-center justify-center transition-[border-color,background-color] duration-120 ease-out hover:border-primary hover:bg-surface-raised disabled:opacity-60 disabled:cursor-not-allowed"
            title="Gunakan lokasi saya"
            aria-label="Gunakan lokasi saya"
          >
            {geoLoading ? (
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B6E4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
              </svg>
            )}
          </button>
        </div>
        {geoError && (
          <p className="mt-1.5 text-sm text-danger flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {geoError}
          </p>
        )}
      </div>

      {/* Lat/Lng manual input */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="latitude" className="block text-sm font-medium text-text-primary mb-1">
            Latitude <span className="text-primary text-xs">(wajib)</span>
          </label>
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            required
            value={latInput}
            onChange={e => { clearFieldError('latitude'); handleLatChange(e.target.value) }}
            aria-invalid={fieldErrors.latitude ? true : undefined}
            className={`${coordInputClass}${fieldErrors.latitude ? ' border-danger' : ''}`}
            placeholder="-6.12345"
          />
          {fieldErrors.latitude && (
            <p className="mt-1.5 text-sm text-danger">{fieldErrors.latitude}</p>
          )}
        </div>
        <div>
          <label htmlFor="longitude" className="block text-sm font-medium text-text-primary mb-1">
            Longitude <span className="text-primary text-xs">(wajib)</span>
          </label>
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            required
            value={lngInput}
            onChange={e => { clearFieldError('longitude'); handleLngChange(e.target.value) }}
            aria-invalid={fieldErrors.longitude ? true : undefined}
            className={`${coordInputClass}${fieldErrors.longitude ? ' border-danger' : ''}`}
            placeholder="106.45678"
          />
          {fieldErrors.longitude && (
            <p className="mt-1.5 text-sm text-danger">{fieldErrors.longitude}</p>
          )}
        </div>
      </div>
      {coordError && (
        <p className="text-sm text-danger flex items-center gap-1.5 -mt-4">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {coordError}
        </p>
      )}
      {pin && !coordError && (
        <p className="text-sm text-status-approved-text flex items-center gap-1.5 -mt-4">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Lokasi dipilih: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
        </p>
      )}

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-text-primary mb-1">
          Alamat <span className="text-primary text-xs">(wajib)</span>
        </label>
        <input
          ref={addressRef}
          id="address" name="address" type="text" required maxLength={500}
          onInput={() => clearFieldError('address')}
          aria-invalid={fieldErrors.address ? true : undefined}
          className={`${inputClass}${fieldErrors.address ? ' border-danger' : ''}`}
          placeholder={geocoding ? 'Memuat alamat...' : 'cth. Jl. Raya Desa No. 12'}
        />
        {fieldErrors.address && (
          <p className="mt-1.5 text-sm text-danger">{fieldErrors.address}</p>
        )}
      </div>

      {/* Region fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="kelurahan" className="block text-sm font-medium text-text-primary mb-1">Kelurahan / Desa</label>
          <input ref={kelurahanRef} id="kelurahan" name="kelurahan" type="text" maxLength={100}
            onInput={() => clearFieldError('kelurahan')}
            aria-invalid={fieldErrors.kelurahan ? true : undefined}
            className={`${inputClass}${fieldErrors.kelurahan ? ' border-danger' : ''}`} />
          {fieldErrors.kelurahan && (
            <p className="mt-1.5 text-sm text-danger">{fieldErrors.kelurahan}</p>
          )}
        </div>
        <div>
          <label htmlFor="kecamatan" className="block text-sm font-medium text-text-primary mb-1">Kecamatan</label>
          <input ref={kecamatanRef} id="kecamatan" name="kecamatan" type="text" maxLength={100}
            onInput={() => clearFieldError('kecamatan')}
            aria-invalid={fieldErrors.kecamatan ? true : undefined}
            className={`${inputClass}${fieldErrors.kecamatan ? ' border-danger' : ''}`} />
          {fieldErrors.kecamatan && (
            <p className="mt-1.5 text-sm text-danger">{fieldErrors.kecamatan}</p>
          )}
        </div>
        <div>
          <label htmlFor="kabupaten" className="block text-sm font-medium text-text-primary mb-1">
            Kabupaten / Kota <span className="text-primary text-xs">(wajib)</span>
          </label>
          <input ref={kabupatenRef} id="kabupaten" name="kabupaten" type="text" required maxLength={100}
            onInput={() => clearFieldError('kabupaten')}
            aria-invalid={fieldErrors.kabupaten ? true : undefined}
            className={`${inputClass}${fieldErrors.kabupaten ? ' border-danger' : ''}`} />
          {fieldErrors.kabupaten && (
            <p className="mt-1.5 text-sm text-danger">{fieldErrors.kabupaten}</p>
          )}
        </div>
        <div>
          <label htmlFor="provinsi" className="block text-sm font-medium text-text-primary mb-1">
            Provinsi <span className="text-primary text-xs">(wajib)</span>
          </label>
          <input ref={provinsiRef} id="provinsi" name="provinsi" type="text" required maxLength={100}
            onInput={() => clearFieldError('provinsi')}
            aria-invalid={fieldErrors.provinsi ? true : undefined}
            className={`${inputClass}${fieldErrors.provinsi ? ' border-danger' : ''}`} />
          {fieldErrors.provinsi && (
            <p className="mt-1.5 text-sm text-danger">{fieldErrors.provinsi}</p>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1">Nomor Telepon</label>
          <input
            id="phone" name="phone" type="tel" autoComplete="tel" maxLength={20}
            onInput={() => clearFieldError('phone')}
            aria-invalid={fieldErrors.phone ? true : undefined}
            className={`${inputClass} font-mono${fieldErrors.phone ? ' border-danger' : ''}`}
            placeholder="cth. 0812-3456-7890"
          />
          {fieldErrors.phone && (
            <p className="mt-1.5 text-sm text-danger">{fieldErrors.phone}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">Email</label>
          <input
            id="email" name="email" type="email" autoComplete="email"
            onInput={() => clearFieldError('email')}
            aria-invalid={fieldErrors.email ? true : undefined}
            className={`${inputClass}${fieldErrors.email ? ' border-danger' : ''}`}
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-sm text-danger">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      {/* Photo dropzone */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Foto Koperasi
        </label>
        <p className="text-sm text-text-secondary mb-1.5">
          Foto gedung atau kegiatan koperasi. Maks. 5MB (JPG, PNG, WebP).
        </p>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file && file.type.startsWith('image/')) {
              setPhotoName(file.name)
              if (photoPreview) { URL.revokeObjectURL(photoPreview) }
              setPhotoPreview(URL.createObjectURL(file))
            }
          }}
          className={`relative flex flex-col items-center justify-center gap-2 h-36 px-4 border-2 border-dashed rounded-xl bg-surface transition-[border-color,background-color] duration-120 ease-out ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary hover:bg-surface-raised'
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-disabled" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span className="text-sm text-text-secondary text-center">
            {dragOver ? 'Lepaskan foto di sini...' : photoName ?? 'Seret & lepas foto ke sini'}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => document.getElementById('photo-gallery')?.click()}
              className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors duration-120"
            >
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                Gallery
              </span>
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('photo-camera')?.click()}
              className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors duration-120"
            >
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
                Kamera
              </span>
            </button>
          </div>
          <span className="text-sm text-text-disabled">JPG, PNG, WebP - Maks 5MB</span>
          {/* Gallery input */}
          <input
            id="photo-gallery"
            name="photo"
            type="file"
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
          {/* Camera input */}
          <input
            id="photo-camera"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
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
        </div>
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
                const galleryInput = document.getElementById('photo-gallery') as HTMLInputElement
                const cameraInput = document.getElementById('photo-camera') as HTMLInputElement
                if (galleryInput) { galleryInput.value = '' }
                if (cameraInput) { cameraInput.value = '' }
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-danger text-white rounded-full flex items-center justify-center shadow-lg hover:bg-danger/90 transition-colors duration-120"
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
          className="submit-error bg-danger/5 border border-danger/30 rounded-lg px-4 py-3 text-sm text-danger"
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
