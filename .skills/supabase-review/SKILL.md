# supabase-review

Supabase-specific review for the Koperasi Desa Merah Putih Map project.

## When to use

Run this skill when reviewing any PR or changeset that touches Supabase configuration, RLS policies, storage buckets, migrations, generated types, or the two-client pattern (`client.ts` / `server.ts`).

## Activation

Trigger: user says "supabase review", "review supabase", "RLS review", "storage policy review", or invokes `/supabase-review`.

## Instructions

You are reviewing Supabase usage in a civic-tech crowdsourced map of Indonesian village cooperatives. The project uses Next.js App Router + Supabase (PostgreSQL, PostGIS, Storage) deployed on Vercel. There is no auth — contributions are anonymous. Security depends entirely on RLS policies and the two-client pattern.

Work through each section below in order. For each section, read the relevant files, report findings, and flag any violations.

---

### 1. RLS Policy Review

Read all migration files in `supabase/migrations/` and any SQL in `supabase/seed.sql`.

Check that these RLS policies exist on `koperasi_points`:

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | anon, authenticated | `status IN ('approved', 'pending')` — pending is readable so users can vote on it |
| INSERT | anon, authenticated | No condition (public submission) |
| UPDATE | service_role only | No anon/authenticated policy for UPDATE |
| DELETE | service_role only | No anon/authenticated policy for DELETE |

Check that these RLS policies exist on `votes`:

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | anon, authenticated | Unrestricted (vote counts are public) |
| INSERT | anon, authenticated | No condition (public voting) |
| UPDATE | service_role only | No policy |
| DELETE | service_role only | No policy |

**Verification test (describe, do not run):** Using the anon key, attempt an UPDATE on `koperasi_points` — it must fail. Attempt a DELETE — it must fail. Document the test commands a contributor can run to verify.

Flag if:
- RLS is not enabled on either table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` missing)
- Any policy grants UPDATE or DELETE to anon/authenticated
- SELECT policy on `koperasi_points` exposes rows with `status = 'removed'`

---

### 2. The Two-Client Pattern (Security-Critical)

Read `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`.

**client.ts** must:
- Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only
- Be safe to import in browser / "use client" components
- Never reference `SUPABASE_SERVICE_ROLE_KEY`

**server.ts** must:
- Use `SUPABASE_SERVICE_ROLE_KEY`
- Only be imported in `src/app/api/` route handlers (server-side only)
- Never be imported by any file containing `"use client"` or any component file

**Trace imports:** Search the entire `src/` tree for imports of `server.ts`. Every importing file must be inside `src/app/api/`. If any client component, page component, or layout imports `server.ts`, flag it as **CRITICAL**.

Search for any file that imports `client.ts` inside `src/app/api/` — this is a logic bug (API routes should use the service role client, not the anon client) though not a security hole. Flag as **WARNING**.

---

### 3. Storage Bucket Policy Review

Read migration files and any Supabase dashboard config for the `koperasi-photos` bucket.

Check:
- Bucket exists and is created in migrations
- Public read is enabled (photos are publicly viewable for approved points)
- Upload policy: INSERT allowed for anon (so submissions can include photos)
- The application code (not storage RLS) enforces that photo URLs are only returned when `status = 'approved'`
- No policy allows anon to DELETE or UPDATE storage objects

Flag if:
- Bucket is set to private with no read policy (breaks photo display)
- Bucket allows unrestricted listing (directory traversal — users could enumerate all uploads including pending/removed)
- Upload path is user-controlled (should be `{point_id}/{uuid}.{ext}`, generated server-side)

---

### 4. Generated Types

Read `src/lib/supabase/types.ts`.

Check:
- File is auto-generated (has `@generated` or Supabase CLI header comment)
- Types match current migration state (koperasi_points has all expected columns, votes has all expected columns)
- `geography` column typed correctly (Supabase generates this as `unknown` — check if there is a manual override or helper type)

Flag if:
- Types file is hand-edited without comment explaining why
- Types are missing columns that exist in migrations (stale types — someone ran a migration but forgot `supabase gen types typescript`)
- Any code uses `as any` to work around stale types instead of regenerating

Remind contributor: after any migration, run:
```bash
supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
```

---

### 5. Migration Review

Read all files in `supabase/migrations/`.

A good migration in this project:
- Is idempotent where possible (`CREATE INDEX IF NOT EXISTS`, `CREATE EXTENSION IF NOT EXISTS`)
- Has a comment block at the top with `-- DOWN:` instructions (since Supabase CLI does not support down migrations natively)
- Enables PostGIS (`CREATE EXTENSION IF NOT EXISTS postgis`) before creating any `geography` column
- Creates indexes after the table, not inline
- Does not use `SET LOCAL` or prepared statements (PgBouncer transaction mode)
- Does not use advisory locks
- Uses `geography(Point, 4326)` not `geometry` for lat/lng storage

Flag if:
- A migration uses `ALTER TABLE ... DROP COLUMN` without a corresponding backup/rollback comment
- A migration creates a geography column without ensuring PostGIS is enabled first
- A migration uses `SET LOCAL`, `PREPARE`, or `pg_advisory_lock`

---

### 6. The PgBouncer Gotcha

Supabase uses PgBouncer in transaction mode for pooled connections. This means:

- No prepared statements (`PREPARE` / `EXECUTE`)
- No `SET LOCAL` (resets at transaction boundary, which PgBouncer may reuse)
- No advisory locks (`pg_advisory_lock` — session-level, PgBouncer multiplexes sessions)

Search the codebase for any usage of these patterns. The Supabase JS client handles this correctly by default, but if there is any raw SQL (e.g., in `src/lib/geo.ts` or migration files), check for violations.

Flag if: any application code (not migrations) uses prepared statements, SET LOCAL, or advisory locks.

---

### 7. Edge Functions vs API Routes

This project uses Next.js API routes (`src/app/api/`), not Supabase Edge Functions. This is intentional:

- Contributor legibility: Next.js is more widely known than Deno-based Edge Functions
- Single deployment target: everything deploys to Vercel
- Testability: API routes can be tested with standard Node.js test tooling

Flag if:
- A `supabase/functions/` directory exists with Edge Functions (should not exist in this project)
- Any code references `supabase.functions.invoke()` (should use `fetch('/api/...')` instead)

---

### 8. Free Tier Limits

Verify the project stays within Supabase free tier:

| Resource | Limit | This project's usage |
|----------|-------|---------------------|
| Database | 500 MB | Monitor row count in koperasi_points — with geography + indexes, estimate ~1KB per row, so ~500K rows max |
| Storage | 1 GB | At 5MB max per photo, ~200 photos. If adoption grows, need to compress or move to external CDN |
| File upload | 50 MB max | Project enforces 5 MB — well within limit |
| Bandwidth | 2 GB / month | Map tile requests do not go through Supabase. Photo serving does. Monitor. |

Flag if:
- Photo upload limit is set above 5 MB anywhere in the code
- There is no monitoring or warning about approaching storage limits
- Photos are not compressed/resized before upload (nice-to-have, not blocking)

---

### 9. Common Supabase Mistakes in This Codebase

Search for these patterns:

1. **Using `client.ts` in a server component:** Search for imports of the anon client in any `page.tsx`, `layout.tsx`, or server component. The anon client works but bypasses service role — may cause RLS to block operations that should succeed server-side.

2. **Forgetting to `await`:** Search for `supabase.from(` calls that are not awaited. The Supabase JS client returns a Promise-like object — forgetting `await` silently returns `{ data: null, error: null }`.

3. **Not handling Supabase errors:** The Supabase client returns `{ data, error }` — never throws. Search for any call that destructures only `{ data }` without checking `error`. Every Supabase call must check:
   ```typescript
   const { data, error } = await supabase.from(...).select(...)
   if (error) { /* handle */ }
   ```

4. **Using `.single()` without handling "no rows":** `.single()` returns an error if zero or multiple rows match. Check that all `.single()` calls handle the `PGRST116` error code (no rows found).

---

### 10. Review Checklist

Before completing the review, confirm each item:

- [ ] RLS enabled on `koperasi_points` — SELECT limited to approved+pending, no anon UPDATE/DELETE
- [ ] RLS enabled on `votes` — INSERT allowed, no anon UPDATE/DELETE
- [ ] `client.ts` uses anon key only, `server.ts` uses service role key
- [ ] No client component imports `server.ts`
- [ ] No API route imports `client.ts` (warning, not critical)
- [ ] Storage bucket `koperasi-photos` has correct read/write policies
- [ ] Photo URLs only returned for approved points
- [ ] Generated types match current migrations
- [ ] All migrations are idempotent, have DOWN comments, enable PostGIS first
- [ ] No PgBouncer-incompatible patterns in application code
- [ ] No Supabase Edge Functions in the project
- [ ] Photo upload limit is 5 MB server-side
- [ ] All Supabase calls are awaited
- [ ] All Supabase calls check `{ error }` in response
- [ ] No `.single()` call without handling zero-row case

---

### 11. Exit Criteria

The review is complete when:

1. Every item in the checklist above is confirmed or has a filed finding
2. All CRITICAL findings are reported with file path, line number, and fix suggestion
3. All WARNING findings are reported with explanation of risk
4. A summary is provided: X critical / Y warning / Z info findings
