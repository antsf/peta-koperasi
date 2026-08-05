# SPEC.md — Koperasi Desa Merah Putih Map

Technical Specification v1.0 (MVP)

---

## 1. Problem Statement

Indonesia has 120,000+ cooperatives, most invisible online. No unified, public, searchable map exists. Government data is fragmented and stale. Citizens cannot discover cooperatives near them. This project provides a crowdsourced, community-verified map of village cooperatives across Indonesia.

---

## 2. User Stories

### 2.1 Visitor (unauthenticated, read-only)

| ID | Story |
|----|-------|
| V1 | As a visitor, I can see a map of Indonesia with pins for approved cooperatives so I can browse what exists near me. |
| V2 | As a visitor, I can click a pin to see the cooperative's name, address, contact info, and photo. |
| V3 | As a visitor, I can search by province, kabupaten, or kecamatan to filter the map. |
| V4 | As a visitor, I can switch the UI between Bahasa Indonesia and English. |
| V5 | As a visitor, I can see how many cooperatives are on the map (total count). |

### 2.2 Contributor (unauthenticated, submits data)

| ID | Story |
|----|-------|
| C1 | As a contributor, I can submit a new cooperative by filling a form with name, location, contact, and optional photo with preview. |
| C2 | As a contributor, I see a confirmation that my submission is pending community review. |
| C3 | As a contributor, I can place the pin by clicking on the map. |
| C4 | As a contributor, I can enter latitude and longitude manually in dedicated input fields. |
| C5 | As a contributor, I can use the "Use my location" button to auto-fill coordinates from my device's GPS. |
| C6 | As a contributor, I see inline validation errors if coordinates are outside Indonesia bounds. |
| C7 | As a contributor, address fields (address, village, district, regency, province) are auto-filled when I select a location on the map, use GPS, or enter coordinates. |

### 2.3 Community Voter (unauthenticated, verifies data)

| ID | Story |
|----|-------|
| CV1 | As a voter, I can see a list/map of pending submissions awaiting verification. |
| CV2 | As a voter, I can upvote a pending submission to signal "this is real." |
| CV3 | As a voter, I can downvote a pending submission to signal "this looks wrong/fake." |
| CV4 | As a voter, I cannot vote twice on the same submission (enforced via IP + browser fingerprint). |

---

## 3. Data Model

### 3.1 Table: `koperasi_points`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `name` | `text` | NOT NULL, max 200 chars | Cooperative name |
| `location` | `geography(Point, 4326)` | NOT NULL | PostGIS point (lng, lat) |
| `latitude` | `float8` | NOT NULL | Denormalized for convenience |
| `longitude` | `float8` | NOT NULL | Denormalized for convenience |
| `address` | `text` | NOT NULL | Free-text street address |
| `kelurahan` | `text` | | Village/kelurahan name |
| `kecamatan` | `text` | | Sub-district |
| `kabupaten` | `text` | NOT NULL | Regency/city |
| `provinsi` | `text` | NOT NULL | Province |
| `phone` | `text` | | Contact phone |
| `email` | `text` | | Contact email |
| `photo_path` | `text` | | Supabase Storage path, NULL if no photo |
| `status` | `text` | NOT NULL, default `'pending'` | Enum: `pending`, `approved`, `flagged`, `removed` |
| `upvotes` | `int4` | NOT NULL, default `0` | Cached count |
| `downvotes` | `int4` | NOT NULL, default `0` | Cached count |
| `submitter_ip` | `text` | | Hashed, for abuse tracking only |
| `submitter_fingerprint` | `text` | | Hashed |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_koperasi_location` — GIST index on `location` column for spatial queries.
- `idx_koperasi_status` — B-tree on `status` for filtering.
- `idx_koperasi_provinsi` — B-tree on `provinsi` for region search.
- `idx_koperasi_kabupaten` — B-tree on `kabupaten` for region search.

**RLS Policy:** Read access for `approved` rows is public. Read access for `pending` rows is public (for voting page). Insert is public (anyone can submit). Update/delete is restricted to service role only.

### 3.2 Table: `votes`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `point_id` | `uuid` | FK → `koperasi_points.id`, NOT NULL | |
| `vote_type` | `text` | NOT NULL, CHECK `in ('up', 'down')` | |
| `voter_ip` | `text` | NOT NULL | Hashed IP |
| `voter_fingerprint` | `text` | NOT NULL | Hashed browser fingerprint |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_votes_point_id` — B-tree on `point_id`.
- `idx_votes_dedup` — UNIQUE on `(point_id, voter_ip, voter_fingerprint)` to prevent duplicate votes.

### 3.3 Supabase Storage Bucket: `koperasi-photos`

- Public read access only for photos linked to approved points.
- Max file size: 5 MB.
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`.
- Files named: `{point_id}/{uuid}.{ext}`.

---

## 4. API Routes (Next.js App Router)

All routes under `app/api/`. Responses are JSON.

### 4.1 `GET /api/points`

Fetch approved points within a map viewport.

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `north` | float | Yes | Viewport north latitude |
| `south` | float | Yes | Viewport south latitude |
| `east` | float | Yes | Viewport east longitude |
| `west` | float | Yes | Viewport west longitude |
| `status` | string | No | Filter by status. Default: `approved`. Allowed: `approved`, `pending`. |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Koperasi Maju Bersama",
      "latitude": -6.123,
      "longitude": 106.456,
      "kabupaten": "Bogor",
      "provinsi": "Jawa Barat",
      "status": "approved"
    }
  ],
  "count": 42
}
```

**SQL core:** `SELECT ... FROM koperasi_points WHERE status = $1 AND ST_Within(location, ST_MakeEnvelope($west, $south, $east, $north, 4326))`.

### 4.2 `GET /api/points/[id]`

Fetch full detail of a single point.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Koperasi Maju Bersama",
    "latitude": -6.123,
    "longitude": 106.456,
    "address": "Jl. Raya Bogor No. 12",
    "kelurahan": "Sukamaju",
    "kecamatan": "Ciawi",
    "kabupaten": "Bogor",
    "provinsi": "Jawa Barat",
    "phone": "0812-xxxx-xxxx",
    "email": "koperasi@example.com",
    "photo_url": "https://...supabase.co/storage/v1/object/public/koperasi-photos/...",
    "status": "approved",
    "upvotes": 5,
    "downvotes": 0,
    "created_at": "2026-01-15T10:00:00Z"
  }
}
```

**Note:** `photo_url` is only returned when `status = 'approved'`. For `pending` points, `photo_url` is `null`.

### 4.3 `POST /api/points`

Submit a new cooperative point.

**Request body (multipart/form-data):**
| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `latitude` | float | Yes |
| `longitude` | float | Yes |
| `address` | string | Yes |
| `kelurahan` | string | No |
| `kecamatan` | string | No |
| `kabupaten` | string | Yes |
| `provinsi` | string | Yes |
| `phone` | string | No |
| `email` | string | No |
| `photo` | File | No |

**Headers extracted server-side:** `x-forwarded-for` (IP), `x-fingerprint` (client sends hashed fingerprint).

**Response 201:**
```json
{
  "data": { "id": "uuid", "status": "pending" },
  "message": "Submission received. Awaiting community verification."
}
```

**Validation:**
- `name` max 200 chars, trimmed.
- `latitude` between -11 and 6 (Indonesia bounds).
- `longitude` between 95 and 141 (Indonesia bounds).
- `kabupaten` and `provinsi` required, non-empty.
- Photo max 5 MB, image types only.
- Rate limit: max 10 submissions per IP per hour.

### 4.4 `POST /api/points/[id]/vote`

Cast a vote on a pending point.

**Request body:**
```json
{
  "vote_type": "up" | "down"
}
```

**Headers:** `x-forwarded-for`, `x-fingerprint`.

**Response 200:**
```json
{
  "data": { "upvotes": 3, "downvotes": 0, "status": "approved" },
  "message": "Vote recorded."
}
```

**Response 409:** `{ "error": "You have already voted on this submission." }`

**Business logic:** see Section 5.

### 4.5 `GET /api/regions`

List distinct provinsi and kabupaten values for search/filter dropdowns.

**Response 200:**
```json
{
  "data": [
    {
      "provinsi": "Jawa Barat",
      "kabupaten_list": ["Bogor", "Bandung", "Cirebon"]
    }
  ]
}
```

### 4.6 `GET /api/stats`

Simple public stats.

**Response 200:**
```json
{
  "total_approved": 1234,
  "total_pending": 56,
  "total_provinces": 15
}
```

---

## 5. Voting Logic

### 5.1 Pseudocode

```
function castVote(pointId, voteType, voterIp, voterFingerprint):
    point = getPoint(pointId)

    if point.status not in ['pending', 'flagged']:
        return error("Voting closed for this point.")

    existingVote = findVote(pointId, voterIp, voterFingerprint)
    if existingVote:
        return error(409, "Already voted.")

    insertVote(pointId, voteType, hash(voterIp), hash(voterFingerprint))

    if voteType == 'up':
        point.upvotes += 1
    else:
        point.downvotes += 1

    // Status transitions
    if point.status == 'pending' and point.upvotes >= 3:
        point.status = 'approved'
    elif point.status == 'pending' and point.downvotes >= 3:
        point.status = 'flagged'
    elif point.status == 'flagged' and point.downvotes >= 6:
        point.status = 'removed'
    elif point.status == 'flagged' and point.upvotes >= 5:
        point.status = 'approved'  // community override

    updatePoint(point)
    return { upvotes, downvotes, status }
```

### 5.2 Status Transition Diagram

```
              3 upvotes                    5 upvotes (override)
  [pending] ──────────► [approved] ◄──────────── [flagged]
      │                                              │
      │ 3 downvotes                    6 downvotes   │
      └──────────────► [flagged] ────────────────► [removed]
```

### 5.3 Anti-Sybil Dedup

- Each vote is uniquely identified by `(point_id, hashed_ip, hashed_fingerprint)`.
- Both IP and fingerprint must match for dedup — different fingerprints on the same IP are treated as different voters (shared networks).
- Fingerprint is generated client-side using FingerprintJS (open-source free tier) and sent as a hashed header.
- IP is extracted server-side from `x-forwarded-for`.
- All stored values are SHA-256 hashed. Raw IPs and fingerprints are never persisted.

---

## 6. UI Pages & Components

### 6.1 Pages (App Router)

| Route | Description |
|-------|-------------|
| `/` | Home — full-screen map with pins, search bar, language toggle |
| `/submit` | Submit form — map picker + form fields |
| `/pending` | List/map of pending submissions with vote buttons |
| `/point/[id]` | Detail page for a single cooperative point |

### 6.2 Shared Components

| Component | Description |
|-----------|-------------|
| `MapView` | Leaflet map, loads pins via viewport bounding box, plain markers (no clustering in v1) |
| `MapPin` | Individual pin with popup (name, kabupaten, status indicator) |
| `PointCard` | Card showing cooperative details (used in detail page and pending list) |
| `SubmitForm` | Form with fields matching POST /api/points, includes map pin picker, manual lat/lng input, geolocation button, and reverse geocoding auto-fill |
| `VoteButtons` | Upvote/downvote buttons with counts, disabled after voting |
| `RegionFilter` | Province + kabupaten cascading dropdowns |
| `SearchBar` | Text search + region filter combined |
| `LanguageToggle` | ID/EN switcher, persisted to localStorage |
| `PhotoDisplay` | Shows photo only for approved points, placeholder otherwise |
| `Header` | Logo, nav links, language toggle, stats counter |
| `Footer` | MIT license note, GitHub link |

### 6.3 Client-Only Components

`MapView`, `VoteButtons`, and `SubmitForm` require `"use client"` due to Leaflet DOM dependency and interactive state. Everything else is a server component by default.

---

## 7. File Structure

```
peta-koperasi/
├── soul.md
├── SPEC.md
├── CLAUDE.md
├── LICENSE                         # MIT
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local.example
├── public/
│   ├── marker-default.svg
│   ├── marker-pending.svg
│   └── og-image.png
├── messages/
│   ├── id.json                     # Bahasa Indonesia i18n strings
│   └── en.json                     # English i18n strings
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, font, metadata
│   │   ├── page.tsx                # Home (map)
│   │   ├── submit/
│   │   │   └── page.tsx
│   │   ├── pending/
│   │   │   └── page.tsx
│   │   ├── point/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── points/
│   │       │   ├── route.ts        # GET (list) + POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts    # GET (detail)
│   │       │       └── vote/
│   │       │           └── route.ts
│   │       ├── regions/
│   │       │   └── route.ts
│   │       └── stats/
│   │           └── route.ts
│   ├── components/
│   │   ├── map-view.tsx
│   │   ├── submit-form.tsx
│   │   ├── submit-page-client.tsx
│   │   ├── vote-buttons.tsx
│   │   ├── region-filter.tsx
│   │   ├── photo-display.tsx
│   │   ├── status-badge.tsx
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── locale-provider.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser Supabase client
│   │   │   ├── server.ts           # Server Supabase client (service role)
│   │   │   └── types.ts            # Generated DB types
│   │   ├── fingerprint.ts          # FingerprintJS init + hash helper
│   │   ├── geo.ts                  # PostGIS query builders
│   │   ├── validation.ts           # Zod schemas for API input
│   │   ├── hash.ts                 # SHA-256 hashing utility
│   │   └── i18n.ts                 # i18n loader and hook
│   └── types/
│       └── index.ts                # Shared TypeScript types
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # Tables, indexes, RLS policies
```

---

## 8. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_MAP_CENTER_LAT` | No | Default map center latitude (default: `-2.5`) |
| `NEXT_PUBLIC_MAP_CENTER_LNG` | No | Default map center longitude (default: `118.0`) |
| `NEXT_PUBLIC_MAP_DEFAULT_ZOOM` | No | Default zoom level (default: `5`) |

---

## 9. Deployment Checklist

### Supabase Setup
1. Create a new Supabase project.
2. Enable the PostGIS extension: `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Run `supabase/migrations/001_initial_schema.sql`.
4. Create the `koperasi-photos` storage bucket with public read access.
5. Configure storage bucket policies: allow public uploads (with size/type restrictions), public reads for approved photos only.
6. Copy project URL, anon key, and service role key.

### Vercel Setup
1. Import repo from GitHub.
2. Set all environment variables from Section 8.
3. Set Node.js version to 20.x.
4. Deploy. Verify the map loads and PostGIS queries work.

### Post-Deploy Verification
1. Open the site. Map should render centered on Indonesia.
2. Submit a test cooperative. Verify it appears in /pending with status `pending`.
3. Vote on it 3 times from different browsers/IPs. Verify it transitions to `approved`.
4. Verify the photo becomes visible only after approval.
5. Test region filter dropdown populates from actual data.
6. Test language toggle switches all UI text.

---

## 10. Out of Scope for v1

These are explicitly excluded from the MVP:

- **Admin dashboard** — community self-governs via voting.
- **User authentication / login** — all actions are anonymous.
- **Edit or delete submissions** — once submitted, only status changes via votes.
- **Comments or discussion** on submissions.
- **Paid map tiles** — OSM only.
- **Reverse geocoding API** — contributor manually selects region fields.
- **Mobile native app** — responsive web only.
- **Data export / API for third parties** — future consideration.
- **Notification system** — no emails, no push.
- **Analytics / tracking** — no Google Analytics or similar.
- **Advanced search** (full-text, fuzzy) — simple region filter only.
- **Rate limiting infrastructure** (Redis, etc.) — basic in-memory or IP-based throttle only.
- **Automated moderation** (ML spam detection) — future consideration.
- **Cooperative categories/types** — all treated equally in v1.

---

## Appendix A: Indonesia Bounding Box

For input validation of lat/lng:
- Latitude: `-11.0` to `6.0`
- Longitude: `95.0` to `141.0`

## Appendix B: Status Enum Values

| Status | Visible on main map | Photo visible | Can be voted on |
|--------|-------------------|---------------|-----------------|
| `pending` | No | No | Yes |
| `approved` | Yes | Yes | No |
| `flagged` | No | No | Yes |
| `removed` | No | No | No |
