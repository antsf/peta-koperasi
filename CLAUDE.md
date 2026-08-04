# CLAUDE.md — Koperasi Desa Merah Putih Map

Project-specific instructions for Claude Code working in this repo.

---

## Project Overview

Crowdsourced map of village cooperatives (koperasi desa) across Indonesia. Anonymous submission, community voting for verification, bilingual UI (Bahasa Indonesia + English). No auth, no admin panel — the community governs itself.

Read `soul.md` for project philosophy. Read `SPEC.md` for full technical specification.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router) deployed on Vercel
- **Database:** Supabase (PostgreSQL + PostGIS extension)
- **Storage:** Supabase Storage (photos)
- **Map:** Leaflet + OpenStreetMap tiles (no paid tile providers). Plain markers (markercluster removed due to Turbopack CJS incompatibility).
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Fingerprinting:** FingerprintJS (free/open-source tier)
- **i18n:** JSON message files in `messages/id.json` and `messages/en.json`

---

## Code Style Rules

- TypeScript strict mode (`"strict": true` in tsconfig). No `any` types unless absolutely unavoidable — if used, add a `// TODO: type properly` comment.
- Tailwind CSS for all styling. No CSS modules, no styled-components, no inline style objects.
- Server components by default. Only add `"use client"` when the component genuinely needs browser APIs (Leaflet, event handlers, useState/useEffect).
- No unnecessary abstractions. Prefer flat, readable code. A 50-line component is fine. Do not create wrapper components that just pass props through.
- Use named exports, not default exports (except for page.tsx files which Next.js requires default).
- File naming: kebab-case for all files (`map-view.tsx`, not `MapView.tsx`).
- One component per file. Utility functions shared by multiple components go in `src/lib/`.
- API route handlers: validate input with Zod at the top of every handler. Return early on validation failure.
- All Supabase queries go through helper functions in `src/lib/supabase/` or `src/lib/geo.ts` — not inline in components or route handlers.

---

## Architectural Decisions — NEVER Violate

These are locked. Do not change, bypass, or "temporarily disable" any of these:

1. **Vote dedup is mandatory.** Every vote must be checked against `(point_id, hashed_ip, hashed_fingerprint)` before insertion. Never skip the dedup check. Never allow duplicate votes "for testing."

2. **Photos are hidden until approved.** The `photo_url` field must return `null` for any point where `status != 'approved'`. This applies to both the API response and the UI. Never render a photo for a pending/flagged/removed point.

3. **PostGIS viewport queries.** Currently uses latitude/longitude column comparisons (`.gte/.lte`). Migrate to `ST_Within(location, ST_MakeEnvelope(...))` for scaling to 75k+ pins. This is required before large-scale deployment.

4. **No authentication.** There is no login, no user accounts, no session management. All actions are anonymous. Do not add auth middleware, Supabase Auth, NextAuth, or any auth library.

5. **No admin dashboard.** There is no admin role, no admin routes, no admin UI. Status changes happen exclusively through community voting thresholds. Do not create `/admin` routes or service-role endpoints that bypass voting.

6. **IP and fingerprint are always hashed.** Raw IP addresses and browser fingerprints must never be stored in the database. SHA-256 hash them before any INSERT. The `hash.ts` utility handles this.

7. **OpenStreetMap tiles only.** No Google Maps, no Mapbox, no paid tile providers. Use `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` or equivalent free OSM tile servers.

8. **Indonesia bounds validation.** Latitude must be between -11.0 and 6.0, longitude between 95.0 and 141.0. Reject submissions outside these bounds at the API level.

9. **Status transitions follow the spec.** `pending → approved` (3 upvotes), `pending → flagged` (3 downvotes), `flagged → removed` (6 downvotes), `flagged → approved` (5 upvotes, community override). No other transitions are valid.

---

## Layout Approach

- **Home page (map):** Uses `calc(100vh - 4rem)` height to fill viewport. Map fills remaining space. Footer at viewport bottom.
- **Other pages:** Content flows naturally. No `overflow-y-auto` on page wrappers. Footer sits below content.
- **Root layout:** `min-h-full flex flex-col` on body. `flex-1` on main. Footer has `shrink-0`.

---

## Bilingual i18n Approach

- Two JSON files: `messages/id.json` (Bahasa Indonesia, default) and `messages/en.json`.
- Keys are nested by page/component: `{ "home": { "title": "...", "search_placeholder": "..." }, "submit": { ... } }`.
- Language preference is stored in `localStorage` under key `locale` (value: `"id"` or `"en"`).
- The `i18n.ts` module exports a `useTranslation()` hook for client components and a `getTranslation(locale)` function for server components.
- All user-facing strings must come from the message files. Never hardcode Indonesian or English text in components.
- Cooperative data (names, addresses) is NOT translated — it stays in whatever language the contributor used.

---

## What NOT to Do

- Do NOT add an admin dashboard, admin routes, or any privileged access.
- Do NOT add user authentication or login of any kind.
- Do NOT use paid map tile providers (Google Maps, Mapbox, etc.).
- Do NOT load all map points at once — always use viewport-bounded PostGIS queries.
- Do NOT store raw IP addresses or fingerprints — always hash first.
- Do NOT bypass vote deduplication for any reason.
- Do NOT add analytics or tracking scripts (Google Analytics, Mixpanel, etc.).
- Do NOT create a data export API in v1.
- Do NOT add cooperative categories or types — all cooperatives are equal in v1.
- Do NOT add comments, discussion threads, or social features.
- Do NOT install heavy dependencies without justification. Keep the bundle lean.

---

## Testing Approach

- **API routes:** Test with Vitest. Mock Supabase client. Test each route handler with valid input, invalid input, edge cases (duplicate votes, out-of-bounds coordinates, missing required fields).
- **Voting logic:** Unit test the state machine thoroughly — test every valid transition and verify invalid transitions are rejected.
- **Validation schemas:** Unit test Zod schemas with valid and invalid payloads.
- **Components:** Light integration tests only if complex logic exists. Do not test that "a div renders." Focus on vote button disable-after-vote behavior, photo visibility logic, and region filter cascading.
- **No E2E tests in v1.** Manual testing via the deployment checklist in SPEC.md.
- Test files live next to source: `src/lib/validation.test.ts`, `src/app/api/points/route.test.ts`, etc.

---

## How to Run Locally

```bash
# 1. Clone and install
git clone <repo-url>
cd peta-koperasi
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Fill in Supabase URL, anon key, and service role key

# 3. Set up Supabase
# Option A: Use Supabase CLI with local Docker
npx supabase start
npx supabase db push

# Option B: Use remote Supabase project
# Run supabase/migrations/001_initial_schema.sql in the SQL editor
# Enable PostGIS: CREATE EXTENSION IF NOT EXISTS postgis;

# 4. Run dev server
npm run dev
# Open http://localhost:3000

# 5. Run tests
npm test
```

---

## Key File Locations

| What | Where |
|------|-------|
| Project philosophy | `soul.md` |
| Full technical spec | `SPEC.md` |
| DB schema & migrations | `supabase/migrations/` |
| API routes | `src/app/api/` |
| Shared types | `src/types/index.ts` |
| Supabase clients | `src/lib/supabase/` |
| PostGIS query helpers | `src/lib/geo.ts` |
| Validation schemas | `src/lib/validation.ts` |
| i18n strings | `messages/id.json`, `messages/en.json` |
| i18n utilities | `src/lib/i18n.ts` |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
