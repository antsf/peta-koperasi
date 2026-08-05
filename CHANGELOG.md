# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Input field latitude & longitude manual di form submit
- Tombol "Gunakan Lokasi Saya" untuk auto-fill koordinat dari GPS perangkat
- Validasi koordinat inline (client-side) untuk memastikan lokasi di wilayah Indonesia
- Sinkronisasi otomatis antara klik peta, input manual, dan geolokasi
- Reverse geocoding (Nominatim/OpenStreetMap) untuk auto-fill alamat, kelurahan, kecamatan, kabupaten, dan provinsi dari koordinat
- Pin draggable di peta submit — bisa di-drag atau klik untuk pilih lokasi
- Photo picker diganti jadi dropzone — bisa drag & drop atau klik untuk memilih

## [0.1.0] — 2026-08-04

### Added
- Peta interaktif Indonesia dengan Leaflet + OpenStreetMap
- Submit lokasi koperasi secara anonim (dengan opsional foto)
- Sistem voting komunitas: upvote/downvote per titik
- State machine status: `pending → approved/flagged → removed`
- Anti-sybil: dedup vote via hashed IP + browser fingerprint (SHA-256)
- Halaman `/pending` — daftar titik yang menunggu verifikasi
- Halaman detail `/point/[id]` — info lengkap + voting
- Filter per provinsi dan kabupaten
- Bilingual UI: Bahasa Indonesia (default) + English
- PostGIS viewport queries — tidak load semua titik sekaligus
- Foto disembunyikan hingga status `approved`
- Rate limiting: 10 submission per IP per jam
- 36-skill Claude Code skill library di `.skills/`
