# Panduan Kontribusi — Peta Koperasi Desa Merah Putih

Terima kasih sudah mau berkontribusi! Proyek ini terbuka untuk semua — dari perbaikan typo sampai fitur baru.

---

## Cara Berkontribusi

### 1. Laporkan Bug atau Saran

Buka [GitHub Issues](https://github.com/antsf/peta-koperasi/issues) dan buat issue baru. Sertakan:
- Langkah untuk mereproduksi bug
- Perilaku yang diharapkan vs yang terjadi
- Screenshot jika relevan
- Browser + OS

### 2. Kontribusi Data (Tanpa Coding)

Cukup buka situs dan submit/verifikasi koperasi. Lihat bagian **Cara Kontribusi Data** di [README.md](README.md).

### 3. Kontribusi Kode

```bash
# Fork dan clone
git clone https://github.com/USERNAME/peta-koperasi
cd peta-koperasi

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Isi Supabase URL + keys

# Buat branch baru
git checkout -b feat/nama-fitur
# atau: fix/deskripsi-bug

# Kerjakan perubahan, lalu test
npm test

# Commit
git add .
git commit -m "feat: tambah filter berdasarkan status"

# Push dan buka Pull Request
git push origin feat/nama-fitur
```

---

## Panduan Code Style

Ikuti aturan di [`CLAUDE.md`](CLAUDE.md). Ringkasannya:

### TypeScript
- Strict mode — tidak ada `any` kecuali terpaksa (tambahkan komentar `// TODO: type properly`)
- Named exports, bukan default exports (kecuali `page.tsx`)
- File naming: `kebab-case.tsx`

### Styling
- Tailwind CSS v4 saja — tidak ada CSS modules, tidak ada styled-components
- Design tokens ada di `src/app/globals.css` dalam blok `@theme`

### React
- Server components by default
- `"use client"` hanya kalau benar-benar butuh browser API (Leaflet, state, event)
- Satu komponen per file

### API Routes
- Validasi input dengan Zod di awal handler
- Return early kalau validasi gagal
- Semua query Supabase lewat helper di `src/lib/supabase/` atau `src/lib/geo.ts`

---

## Aturan yang TIDAK BOLEH dilanggar

Ini adalah aturan keras — PR yang melanggar ini tidak akan di-merge:

| Aturan | Alasan |
|--------|--------|
| Vote dedup WAJIB | Mencegah manipulasi data |
| Foto disembunyikan sampai approved | Privasi dan keakuratan data |
| Tidak ada autentikasi | Prinsip anonimitas project |
| Tidak ada admin dashboard | Desentralisasi — komunitas yang berkuasa |
| IP + fingerprint selalu di-hash | Privasi pengguna |
| OpenStreetMap only | Tidak ada ketergantungan vendor berbayar |
| PostGIS viewport query | Scalability — tidak load semua titik |

---

## Menulis Tests

Test wajib untuk:
- Logic voting (state machine)
- Validasi input (Zod schemas)
- API routes baru

```bash
npm test          # Jalankan sekali
npm run test:watch # Mode watch saat development
```

Test files diletakkan di samping source: `src/lib/validation.test.ts`.

---

## Commit Message Convention

Format: `type: deskripsi singkat`

| Type | Kapan dipakai |
|------|--------------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `chore` | Setup, config, dependency update |
| `docs` | Perubahan dokumentasi saja |
| `test` | Tambah atau perbaiki tests |
| `refactor` | Refactor tanpa mengubah behavior |
| `style` | Perubahan styling/CSS saja |

Contoh:
```
feat: tambah filter berdasarkan provinsi di peta
fix: foto muncul untuk titik pending (seharusnya tersembunyi)
docs: perbaiki instruksi setup di README
test: tambah test untuk transisi flagged → removed
```

---

## Pull Request

- **Judul PR** jelas dan deskriptif
- **Deskripsi** jelaskan apa yang diubah dan kenapa
- **Test** — pastikan `npm test` lulus sebelum buka PR
- **Scope kecil** — satu PR untuk satu perubahan. PR besar susah di-review
- **Screenshot** untuk perubahan UI

Template PR tersedia otomatis saat buka PR baru.

---

## Setup untuk Kontributor Baru

Butuh Supabase project sendiri untuk development lokal:

1. Daftar di [supabase.com](https://supabase.com) (gratis)
2. Buat project baru, region Singapore (`ap-southeast-1`)
3. SQL Editor → jalankan `supabase/migrations/001_initial_schema.sql`, lalu `002_viewport_query.sql`
4. Storage → buat bucket `koperasi-photos` (public: on)
5. Project Settings → API → copy URL + keys ke `.env.local`

---

## Ada Pertanyaan?

Buka [issue](https://github.com/antsf/peta-koperasi/issues) dengan label `question`. Kami akan jawab secepat mungkin.
