# Best Practices & Audit Checklist

Daftar standar industri untuk website Next.js + Supabase/PostGIS + Leaflet dengan model anonim & crowd-voting. Dokumen ini jadi referensi agar hal-hal seperti bug form/UX yang sudah diperbaiki tidak terlewat lagi.

Status: `[ ]` belum dikerjakan, `[x]` sudah/terpasang, `[~]` sebagian.

## 1. Keamanan
- [x] **Content-Security-Policy & security headers** di `next.config.ts` — CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. (Catatan: CSP masih `'unsafe-inline'`/`'unsafe-eval'` untuk kompatibilitas Next — perketat dengan nonce sebagai langkah lanjutan.)
- [ ] **Bot/abuse protection** — Cloudflare Turnstile (skill `turnstile-spin`) di submit + vote. Rate limit submission sudah ada (in-memory).
- [x] **Rate limit votes per IP** di `/api/points/[id]/vote` (30/jam/IP).
- [ ] Service-role Supabase key hanya di server (`createServerClient`), tidak bocor ke client bundle.
- [ ] Honeypot field di form submit.
- [ ] Tidak mengembalikan `error.message` Supabase mentah ke client.
- [x] Validasi Indonesia bounds + Zod di API (sudah terpasang — jaga tetap).

## 2. Kinerja (Core Web Vitals)
- [ ] Audit live via Chrome DevTools MCP (`npx -y chrome-devtools-mcp@latest`) + skill `web-perf`.
- [ ] Font self-hosted pakai `next/font`.
- [ ] Optimasi / resize foto Supabase storage (thumbnail/transform server-side).
- [ ] Caching GET: `/api/points`, `/api/regions`, `/api/stats` (`Cache-Control`/ISR).
- [ ] Bundle Leaflet via dynamic import (sudah); pastikan tidak ada import berat top-level.
- [x] `export const viewport` + `themeColor` di layout.

## 3. Aksesibilitas
- [ ] Map interaktif: keyboard nav, focus indicator, fallback daftar.
- [ ] `prefers-reduced-motion` untuk animasi.
- [ ] Pesan error form dikaitkan via `aria-describedby` + `role="alert"` (sudah ada `aria-invalid`).
- [ ] Kontras & label: status badge, region filter (cascading), mobile nav.

## 4. SEO & Metadata
- [x] `sitemap.xml` + `robots.txt` (dynamic untuk halaman detail approved).
- [ ] JSON-LD structured data (LocalBusiness) di halaman detail.
- [ ] Canonical URL.
- [ ] Verifikasi `manifest.json`, `apple-touch-icon.png`, `og-image.svg` ada.

## 5. Kualitas Kode & Testing
- [ ] API route tests (Vitest) — valid/invalid/edge (duplikat vote, out-of-bounds, missing field) — **belum ada** `route.test.ts`.
- [ ] Component tests: vote button disable-after-vote, photo-visibility logic.
- [ ] TS strict (sudah); jaga tidak ada `any` tanpa `// TODO`.
- [ ] CI pipeline (lint + typecheck + vitest).

## 6. Operasional / Reliability
- [ ] Error monitoring (Sentry / log terstruktur) — bukan analytics, tidak melanggar aturan anti-tracking.
- [ ] React Error Boundary client.
- [ ] RLS aktif di tabel publik; `photo_path` tidak terekspos untuk status non-approved (sudah dijaga di `geo.ts` — jangan dilonggarkan).

## 7. Produk/UX — anti "hal seperti ini terlewat"
- [x] Debounce & race-condition koordinat + geocode di submit form.
- [x] Global state Leaflet (`LeafletLib`) tidak bocor antar halaman.
- [x] Validasi client menyatu dengan schema Zod server yang sama.
- [x] State loading/unloading async (geocode, submit) dengan disabled + spinner.
- [x] Field optional (kelurahan/kecamatan/phone/email) dikirim `undefined` bila kosong, bukan string kosong/salah tipe.
- [x] `maxLength` input selaras dengan schema Zod.