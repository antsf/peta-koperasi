# security-review

Security review tailored to an anonymous-contribution civic-tech platform.

## When to use

Run this skill when reviewing any PR or changeset that touches PII handling, vote logic, file uploads, rate limiting, API routes, or environment variables. Also run as a periodic full-project security audit.

## Activation

Trigger: user says "security review", "review security", "audit security", "PII review", "vote manipulation review", or invokes `/security-review`.

## Instructions

You are reviewing security in a civic-tech crowdsourced map of Indonesian village cooperatives. The platform is fully anonymous — no auth, no user accounts. Security depends on hashing PII, rate limiting, vote dedup constraints, file validation, and RLS policies.

The threat model is different from a typical SaaS app. There are no passwords to steal. The main threats are abuse: spam, vote manipulation, coordinate forgery, photo abuse, and PII leaks.

Work through each section below in order. Read the relevant files, report findings, and flag violations.

---

### 1. Threat Model

Before reviewing code, internalize the threat model for this project:

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Spam submissions | Map polluted with fake cooperatives | Rate limit (10/IP/hour), community downvoting |
| Coordinate manipulation | Pins placed in wrong locations (ocean, other countries) | Viewport bounds validation (Indonesia bbox), client-side pin placement |
| Vote manipulation (Sybil) | Fake cooperatives approved, real ones flagged | UNIQUE(point_id, voter_ip, voter_fingerprint), rate limiting |
| Photo abuse (NSFW) | Offensive content on public map | File type validation, size limit, manual review via status system |
| Storage abuse | Bucket filled with large files | 5MB server-side limit, file type whitelist |
| Rate limit bypass | All above threats amplified | IP-based rate limiting is imperfect but raises the bar |
| PII leak | Submitter IPs/fingerprints exposed | SHA-256 hashing before any storage |
| Service role key exposure | Full DB access from client | Two-client pattern, key only in server-side env vars |

---

### 2. PII Handling Review (CRITICAL PATH)

This is the most important security property of the application. IP addresses and browser fingerprints are PII under Indonesian data protection law (UU PDP). They must be SHA-256 hashed before ANY variable assignment, logging, or storage.

**Trace the full path for submissions:**

1. Read `src/app/api/points/route.ts` (POST handler)
2. Find where `request.headers.get('x-forwarded-for')` or equivalent is read
3. Trace the raw IP value — it must be hashed IMMEDIATELY:
   ```typescript
   // CORRECT — hash at first touch
   const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
   const hashedIp = sha256(rawIp)  // rawIp goes out of scope or is not used again
   
   // WRONG — raw value stored in a variable that persists
   const ip = request.headers.get('x-forwarded-for')  // persists as raw
   // ... 50 lines later ...
   const hashedIp = sha256(ip)  // raw value was in memory for 50 lines
   ```
4. The raw IP must NEVER appear in: console.log, error messages, Sentry/logging payloads, DB columns, response bodies

**Trace the full path for votes:**

1. Read `src/app/api/points/[id]/vote/route.ts` (POST handler)
2. Same trace as above — raw IP and fingerprint must be hashed before any other use

**Search the entire codebase for:**
- `console.log` statements that might include IP or fingerprint values
- Any variable named `ip`, `rawIp`, `fingerprint`, `rawFingerprint` that is NOT immediately hashed
- Any Supabase `.insert()` call where the `submitter_ip` or `voter_ip` value is not a hash (hashes are 64-char hex strings)

Flag if:
- Raw IP persists in a variable beyond the hashing line — **CRITICAL**
- Raw IP appears in any log statement — **CRITICAL**
- Raw fingerprint is trusted from client without any server-side validation — **WARNING** (fingerprints from the client can be spoofed; the IP hash is the stronger signal)
- Hash function is not SHA-256 or uses a weak hash — **CRITICAL**

---

### 3. Vote Manipulation Review

**The dedup mechanism:**

Read the vote endpoint and trace:
1. Does the handler check for existing votes BEFORE inserting? (Pre-check)
2. Does the handler rely on the UNIQUE constraint as the primary or secondary defense?
3. How does it handle the unique violation error?

**Best pattern:**
```typescript
// INSERT directly — let the DB enforce uniqueness
const { data, error } = await supabase.from('votes').insert({...})
if (error?.code === '23505') {
  return NextResponse.json({ error: 'Already voted' }, { status: 409 })
}
```

**Acceptable pattern:**
```typescript
// Pre-check + INSERT (belt and suspenders)
const { data: existing } = await supabase.from('votes')
  .select('id').eq('point_id', pointId).eq('voter_ip', hashedIp).eq('voter_fingerprint', hashedFp).single()
if (existing) return NextResponse.json({ error: 'Already voted' }, { status: 409 })
// INSERT — UNIQUE constraint still protects against race condition
```

**Bad pattern:**
```typescript
// Pre-check only, no UNIQUE constraint — race condition allows duplicates
const { data: existing } = await supabase.from('votes').select(...)
if (!existing) {
  await supabase.from('votes').insert({...})  // two requests can both pass the check
}
```

**Fingerprint validation:**
The fingerprint comes from the client (e.g., FingerprintJS). The server cannot independently verify it. Review:
- Is the fingerprint required (not empty/null)?
- Is it validated as a string of reasonable length?
- Is it hashed before storage (even though it is not as sensitive as IP)?

Flag if:
- No UNIQUE constraint on votes table — **CRITICAL**
- Handler does pre-check only without constraint as backup — **CRITICAL**
- Fingerprint is optional (allows voting with IP-only dedup, weaker) — **WARNING**
- Handler returns 500 instead of 409 on duplicate — **WARNING**

---

### 4. SQL Injection Review

The Supabase JS client uses parameterized queries internally, so `.from('table').insert({...})` is safe.

**But search for raw SQL:**
- Read `src/lib/geo.ts` or any file with PostGIS queries
- Search for template literals containing SQL: `` `SELECT ... ${variable} ...` ``
- Search for `supabase.rpc(` calls — check that parameters are passed as the second argument, not interpolated into the function name

**Safe:**
```typescript
const { data } = await supabase.rpc('points_in_bbox', {
  min_lat: south, max_lat: north, min_lng: west, max_lng: east
})
```

**Unsafe:**
```typescript
const { data } = await supabase.rpc(`points_in_bbox_${regionType}`, {...})  // function name injection
```

Also search for:
- Any use of `supabase.from('koperasi_points').select()` with user-controlled column names in `.select(userInput)` — column name injection
- Any `.or()` or `.filter()` with user-controlled filter strings

Flag if:
- Template literal SQL with interpolated values — **CRITICAL**
- User-controlled column names in `.select()` — **CRITICAL**
- Dynamic RPC function names — **WARNING**

---

### 5. Storage Abuse Review

Read the photo upload handler (likely in `src/app/api/points/route.ts` POST handler or a separate upload route).

**Check server-side enforcement of:**

1. **File size limit:** Must be enforced SERVER-SIDE, not just client-side.
   - Check for `request.formData()` size limit or manual byte counting
   - The limit is 5 MB (5 * 1024 * 1024 bytes)
   - If using Next.js config, check `api.bodyParser.sizeLimit` in `next.config.js`

2. **MIME type validation:** Must check the file buffer magic bytes, NOT the filename extension or Content-Type header (both are client-controlled).
   - Allowed types: `image/jpeg`, `image/png`, `image/webp`
   - Check for `file-type` package or manual magic byte checking
   - If only checking `file.type` from FormData — **WARNING** (client-controlled)

3. **Storage path generation:** The path must be generated server-side:
   - Pattern: `{point_id}/{uuid}.{ext}`
   - The filename must NOT come from user input (path traversal risk)
   - Check that no user-supplied string is used in the storage path

4. **Upload count limit:** Is there a limit on how many photos per point? If not, a single point could consume the entire storage bucket.

Flag if:
- No server-side file size check — **CRITICAL**
- MIME type checked from filename extension or Content-Type header only — **WARNING**
- User-controlled filename in storage path — **CRITICAL**
- No limit on photos per point — **INFO**

---

### 6. Rate Limiting Review

The project enforces 10 submissions per IP per hour.

**Read the rate limiting implementation** (likely in `src/lib/rate-limit.ts` or inline in the POST handler).

**Check:**
1. Is rate limiting checked BEFORE the DB INSERT? (Must be — otherwise the submission is created and the rate limit only prevents the response)
2. Is the rate limit keyed on hashed IP or raw IP? (Should be hashed, for consistency with PII handling)
3. Is the store in-memory (Map/object) or external (Redis)?
   - In-memory is acceptable for v1 but resets on deploy. Document this limitation.
   - In-memory on Vercel serverless: each function instance has its own memory — rate limiting is per-instance, NOT global. This is a known weakness. Document it.
4. Does the rate limit apply to votes too? (Should have a separate, possibly higher limit for votes)
5. Is the rate limit response a 429 with `Retry-After` header?

Flag if:
- Rate limit checked after DB INSERT — **WARNING**
- No rate limiting at all — **CRITICAL**
- Rate limit trivially bypassable (e.g., only checks a header that the client can omit) — **CRITICAL**
- In-memory rate limiting on serverless without documenting the per-instance limitation — **INFO**

---

### 7. Service Role Key Exposure

`SUPABASE_SERVICE_ROLE_KEY` grants full database access, bypassing all RLS policies. It must NEVER reach the browser.

**Search for:**
1. Any file with `"use client"` that references `SUPABASE_SERVICE_ROLE_KEY` or imports from `server.ts` — **CRITICAL**
2. Any `NEXT_PUBLIC_` env var containing the service role key — **CRITICAL** (NEXT_PUBLIC_ vars are bundled into client JS)
3. Check `.env.example` or `.env.local.example` — the service role key should be listed but with a placeholder, never a real value
4. Check `next.config.js` for `env` block that might expose server vars to the client

Flag if:
- Service role key in any client-accessible code path — **CRITICAL**
- Service role key in `.env` file committed to git — **CRITICAL**
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` exists as an env var name — **CRITICAL**

---

### 8. CORS Review

Vercel handles CORS automatically for same-origin requests. But check:

1. Does any API route manually set `Access-Control-Allow-Origin` headers?
2. If so, is it set to `*` on POST/mutation routes? — **WARNING**
3. Check for any `middleware.ts` that sets CORS headers globally
4. The GET routes (points list, stats, regions) can safely allow `*` origin for public data
5. POST routes (submit, vote) should NOT allow `*` — this would let any website submit points or votes on behalf of users

Flag if:
- `Access-Control-Allow-Origin: *` on POST handlers — **WARNING**
- Custom CORS middleware that is overly permissive — **WARNING**

---

### 9. Information Disclosure Review

API responses must NEVER include:
- `submitter_ip` from `koperasi_points`
- `submitter_fingerprint` from `koperasi_points`
- `voter_ip` from `votes`
- `voter_fingerprint` from `votes`

**Search for:**
1. Any `.select('*')` on `koperasi_points` — this returns ALL columns including PII hashes — **CRITICAL**
2. Any API response that includes fields named `*_ip` or `*_fingerprint`
3. Any error response that includes the full Supabase error object (might contain query details)
4. Stack traces in production error responses (check for `error.stack` in response bodies)

The safe pattern:
```typescript
.select('id, name, lat, lng, address, kelurahan, kecamatan, kabupaten, provinsi, phone, email, photo_path, status, upvotes, downvotes, created_at, updated_at')
```

Flag if:
- `.select('*')` on tables with PII columns — **CRITICAL**
- PII hash values in API responses — **CRITICAL** (even hashed values should not leak — they enable correlation)
- Full error objects in responses — **WARNING**

---

### 10. Security Checklist

Before completing the review, confirm each item:

**PII Handling:**
- [ ] IP address hashed with SHA-256 immediately on extraction from header
- [ ] Raw IP never stored in any variable beyond the hashing line
- [ ] Raw IP never appears in console.log or any logging
- [ ] Fingerprint hashed before storage
- [ ] No PII (even hashed) in API responses to clients

**Vote Integrity:**
- [ ] UNIQUE constraint on votes(point_id, voter_ip, voter_fingerprint) exists
- [ ] Vote handler returns 409 on duplicate, not 500
- [ ] Fingerprint is required and validated (non-empty, reasonable length)
- [ ] UNIQUE constraint is relied upon (not just application-level check)

**Injection:**
- [ ] No template literal SQL with interpolated user values
- [ ] No user-controlled column names in .select()
- [ ] No dynamic RPC function names from user input
- [ ] Supabase JS client used for all non-PostGIS queries

**File Upload:**
- [ ] 5 MB file size limit enforced server-side
- [ ] MIME type validated from file buffer, not filename/header
- [ ] Storage path generated server-side with UUID, no user input in path
- [ ] Only JPEG, PNG, WEBP accepted

**Rate Limiting:**
- [ ] Rate limit checked before DB operations
- [ ] 10 submissions per IP per hour enforced
- [ ] Rate limit returns 429 with Retry-After header
- [ ] Serverless per-instance limitation documented

**Key Management:**
- [ ] SUPABASE_SERVICE_ROLE_KEY never in client code
- [ ] No NEXT_PUBLIC_ env var contains service role key
- [ ] .env files not committed to git
- [ ] server.ts only imported in src/app/api/ files

**API Responses:**
- [ ] No .select('*') on tables with PII columns
- [ ] No stack traces in production error responses
- [ ] No full Supabase error objects in responses
- [ ] Photo URLs only returned for approved points

**CORS:**
- [ ] No Access-Control-Allow-Origin: * on POST routes
- [ ] CORS handled by Vercel defaults or scoped middleware

---

### 11. Exit Criteria

The review is complete when:

1. Every item in the checklist above is confirmed or has a filed finding
2. All CRITICAL findings are reported with exact file path, line number, the vulnerable code, and a fix
3. All WARNING findings are reported with risk explanation and remediation
4. The PII trace is documented end-to-end for both submission and vote paths
5. A summary is provided: X critical / Y warning / Z info findings
6. If any CRITICAL finding exists, the review verdict is **FAIL** — the PR must not merge until fixed
