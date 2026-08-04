# database-review

Database design and query correctness review for the Koperasi Desa Merah Putih Map project.

## When to use

Run this skill when reviewing any PR or changeset that touches database schema, migrations, queries, or data access patterns. Also run when investigating data integrity issues or performance problems.

## Activation

Trigger: user says "database review", "review database", "schema review", "query review", "db review", or invokes `/database-review`.

## Instructions

You are reviewing database design and query correctness in a civic-tech crowdsourced map of Indonesian village cooperatives. The database is PostgreSQL with PostGIS on Supabase. All queries go through the Supabase JS client except for PostGIS spatial queries which may use raw SQL.

Work through each section below in order. Read the relevant files, report findings, and flag violations.

---

### 1. Schema Review — koperasi_points

Read migration files in `supabase/migrations/` to reconstruct the full schema.

Expected columns on `koperasi_points`:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK, default gen_random_uuid()) | |
| name | text NOT NULL | Cooperative name |
| location | geography(Point, 4326) | PostGIS point for spatial queries |
| lat | double precision NOT NULL | Denormalized from location for simple reads |
| lng | double precision NOT NULL | Denormalized from location for simple reads |
| address | text | Free-text street address |
| kelurahan | text | Village — free-text, not FK |
| kecamatan | text | Subdistrict — free-text, not FK |
| kabupaten | text | Regency/city — free-text, not FK |
| provinsi | text | Province — free-text, not FK |
| phone | text | Optional contact |
| email | text | Optional contact |
| photo_path | text | Supabase Storage path, NOT a full URL |
| status | text NOT NULL DEFAULT 'pending' | One of: pending, approved, flagged, removed |
| upvotes | integer NOT NULL DEFAULT 0 | Cached counter |
| downvotes | integer NOT NULL DEFAULT 0 | Cached counter |
| submitter_ip | text NOT NULL | SHA-256 hash of IP |
| submitter_fingerprint | text NOT NULL | SHA-256 hash of browser fingerprint |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |

**Design decisions to verify are intentional (not bugs):**

1. **Denormalized lat/lng alongside geography:** The `location` column is used for spatial queries (bounding box, distance). The `lat`/`lng` columns are returned in API responses so the frontend does not need to parse WKB. Verify that both are set on INSERT and that `location` is derived from `lat`/`lng` (or vice versa), never set independently.

2. **Free-text address fields:** `kelurahan`, `kecamatan`, `kabupaten`, `provinsi` are free-text, not foreign keys to a regions table. This is intentional — there is no canonical Indonesian region dataset in the DB, and typos are acceptable for v1. Verify no code assumes these are constrained values (e.g., no JOIN to a regions table that does not exist).

3. **Cached counters:** `upvotes` and `downvotes` are materialized counts from the `votes` table, not computed on read. This avoids a COUNT query on every point fetch. The tradeoff is potential drift. See section 4.

4. **Status as text, not enum:** Verify whether status is a CHECK constraint or just free-text. If free-text, flag as WARNING — a CHECK constraint (`status IN ('pending', 'approved', 'flagged', 'removed')`) prevents typos and invalid states.

---

### 2. Index Review

After reading migrations, verify these indexes exist:

| Index | Type | Column(s) | Purpose |
|-------|------|-----------|---------|
| Spatial | GIST | location | Bounding box queries (map viewport) |
| Status filter | B-tree | status | WHERE status = 'approved' filter |
| Region filter | B-tree | (provinsi, kabupaten) | Region dropdown queries |
| Vote dedup | UNIQUE | (point_id, voter_ip, voter_fingerprint) on `votes` | Anti-sybil — this is load-bearing |

For each index:
- Confirm it exists in a migration file
- Confirm the migration is ordered correctly (index created after table)
- Confirm the index uses `IF NOT EXISTS` for idempotency

Flag if:
- Any expected index is missing
- The UNIQUE index on votes is missing or has wrong columns — this is **CRITICAL**, it is the only DB-level defense against vote manipulation
- A GIST index is created without PostGIS extension enabled first
- Indexes are created inside a transaction with large table locks (for future reference — not an issue at v1 scale)

---

### 3. The Vote Dedup UNIQUE Index

This deserves its own section because it is the backbone of vote integrity.

The UNIQUE constraint on `votes(point_id, voter_ip, voter_fingerprint)` ensures:
- One vote per IP+fingerprint combination per point
- The database rejects duplicate votes even if the application code fails to check

**Verify:**
1. The constraint exists in migrations
2. No migration drops or alters this constraint
3. The vote API handler (`src/app/api/points/[id]/vote/route.ts`) handles the unique violation error correctly:
   - Supabase returns error code `23505` (unique_violation) when the constraint is violated
   - The handler must return HTTP 409 (Conflict), not 500
4. The handler does NOT do a SELECT-then-INSERT (check-then-act race condition). It should INSERT directly and handle the constraint violation. Or if it does a pre-check, the UNIQUE constraint is the second line of defense.

Flag if:
- The constraint is missing — **CRITICAL**
- The handler returns 500 instead of 409 on duplicate — **WARNING**
- The handler does SELECT-then-INSERT without also relying on the constraint — **WARNING**

---

### 4. Counter Drift

`upvotes` and `downvotes` on `koperasi_points` are cached counters derived from the `votes` table.

**Review the vote handler:**

Read `src/app/api/points/[id]/vote/route.ts` and trace the vote flow:
1. INSERT into `votes` table
2. UPDATE `koperasi_points` SET upvotes = upvotes + 1 (or downvotes)
3. Check if status transition threshold is reached

**Atomicity check:** Are steps 1 and 2 in a single Supabase RPC call or transaction? If they are two separate `.from()` calls:
- If step 1 succeeds but step 2 fails, the vote exists but the counter is wrong
- This causes counter drift — the counter no longer matches `SELECT COUNT(*) FROM votes WHERE ...`

**How to detect drift:**
```sql
SELECT kp.id, kp.upvotes, kp.downvotes,
  COUNT(*) FILTER (WHERE v.vote_type = 'up') AS actual_up,
  COUNT(*) FILTER (WHERE v.vote_type = 'down') AS actual_down
FROM koperasi_points kp
LEFT JOIN votes v ON v.point_id = kp.id
GROUP BY kp.id
HAVING kp.upvotes != COUNT(*) FILTER (WHERE v.vote_type = 'up')
   OR kp.downvotes != COUNT(*) FILTER (WHERE v.vote_type = 'down');
```

**How to fix drift:**
```sql
UPDATE koperasi_points kp SET
  upvotes = sub.actual_up,
  downvotes = sub.actual_down
FROM (
  SELECT point_id,
    COUNT(*) FILTER (WHERE vote_type = 'up') AS actual_up,
    COUNT(*) FILTER (WHERE vote_type = 'down') AS actual_down
  FROM votes GROUP BY point_id
) sub
WHERE kp.id = sub.point_id;
```

Flag if:
- Vote INSERT and counter UPDATE are not atomic — **WARNING** (acceptable for v1 but document the risk)
- There is no mechanism (even a manual SQL script) to detect or fix drift — **INFO**
- Status transition check uses the cached counter instead of a fresh COUNT — **WARNING** (if the counter drifted, the status transition fires at the wrong time)

---

### 5. Soft Delete vs Hard Delete

This project uses `status = 'removed'` as a soft delete. Rows are never physically deleted from `koperasi_points`.

**Search the entire codebase for:**
- `.delete()` on `koperasi_points` — must not exist
- `DELETE FROM koperasi_points` — must not exist
- Any migration with `DROP TABLE koperasi_points` (unless it is a full reset migration)

Votes table: votes are also never deleted. Even if a point is removed, its votes remain for audit.

Flag if:
- Any application code deletes from `koperasi_points` — **CRITICAL**
- Any application code deletes from `votes` — **WARNING**
- RLS allows DELETE for anon/authenticated — **CRITICAL** (cross-reference with supabase-review)

---

### 6. Query Review

Search all files in `src/` that call `supabase.from(` or contain raw SQL.

**Check for N+1 patterns:**
- Fetching a list of points, then for each point fetching its votes separately
- The points list endpoint should return points with cached upvotes/downvotes (no need for a separate votes query)
- If votes are fetched separately, it must be a single query with `WHERE point_id IN (...)`, not a loop

**Check for missing WHERE clauses:**
- Any query on `koperasi_points` that does not filter by `status` when returning data to users
- The map viewport query must filter `status = 'approved'` (or `IN ('approved', 'pending')` if pending pins are shown differently)

**Check for missing LIMIT:**
- The viewport query should have a reasonable LIMIT (e.g., 1000) to prevent returning the entire table on a zoomed-out view
- The regions query does not need a LIMIT (bounded by Indonesia's ~34 provinces)

**Check for SELECT *:**
- Queries should select only needed columns, especially excluding `submitter_ip` and `submitter_fingerprint` from any query that returns data to the client

Flag if:
- N+1 query pattern found — **WARNING**
- Query returns `submitter_ip` or `submitter_fingerprint` to client — **CRITICAL**
- Viewport query has no LIMIT — **WARNING**
- Query on `koperasi_points` does not filter by status — **WARNING**

---

### 7. Transaction Correctness — Vote + Counter + Status

The vote flow has three steps that should be atomic:
1. INSERT vote
2. INCREMENT counter on koperasi_points
3. CHECK if status transition threshold is reached, UPDATE status if so

If these are not in a single transaction (Supabase RPC function), analyze the failure modes:

| Step 1 | Step 2 | Step 3 | Result |
|--------|--------|--------|--------|
| OK | FAIL | SKIP | Vote recorded, counter wrong, status stuck |
| OK | OK | FAIL | Vote + counter correct, status stuck at old value |
| FAIL (dup) | SKIP | SKIP | Correct — 409 returned |

If the project uses an RPC function (a PostgreSQL function called via `supabase.rpc()`), read the function definition in migrations and verify it handles all three steps atomically.

If the project uses multiple `.from()` calls, document the risk and suggest an RPC function as a future improvement.

---

### 8. The photo_path Column

`photo_path` stores a Supabase Storage path like `koperasi-photos/{point_id}/{uuid}.ext`, NOT a full URL like `https://xxx.supabase.co/storage/v1/object/public/koperasi-photos/...`.

**Search for:**
- Any code that stores a full URL in `photo_path` — **BUG**
- Any code that treats `photo_path` as a URL (e.g., passing it directly to `<img src={photo_path}>`) — **BUG**
- The correct pattern: construct the public URL at read time using `supabase.storage.from('koperasi-photos').getPublicUrl(photo_path)`
- Any code that returns the photo URL for a point with `status != 'approved'` — **WARNING** (photos should be hidden until approved)

---

### 9. Review Checklist

- [ ] Schema matches expected columns — no missing or extra columns
- [ ] `location` geography column uses SRID 4326
- [ ] `lat`/`lng` and `location` are set consistently on INSERT
- [ ] Status column has CHECK constraint (or flag if missing)
- [ ] GIST index on `location` exists
- [ ] B-tree index on `status` exists
- [ ] B-tree index on `(provinsi, kabupaten)` exists
- [ ] UNIQUE index on `votes(point_id, voter_ip, voter_fingerprint)` exists
- [ ] Vote handler handles unique violation as 409
- [ ] Vote INSERT and counter UPDATE atomicity documented
- [ ] Counter drift detection query documented
- [ ] No DELETE operations on `koperasi_points` in application code
- [ ] No N+1 query patterns
- [ ] No queries return `submitter_ip` or `submitter_fingerprint` to client
- [ ] Viewport query has LIMIT
- [ ] `photo_path` is a storage path, not a URL, everywhere
- [ ] Photo URL only constructed for approved points

---

### 10. Exit Criteria

The review is complete when:

1. Every item in the checklist above is confirmed or has a filed finding
2. All CRITICAL findings are reported with file path, line number, and fix suggestion
3. All WARNING findings are reported with explanation of risk and suggested remediation
4. Counter drift detection and fix queries are included in the report
5. A summary is provided: X critical / Y warning / Z info findings
