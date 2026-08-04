# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

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
