# api-review

API route design and correctness review for the Koperasi Desa Merah Putih Map project.

## When to use

Run this skill when reviewing any PR or changeset that touches API routes in `src/app/api/`, Zod schemas, response shapes, or HTTP semantics. Also run when investigating API bugs or inconsistencies.

## Activation

Trigger: user says "api review", "review api", "route review", "endpoint review", or invokes `/api-review`.

## Instructions

You are reviewing API route correctness in a civic-tech crowdsourced map of Indonesian village cooperatives. The API uses Next.js App Router route handlers. There is no auth — all endpoints are public. Correctness depends on validation, consistent response shapes, proper status codes, and defensive error handling.

Work through each section below in order. Read the relevant files, report findings, and flag violations.

---

### 1. Route Handler Pattern Review

Every API route handler must follow this exact order:

```
1. Parse request (body, params, query)
2. Validate with Zod schema → early return 400 on failure
3. Extract PII (IP, fingerprint) and hash immediately
4. Rate limit check → early return 429 on failure
5. Supabase query
6. Handle Supabase error → return appropriate error status
7. Return success response with correct status code
```

**Read every route handler file:**
- `src/app/api/points/route.ts` (GET list, POST create)
- `src/app/api/points/[id]/route.ts` (GET single)
- `src/app/api/points/[id]/vote/route.ts` (POST vote)
- `src/app/api/regions/route.ts` (GET)
- `src/app/api/stats/route.ts` (GET)

For each handler, verify the order above. Flag deviations:
- Zod validation happens after DB query — **WARNING** (wasted DB call on invalid input)
- PII extraction happens before validation — acceptable but not ideal (PII is extracted even for invalid requests)
- Rate limit check happens after DB INSERT — **CRITICAL** (the submission already exists)
- Supabase error not checked — **WARNING** (silent failures)

---

### 2. HTTP Semantics

| Route | Method | Idempotent? | Side effects? |
|-------|--------|-------------|---------------|
| /api/points | GET | Yes | None |
| /api/points | POST | No | Creates point |
| /api/points/[id] | GET | Yes | None |
| /api/points/[id]/vote | POST | No | Creates vote, updates counter |
| /api/regions | GET | Yes | None |
| /api/stats | GET | Yes | None |

**Verify:**
- No GET handler has side effects (no DB writes, no counter increments)
- No PUT, PATCH, or DELETE handlers exist in v1 (they are not needed — status transitions happen via voting)
- POST handlers use `NextResponse.json(...)` with appropriate status codes

Flag if:
- A GET handler writes to the database — **CRITICAL**
- A PUT/PATCH/DELETE handler exists — **WARNING** (not in spec, may be unprotected)
- A POST handler returns 200 instead of 201 on successful creation — **INFO**

---

### 3. Response Shape Consistency

All routes must return a consistent JSON shape:

**Success:**
```json
{ "data": <T> }
```

**Error:**
```json
{ "error": "<human-readable message>" }
```

**Read every route handler** and check:
- Success responses wrap the result in `{ data: ... }`
- Error responses use `{ error: "..." }` with a string message
- No route returns a bare array `[...]` or bare object `{...}` without the wrapper
- No route returns `{ message: "..." }` instead of `{ error: "..." }`
- No route returns the raw Supabase response object

Flag if:
- Response shape deviates from the standard — **WARNING**
- Raw Supabase error object is returned (may contain internal details) — **WARNING**
- Mixed patterns: some routes use `{ data }`, others use bare objects — **WARNING**

---

### 4. Status Code Review

| Scenario | Expected code |
|----------|---------------|
| Successful GET | 200 |
| Successful POST (created resource) | 201 |
| Validation failure (bad input) | 400 |
| Duplicate vote (unique constraint) | 409 |
| Rate limit exceeded | 429 |
| Resource not found | 404 |
| Supabase down / unexpected error | 503 or 500 |

**For each route handler, verify:**
- The correct status code is returned for each scenario
- 400 is returned with a message explaining what field failed validation
- 409 is returned on vote duplicate, NOT 400 or 500
- 429 is returned with `Retry-After` header (seconds until rate limit resets)
- 404 is returned when GET /api/points/[id] finds no matching point (not 200 with null data)
- 500/503 is returned on Supabase errors, with a generic message (not the raw error)

Flag if:
- Wrong status code for a scenario — **WARNING**
- 500 returned where 409 is correct (duplicate vote) — **WARNING**
- 200 returned with `{ data: null }` instead of 404 — **WARNING**
- Rate limit returns 400 instead of 429 — **INFO**
- Supabase error returns raw error message to client — **WARNING**

---

### 5. The Vote Endpoint Race Condition

The vote endpoint (`POST /api/points/[id]/vote`) is the most complex handler due to the race condition between duplicate vote checks.

**Scenario:** Two identical vote requests arrive simultaneously for the same (point_id, ip, fingerprint).

**Expected behavior:**
1. Both requests pass any application-level pre-check (because neither vote exists yet)
2. Both attempt INSERT into votes table
3. One succeeds, the other hits the UNIQUE constraint
4. The constraint violation returns error code `23505` from PostgreSQL
5. The handler catches this and returns 409

**Read the vote handler and verify:**
1. The Supabase error object is checked for `code === '23505'` (or the Supabase-wrapped equivalent)
2. The 409 response is returned on this specific error, not a generic 500
3. The counter UPDATE only happens after a successful INSERT (not on duplicate)
4. The status transition check only happens after a successful counter UPDATE

**Trace the full vote flow:**
```
POST /api/points/[id]/vote
  → Validate body (vote_type: 'up' | 'down')
  → Hash IP + fingerprint
  → INSERT into votes
    → If 23505: return 409
    → If other error: return 500
  → UPDATE koperasi_points SET upvotes = upvotes + 1 (or downvotes)
    → If error: log, but the vote is recorded (acceptable inconsistency)
  → Check if status transition threshold reached
    → If upvotes >= 3 and status = 'pending': UPDATE status = 'approved'
    → If downvotes >= 3 and status = 'pending': UPDATE status = 'flagged'
    → If downvotes >= 6 and status = 'flagged': UPDATE status = 'removed'
    → If upvotes >= 5 and status = 'flagged': UPDATE status = 'approved'
  → Return 201 with vote data
```

Flag if:
- `23505` error not specifically handled — **CRITICAL**
- Counter updated even on duplicate vote — **CRITICAL**
- Status transition uses wrong thresholds — **CRITICAL**
- Status transition does not check current status (e.g., transitions from 'removed' to 'approved') — **CRITICAL**

---

### 6. Photo URL Construction

`GET /api/points/[id]` must construct the public Supabase Storage URL from `photo_path`.

**The correct pattern:**
```typescript
let photoUrl = null
if (point.photo_path && point.status === 'approved') {
  const { data: { publicUrl } } = supabase.storage
    .from('koperasi-photos')
    .getPublicUrl(point.photo_path)
  photoUrl = publicUrl
}
// Return photoUrl in response (null if not approved or no photo)
```

**Verify:**
1. `photo_path` is NOT returned directly to the client (it is an internal storage path)
2. The public URL is only constructed when `status === 'approved'`
3. If `photo_path` is null/undefined, `photoUrl` is null (not an error)
4. The URL construction uses `.getPublicUrl()`, not string concatenation with the Supabase URL

**For the list endpoint** (`GET /api/points`):
- If returning multiple points, the same logic applies to each point
- Points with status != 'approved' should have `photoUrl: null` even if `photo_path` exists

Flag if:
- Raw `photo_path` returned to client — **WARNING** (info disclosure of storage structure)
- Photo URL returned for non-approved points — **WARNING** (exposes pending/removed photos)
- URL constructed via string concatenation — **INFO** (fragile but not a security issue)
- No null check on `photo_path` before constructing URL — **BUG**

---

### 7. Viewport Parameter Validation

`GET /api/points` accepts viewport bounds to return points within the visible map area.

**Expected query parameters:**
- `north` (latitude, -90 to 90)
- `south` (latitude, -90 to 90)
- `east` (longitude, -180 to 180)
- `west` (longitude, -180 to 180)

**Validation rules:**
1. All four are required when any one is provided (all-or-nothing)
2. All must be valid numbers (not NaN, not Infinity)
3. `south < north` (southern bound must be below northern bound)
4. `west < east` (this project does not need to handle antimeridian crossing)
5. Indonesia-specific sanity check (optional but recommended):
   - Latitude roughly between -11 and 6 (Indonesia spans ~6N to ~11S)
   - Longitude roughly between 95 and 141 (Indonesia spans ~95E to ~141E)
   - Allow some padding (e.g., +-5 degrees) for zoomed-out views
   - This is a soft check — reject clearly absurd values (lat: 89, lng: -120 = Arctic/Pacific) but allow edge cases

**Read the Zod schema** for viewport validation and verify:
- Numbers are parsed from query string (they arrive as strings)
- Bounds checking is correct
- The spatial query uses these bounds correctly (PostGIS ST_MakeEnvelope or equivalent)

Flag if:
- Viewport params not validated at all — **WARNING** (allows full-table scan)
- south > north not rejected — **BUG**
- Values not parsed as numbers (string comparison fails) — **BUG**
- No LIMIT on viewport query results — **WARNING** (zoomed-out view returns thousands of points)

---

### 8. The Regions Endpoint

`GET /api/regions` returns a list of provinces with their kabupaten, for the filter dropdown.

**Expected behavior:**
- Returns distinct `provinsi` values with their associated `kabupaten` list
- Only from points with `status = 'approved'` (no sense showing regions that only have pending points)
- Ordered alphabetically by provinsi, then kabupaten
- Response shape: `{ data: [{ provinsi: string, kabupaten: string[] }] }`

**Read the handler and verify:**
1. Query filters by `status = 'approved'`
2. Results are grouped by provinsi
3. Kabupaten list is deduplicated and sorted
4. Response matches expected shape

Flag if:
- No status filter — includes regions from pending/removed points — **WARNING**
- Not deduplicated — same kabupaten appears multiple times — **BUG**
- Not sorted — dropdown appears in random order — **INFO**
- Returns flat list instead of grouped structure — **INFO** (affects frontend UX)

---

### 9. Error Handling — Supabase Down

When Supabase is unreachable or returns a connection error, the API route should:
1. NOT return a 500 with a stack trace
2. Return 503 (Service Unavailable) with `{ error: "Service temporarily unavailable" }`
3. NOT expose the Supabase URL, error details, or connection string in the response

**Simulate this scenario mentally:** If `supabase.from('koperasi_points').select(...)` returns `{ data: null, error: { message: 'connection refused', code: 'PGRST000' } }`:
- Does the handler check `error`?
- Does it return a generic message or the raw error?
- Does it return 503 or 500?

**Also check for unhandled exceptions:**
- What if `request.json()` throws (malformed JSON body)?
- What if `request.headers.get(...)` returns null unexpectedly?
- Is there a try/catch around the handler body?

Flag if:
- No try/catch around handler — **WARNING** (unhandled exceptions return 500 with stack trace in dev)
- Raw Supabase error message in response — **WARNING**
- No distinction between client error (400) and server error (500/503) — **WARNING**
- Connection errors return 500 instead of 503 — **INFO**

---

### 10. Zod Schema Review

Read all Zod schemas (likely in `src/lib/schemas.ts` or co-located with route handlers).

**For the point submission schema:**
- `name`: required, string, min length 1, max length reasonable (255?)
- `lat`: required, number, -90 to 90
- `lng`: required, number, -180 to 180
- `address`: optional, string
- `kelurahan`, `kecamatan`, `kabupaten`, `provinsi`: optional or required? Check consistency with DB schema
- `phone`: optional, string (no format validation needed for Indonesian numbers)
- `email`: optional, string, email format if provided
- `fingerprint`: required, string, non-empty (used for vote dedup later)

**For the vote schema:**
- `vote_type`: required, enum `'up' | 'down'` (exactly these two values)
- `fingerprint`: required, string, non-empty

**For viewport params:**
- `north`, `south`, `east`, `west`: optional (all or none), numbers

Flag if:
- Any required field missing from Zod schema — **WARNING**
- Zod schema allows values outside DB constraints (e.g., name longer than DB column allows) — **INFO**
- vote_type accepts values other than 'up'/'down' — **BUG**
- Fingerprint is optional in vote schema — **WARNING** (weakens dedup)

---

### 11. Review Checklist

**Handler pattern:**
- [ ] Every handler follows: validate → hash PII → rate limit → query → respond
- [ ] Zod validation is the first step after parsing the request
- [ ] Rate limit checked before any DB write

**HTTP semantics:**
- [ ] No GET handler has side effects
- [ ] No PUT/PATCH/DELETE handlers exist
- [ ] POST returns 201 on creation

**Response shapes:**
- [ ] All success responses use `{ data: T }`
- [ ] All error responses use `{ error: string }`
- [ ] No raw Supabase objects in responses

**Status codes:**
- [ ] 200 on successful GET
- [ ] 201 on successful POST
- [ ] 400 on validation failure
- [ ] 404 on resource not found
- [ ] 409 on duplicate vote
- [ ] 429 on rate limit with Retry-After header
- [ ] 503 on Supabase connection failure

**Vote endpoint:**
- [ ] Handles 23505 unique violation as 409
- [ ] Counter only incremented on successful vote INSERT
- [ ] Status transition thresholds correct (3 up=approved, 3 down=flagged, 6 down=removed, 5 up=unflag)
- [ ] Status transition checks current status before transitioning

**Photo URL:**
- [ ] Constructed from photo_path using getPublicUrl()
- [ ] Only returned when status = 'approved'
- [ ] Null when photo_path is null
- [ ] Raw photo_path never in response

**Viewport:**
- [ ] All four bounds required together
- [ ] Parsed as numbers, not strings
- [ ] south < north validated
- [ ] west < east validated
- [ ] LIMIT on results

**Regions:**
- [ ] Filtered to approved points only
- [ ] Grouped by provinsi
- [ ] Kabupaten deduplicated and sorted

**Error handling:**
- [ ] try/catch around every handler
- [ ] Generic error messages in responses (no internals)
- [ ] Supabase errors return 503, not 500 with details

---

### 12. Exit Criteria

The review is complete when:

1. Every route handler has been read and reviewed against the pattern
2. Every item in the checklist above is confirmed or has a filed finding
3. All CRITICAL findings are reported with file path, line number, current code, and fix
4. All WARNING findings are reported with risk and remediation
5. The vote endpoint race condition handling is verified end-to-end
6. A summary is provided: X critical / Y warning / Z info findings
