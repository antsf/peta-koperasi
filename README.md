# Peta Koperasi Desa Merah Putih

Peta crowdsourced lokasi Koperasi Desa Merah Putih di seluruh Indonesia. Siapa pun bisa menambahkan titik, komunitas yang memverifikasi.

**[→ Buka peta](https://peta-koperasi.vercel.app)**

---

## Fitur

- Peta interaktif seluruh Indonesia (Leaflet + OpenStreetMap)
- Submit lokasi koperasi secara anonim
- Verifikasi komunitas lewat voting (upvote/downvote)
- Foto koperasi (tampil setelah diverifikasi)
- Filter per provinsi/kabupaten
- Bilingual: Bahasa Indonesia + English
- Tanpa akun, tanpa login

## Cara Kontribusi Data

1. Buka peta → klik **Tambah Koperasi**
2. Tandai lokasi di peta
3. Isi nama, alamat, kabupaten, provinsi
4. Submit — data langsung masuk antrian verifikasi
5. Komunitas voting: 3 upvote → approved, 3 downvote → flagged

## Development

```bash
git clone https://github.com/antsf/peta-koperasi
cd peta-koperasi
npm install
cp .env.local.example .env.local
# Isi Supabase URL + keys di .env.local
npm run dev
```

Buka `http://localhost:3000`.

### Environment Variables

| Variabel | Keterangan |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `NEXT_PUBLIC_MAP_CENTER_LAT` | Default center lat (opsional) |
| `NEXT_PUBLIC_MAP_CENTER_LNG` | Default center lng (opsional) |
| `NEXT_PUBLIC_MAP_DEFAULT_ZOOM` | Default zoom level (opsional) |

### Database Setup

1. Buat project di [supabase.com](https://supabase.com)
2. Enable PostGIS: `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Jalankan `supabase/migrations/001_initial_schema.sql` di SQL Editor
4. Buat storage bucket `koperasi-photos` (public: on)

### Tests

```bash
npm test
```

## Tech Stack

- **Framework:** Next.js 14+ (App Router) — Vercel
- **Database:** Supabase (PostgreSQL + PostGIS)
- **Map:** Leaflet + OpenStreetMap
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript strict

## Arsitektur

Lihat [`SPEC.md`](SPEC.md) untuk spesifikasi teknis lengkap dan [`soul.md`](soul.md) untuk filosofi project.

## Lisensi

MIT
