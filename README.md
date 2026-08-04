# Peta Koperasi Desa Merah Putih

> Peta crowdsourced lokasi Koperasi Desa Merah Putih di seluruh Indonesia.  
> Siapa pun bisa menambahkan titik — komunitas yang memverifikasi, bukan admin.

**[→ Buka Peta](https://peta-koperasi.vercel.app)** · [Laporkan masalah](https://github.com/antsf/peta-koperasi/issues) · [Kontribusi](CONTRIBUTING.md)

---

## Apa ini?

Program **Koperasi Desa Merah Putih** adalah inisiatif pemerintah untuk mendirikan koperasi di setiap desa dan kelurahan di Indonesia. Proyek ini adalah peta publik yang membantu masyarakat menemukan, memverifikasi, dan melaporkan keberadaan koperasi-koperasi tersebut.

**Prinsip utama:**
- Tanpa akun, tanpa login — semua aksi anonim
- Komunitas yang memverifikasi data lewat sistem voting
- Tidak ada admin — tidak ada satu pun orang yang bisa memanipulasi data sendirian
- Kode sumber terbuka — siapa pun bisa lihat, audit, dan kontribusi

---

## Fitur

| Fitur | Keterangan |
|-------|-----------|
| Peta interaktif | Leaflet + OpenStreetMap, viewport-bounded queries |
| Submit anonim | Tambah lokasi koperasi tanpa daftar akun |
| Voting komunitas | Upvote/downvote untuk verifikasi data |
| Foto koperasi | Upload foto — tampil hanya setelah diverifikasi |
| Filter wilayah | Saring per provinsi dan kabupaten |
| Bilingual | Bahasa Indonesia (default) + English |
| Anti-spam | Dedup vote via IP + browser fingerprint (hashed SHA-256) |

---

## Cara Kontribusi Data (Non-developer)

1. Buka **[peta-koperasi.vercel.app](https://peta-koperasi.vercel.app)**
2. Klik **+ Tambah Koperasi**
3. Tandai lokasi koperasi di peta
4. Isi nama, alamat, kabupaten, dan provinsi
5. Upload foto jika ada (opsional)
6. Klik **Submit** — titik langsung masuk antrian verifikasi

**Cara verifikasi:**
- Buka halaman **Verifikasi** (tab di atas)
- Periksa data tiap titik — vote ✓ jika benar, ✗ jika salah
- 3 upvote → titik muncul di peta
- 3 downvote → masuk flagged, butuh 6 total untuk dihapus

---

## Development

### Prasyarat

- Node.js 18+
- Akun [Supabase](https://supabase.com) (gratis)

### Setup lokal

```bash
# 1. Clone
git clone https://github.com/antsf/peta-koperasi
cd peta-koperasi

# 2. Install dependencies
npm install

# 3. Salin file environment
cp .env.local.example .env.local
# Edit .env.local — isi Supabase URL + keys

# 4. Setup database (sekali saja)
# Buka Supabase dashboard → SQL Editor → jalankan:
# supabase/migrations/001_initial_schema.sql

# 5. Jalankan dev server
npm run dev
# Buka http://localhost:3000
```

### Environment Variables

| Variabel | Wajib | Keterangan |
|----------|-------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server only, jangan expose ke browser) |
| `NEXT_PUBLIC_MAP_CENTER_LAT` | ❌ | Default center latitude (default: `-2.5`) |
| `NEXT_PUBLIC_MAP_CENTER_LNG` | ❌ | Default center longitude (default: `118.0`) |
| `NEXT_PUBLIC_MAP_DEFAULT_ZOOM` | ❌ | Default zoom level (default: `5`) |

### Setup Database

```sql
-- 1. Enable PostGIS (SQL Editor Supabase)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Jalankan migration lengkap
-- Copy-paste isi file: supabase/migrations/001_initial_schema.sql
```

Buat storage bucket:
- Dashboard Supabase → **Storage** → **New bucket**
- Nama: `koperasi-photos`
- Public: **on**
- Max file size: 5MB
- Allowed types: `image/jpeg, image/png, image/webp`

### Perintah

```bash
npm run dev        # Dev server (http://localhost:3000)
npm run build      # Production build
npm run test       # Jalankan semua test (53 test)
npm run test:watch # Test mode watch (untuk development)
```

---

## Arsitektur

```
peta-koperasi/
├── src/
│   ├── app/
│   │   ├── api/             # API routes (Next.js Route Handlers)
│   │   │   ├── points/      # GET viewport query, POST submit
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET detail
│   │   │   │       └── vote/route.ts # POST vote
│   │   │   ├── regions/     # GET list provinsi + kabupaten
│   │   │   └── stats/       # GET total approved/pending
│   │   ├── point/[id]/      # Halaman detail koperasi
│   │   ├── pending/         # Halaman verifikasi komunitas
│   │   ├── submit/          # Form tambah koperasi
│   │   ├── layout.tsx       # Root layout (header, footer)
│   │   └── page.tsx         # Halaman utama (peta)
│   ├── components/          # React components
│   ├── lib/
│   │   ├── geo.ts           # PostGIS query helpers
│   │   ├── hash.ts          # SHA-256 PII hashing
│   │   ├── i18n.ts          # Bilingual translation hook
│   │   ├── validation.ts    # Zod schemas (semua API input)
│   │   └── supabase/        # Supabase clients (browser + server)
│   └── types/index.ts       # Shared TypeScript types
├── messages/
│   ├── id.json              # Teks Bahasa Indonesia
│   └── en.json              # English text
├── supabase/migrations/     # SQL schema + migrations
├── .skills/                 # Claude Code skill library (36 skills)
├── soul.md                  # Filosofi dan nilai project
├── SPEC.md                  # Spesifikasi teknis lengkap
└── CLAUDE.md                # Panduan untuk AI assistant
```

### Aturan arsitektur yang tidak boleh dilanggar

1. **Vote dedup wajib** — setiap vote dicek via `(point_id, hashed_ip, hashed_fingerprint)`
2. **Foto tersembunyi** — `photo_url` null untuk status selain `approved`
3. **PostGIS viewport query** — tidak pernah load semua titik sekaligus
4. **Tanpa autentikasi** — tidak ada login, tidak ada session
5. **Tanpa admin** — status berubah hanya lewat voting komunitas
6. **IP + fingerprint selalu di-hash** — SHA-256, raw value tidak pernah disimpan
7. **OpenStreetMap only** — tidak ada Google Maps, tidak ada Mapbox

Lihat [`CLAUDE.md`](CLAUDE.md) untuk daftar lengkap dan [`SPEC.md`](SPEC.md) untuk spesifikasi teknis.

---

## Sistem Voting

```
                    ┌─────────┐
          submit    │         │  3 upvote
         ─────────▶ │ pending │ ──────────▶ approved
                    │         │
                    └────┬────┘
                         │ 3 downvote
                         ▼
                    ┌─────────┐
                    │         │  6 downvote
                    │ flagged │ ──────────▶ removed
                    │         │
                    └────┬────┘
                         │ 5 upvote (override)
                         ▼
                       approved
```

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase — PostgreSQL + PostGIS |
| Storage | Supabase Storage |
| Map | Leaflet + OpenStreetMap |
| Styling | Tailwind CSS v4 |
| Language | TypeScript (strict mode) |
| Validation | Zod v4 |
| Fingerprint | FingerprintJS (open-source) |
| Hosting | Vercel |
| Test | Vitest |

---

## Kontribusi Kode

Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan lengkap.

**Singkatnya:**
1. Fork repo
2. Buat branch: `git checkout -b feat/nama-fitur`
3. Commit dengan pesan deskriptif
4. Buka Pull Request — semua PR disambut

---

## Filosofi

> *"Gotong royong digital — bersama kita petakan, bersama kita verifikasi."*

Lihat [`soul.md`](soul.md) untuk filosofi lengkap project ini.

---

## Lisensi

[MIT](LICENSE) — bebas digunakan, dimodifikasi, dan didistribusikan.

---

## Atribusi

- Peta tiles: [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Ikon peta: [Leaflet](https://leafletjs.com/)
