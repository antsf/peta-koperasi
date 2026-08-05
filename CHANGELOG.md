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
- Mobile bottom navigation bar (Peta, Tambah, Verifikasi)
- Language toggle dipindahkan ke header, selalu terlihat
- Tagline di bawah peta di halaman utama (mobile only)
- Loading indicator untuk navigasi ke /submit
- Success screen di form submit: tombol "Tambah Koperasi Lain" dan link "Kembali ke Peta"
- Empty state untuk peta (zoom in prompt saat area kosong)
- Error state untuk region filter

### Changed
- Touch targets diperbesar ke minimum 44px (min-h-11/min-w-11) untuk semua tombol interaktif
- Vote buttons: teks "Setuju"/"Tidak Setuju" ditambahkan di samping ikon
- Nama koperasi ditampilkan penuh di mobile (tanpa abbrev)
- Footer padding ditambah untuk visibility bottom nav
- Peningkatan tinggi peta di mobile (min-h-[60vh])
- Form fields: Nama Koperasi dipindahkan ke atas (sebelum peta)
- Region filter: semua string menggunakan i18n
- VoteButtons: menambahkan callback onVoteComplete untuk reload data

### Fixed
- Semua hardcoded strings diganti dengan i18n (footer, point-card, pending page)
- Footer: "Peta dari OpenStreetMap" menggunakan i18n
- Point-card: "Lihat Detail" dan "Belum ada foto" menggunakan i18n
- Pending page: semua label dan status menggunakan i18n
- Geolocation button: touch target diperbesar ke min-h-11 min-w-11

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
