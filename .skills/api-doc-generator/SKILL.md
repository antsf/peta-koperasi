# Skill: api-doc-generator

Generate accurate, useful API documentation for the Koperasi Desa Merah Putih Map project.

---

## Purpose

Produce API documentation that a developer can read and immediately make correct API calls without reading the source code. This covers two outputs: inline JSDoc-style comments in `route.ts` files (for contributors reading the code) and a standalone `/docs/api.md` reference file (for consumers using the API).

This project has exactly 6 API routes. Document all of them thoroughly. Do not document internal implementation details, future planned endpoints, or anything that does not exist in the current codebase.

---

## When to Invoke

- A new API route is added.
- An existing route's behavior, parameters, or response shape changes.
- A contributor or integrator asks how to use the API.
- A PR modifies a route handler and the inline JSDoc is stale.
- The `/docs/api.md` file does not exist yet and needs to be created.

## When NOT to Invoke

- Writing user-facing documentation (use `technical-writer`).
- Writing a changelog entry for an API change (use `changelog-writer`).
- Designing a new API route (use `architect` first, then come here to document it).
- Documenting internal library functions in `src/lib/` (those get standard JSDoc, not this skill's format).

---

## Inputs

Before generating documentation, gather:

1. **Which routes?** All 6, or a specific route being updated?
2. **Source files** — Read the actual `route.ts` files. Never document from memory or the spec alone — the code is the source of truth.
3. **Zod schemas** — Read `src/lib/validation.ts` for the exact field names, types, and constraints.
4. **Type definitions** — Read `src/types/index.ts` for response shapes.
5. **Current behavior** — If a route has edge cases (viewport too large, duplicate vote), verify the actual error responses from the code.

---

## Outputs

Two artifacts:

### Artifact 1: Inline JSDoc in route.ts files

Each route handler gets a JSDoc comment block directly above the exported function. Format:

```typescript
/**
 * GET /api/points
 *
 * Fetch koperasi points within a map viewport.
 *
 * @query north - Northern latitude bound (number, -11.0 to 6.0)
 * @query south - Southern latitude bound (number, -11.0 to 6.0)
 * @query east - Eastern longitude bound (number, 95.0 to 141.0)
 * @query west - Western longitude bound (number, 95.0 to 141.0)
 * @query provinsi - Optional province filter (string)
 * @query kabupaten - Optional regency filter (string)
 *
 * @returns 200 - Array of point objects within viewport (max ~500)
 * @returns 400 - Invalid or missing viewport parameters
 * @returns 200 - Empty array if viewport contains no points
 *
 * @sideeffect None (read-only)
 */
```

Keep it concise. The JSDoc is for contributors reading the code — they can see the implementation below.

### Artifact 2: /docs/api.md

A standalone Markdown file with complete request/response examples. This is for developers consuming the API who may not read the source code.

---

## The 6 Routes — Documentation Requirements

### Route 1: GET /api/points

**Purpose:** Fetch koperasi points within a map viewport.

**Document these specifics:**

- **Viewport parameters:** `north`, `south`, `east`, `west` are all required query parameters. They define the bounding box of the current map view. Explain what they represent: `north` is the latitude of the top edge of the visible map, `south` is the bottom, `east` is the right edge longitude, `west` is the left.

- **Indonesia bounds constraint:** All coordinates must fall within Indonesia's bounds (lat: -11.0 to 6.0, lng: 95.0 to 141.0). Requests outside these bounds are rejected with 400.

- **Large viewport behavior:** The query returns a maximum of approximately 500 points. If the viewport is very large (e.g., user zoomed out to see all of Indonesia), the response may be truncated. Document this limit. The client should handle this gracefully — either by showing a "zoom in for more detail" message or by accepting the subset.

- **Optional region filters:** `provinsi` and `kabupaten` query parameters for filtering by administrative region. Both are optional strings.

- **Response shape:** Array of point objects. Each point includes: `id`, `name`, `address`, `kelurahan`, `kecamatan`, `kabupaten`, `provinsi`, `latitude`, `longitude`, `status`, `upvotes`, `downvotes`, `photo_url` (null if status is not `approved`), `created_at`.

- **Photo URL behavior:** `photo_url` is `null` for any point where `status != 'approved'`, even if a photo was uploaded. This is a privacy and moderation rule. When `photo_url` is present, it is a path relative to Supabase Storage — document how to construct the full URL: `{SUPABASE_URL}/storage/v1/object/public/{bucket}/{photo_path}`.

### Route 2: POST /api/points

**Purpose:** Submit a new koperasi point to the map.

**Document these specifics:**

- **Request body fields:** `name` (string, required), `address` (string, required), `kelurahan` (string, required), `kecamatan` (string, required), `kabupaten` (string, required), `provinsi` (string, required), `latitude` (number, required, Indonesia bounds), `longitude` (number, required, Indonesia bounds), `photo` (file, optional).

- **Content-Type:** `multipart/form-data` (because of optional photo upload). Document this explicitly — it is not `application/json`.

- **Side effects:** Inserts a new row into `koperasi_points` with `status: 'pending'` and `upvotes: 0`, `downvotes: 0`. If a photo is included, uploads it to Supabase Storage.

- **Response:** The created point object (same shape as GET response, with `status: 'pending'` and `photo_url: null` because it is not yet approved).

- **Validation errors:** 400 with specific field errors from Zod validation. Document the error response shape.

### Route 3: GET /api/points/[id]

**Purpose:** Fetch a single koperasi point by ID.

**Document these specifics:**

- **Path parameter:** `id` (UUID string).
- **Response:** Single point object (same shape as items in GET /api/points array).
- **Photo URL behavior:** Same rule — `photo_url` is `null` unless `status === 'approved'`.
- **Not found:** 404 if no point with that ID exists.

### Route 4: POST /api/points/[id]/vote

**Purpose:** Cast an upvote or downvote on a koperasi point.

**This route needs the most thorough documentation.** It is the core governance mechanism.

**Document these specifics:**

- **Path parameter:** `id` (UUID string, the point being voted on).
- **Request body:** `vote` (string, either `"up"` or `"down"`).
- **Content-Type:** `application/json`.

- **Deduplication rule:** Each unique combination of `(point_id, hashed_ip, hashed_fingerprint)` can vote exactly once on a given point. If a duplicate vote is detected, the endpoint returns **409 Conflict**. The caller must handle this — typically by disabling the vote button and showing a "you already voted" message. Document the 409 response shape.

- **Status transition table:** Document every possible status change that can result from a vote:

  | Current Status | Vote | Condition | New Status |
  |---|---|---|---|
  | pending | up | upvotes reaches 3 | approved |
  | pending | down | downvotes reaches 3 | flagged |
  | flagged | down | downvotes reaches 6 | removed |
  | flagged | up | upvotes reaches 5 | approved (community override) |
  | approved | up/down | (no transition) | stays approved |
  | removed | — | (no votes accepted) | stays removed |

- **What 409 means and why to handle it:** A 409 does NOT mean the server is broken. It means this specific browser has already voted on this specific point. The client should: catch the 409, display a user-friendly message (not an error), and disable the vote buttons for this point. This is expected behavior, not an error.

- **Side effects:** Inserts a row into the `votes` table. Increments `upvotes` or `downvotes` on the corresponding `koperasi_points` row. May change the point's `status` per the transition table above.

- **Response on success:** 200 with the updated point object (including new vote counts and potentially new status).

- **Response on removed point:** 400 or 404 — votes on removed points are rejected.

### Route 5: GET /api/regions

**Purpose:** Get distinct administrative regions from existing data.

**Document these specifics:**

- **No parameters.** This endpoint takes no query parameters.
- **Response:** Object with arrays of distinct values: `{ provinsi: string[], kabupaten: string[] }`. These are derived from actual submitted data, not a reference list. If no points exist in a region, that region does not appear.
- **Use case:** Populating filter dropdowns in the region filter UI.
- **Side effects:** None (read-only).
- **Data quality note:** Because these values come from user-submitted data, spelling may be inconsistent (e.g., "Kab. Bogor" vs "Kabupaten Bogor"). This is a known limitation.

### Route 6: GET /api/stats

**Purpose:** Get aggregate statistics about the map.

**Document these specifics:**

- **No parameters.**
- **Response:** Object with counts: `{ total_points: number, approved_points: number, pending_points: number, flagged_points: number, total_votes: number }` (exact shape depends on implementation — verify from source).
- **Use case:** Dashboard statistics, about page, monitoring.
- **Side effects:** None (read-only).

---

## /docs/api.md Format

Use this structure for the reference file:

```markdown
# API Reference

> **Stability:** Routes may change between releases until v1.0 is tagged.
> There is no API versioning. All routes are under `/api/`.

## Authentication

None. All endpoints are public and anonymous. No API keys, no tokens, no auth headers.

## Base URL

- Local development: `http://localhost:3000`
- Production: `{deployment URL}`

---

## Endpoints

### GET /api/points

{purpose}

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ... | ... | ... | ... |

**Example Request:**
```
GET /api/points?north=-6.1&south=-6.3&east=106.9&west=106.7
```

**Example Response (200):**
```json
[
  {
    "id": "...",
    ...
  }
]
```

**Error Responses:**
| Status | Reason |
|--------|--------|
| 400 | Missing or invalid viewport parameters |

---

{repeat for each route}
```

**Key formatting rules for /docs/api.md:**

- Every example request must be copy-pasteable (use `curl` or plain HTTP).
- Every example response must be valid JSON.
- Every error response must include the HTTP status code and a human-readable reason.
- Field descriptions must include types AND constraints (not just "string" but "string, 1-500 characters" or "number, -11.0 to 6.0").

---

## API Versioning Notice

This project has no API versioning in v1. Document this clearly at the top of `/docs/api.md`:

> **Stability guarantee:** Routes may change between releases until v1.0 is tagged. There is no `/api/v1/` prefix. If you are building against this API, pin to a specific release tag.

Do not add versioning prefixes to routes. Do not document planned future versioning. Just state the current reality.

---

## What NOT to Document

- **Internal implementation:** Do not document which Supabase table a route queries, what the SQL looks like, or how the PostGIS query is constructed. That is source code, not API docs.
- **Hashing algorithm:** Do not document that SHA-256 is used for IP/fingerprint hashing. The dedup is documented as behavior ("you can only vote once"), not as implementation.
- **RLS policies:** Do not document Supabase Row Level Security policies. Those are infrastructure, not API surface.
- **Future endpoints:** Do not document `/api/export`, `/api/admin`, or any route that does not exist. If it is in SPEC.md section 10 (out of scope), it does not get documented.
- **Internal error details:** Do not expose Supabase error messages or stack traces in documented error responses. Document the HTTP status code and a clean error message.

---

## Bilingual Consideration

API documentation is **English-only**. The audience for API documentation is developers, who navigate English-language tooling and documentation as a standard part of their work. Writing bilingual API docs doubles maintenance for no practical benefit.

Exception: if a field value is in Indonesian (e.g., `provinsi: "Jawa Barat"`), note that data values are in the language of the original contributor, not translated.

---

## Thinking Process

### Step 1 — Read the source, not the spec

Open each `route.ts` file. Read the actual Zod schema, the actual query, the actual response construction. The spec may describe intended behavior; the code describes actual behavior. If they disagree, document the code and flag the discrepancy.

### Step 2 — Construct realistic examples

Do not use `"string"` as an example value. Use realistic Indonesian data:

```json
{
  "name": "Koperasi Maju Bersama",
  "address": "Jl. Raya Desa No. 5",
  "kelurahan": "Sukaresmi",
  "kecamatan": "Cianjur",
  "kabupaten": "Cianjur",
  "provinsi": "Jawa Barat",
  "latitude": -6.7345,
  "longitude": 107.1420
}
```

Real-looking data helps the reader understand the domain, not just the data types.

### Step 3 — Test every error path

For each route, enumerate: What happens with missing fields? Invalid types? Out-of-bounds coordinates? Duplicate votes? Nonexistent IDs? Document every distinct error response.

### Step 4 — Verify response shapes against types

Cross-reference the documented response shape with `src/types/index.ts`. If the type says `photo_url: string | null`, document that. If the type says `status: 'pending' | 'approved' | 'flagged' | 'removed'`, document the enum values.

### Step 5 — Write the inline JSDoc

Update each `route.ts` file with the JSDoc comment block. Keep it concise — full examples go in `/docs/api.md`, not in JSDoc.

### Step 6 — Write /docs/api.md

Assemble the full reference file. Follow the format template above. Ensure every route is covered.

### Step 7 — Run the checklist

See below.

---

## Common API Documentation Mistakes

### Mistake 1: Documenting what the code should do instead of what it does

Symptom: API doc says "returns paginated results with `page` and `limit` params." The actual code has no pagination.

Fix: Read the route handler. Document what it actually does. File an issue if behavior does not match the spec.

### Mistake 2: Missing error responses

Symptom: Only the 200 response is documented. Developer hits a 409 on the vote endpoint and has no idea what it means.

Fix: Every route must document every non-200 status code it can return. The vote endpoint's 409 is the most important error in the entire API.

### Mistake 3: Example responses with placeholder data

Symptom: `"name": "string"` in the example response. This tells the developer nothing about what real data looks like.

Fix: Use realistic Indonesian koperasi data. Real examples teach the domain alongside the API.

### Mistake 4: Documenting internal IDs or implementation artifacts

Symptom: "The `submitter_hash` field contains the SHA-256 hash of..." This exposes implementation details and confuses API consumers.

Fix: Only document fields that appear in the API response. Internal fields that are stripped before response are not API surface.

### Mistake 5: Forgetting the photo_url conditional

Symptom: Documentation says `photo_url` is a string. Developer builds UI that always renders the photo. Photos appear for pending points.

Fix: Document explicitly: `photo_url` is `string | null`. It is `null` when `status` is not `approved`. This must be called out separately, not buried in a field list.

---

## Checklist for API Doc Completeness

```
[ ] All 6 routes are documented (GET /api/points, POST /api/points, GET /api/points/[id], POST /api/points/[id]/vote, GET /api/regions, GET /api/stats)
[ ] Each route has: HTTP method, path, purpose sentence, all parameters with types and constraints
[ ] Each route has: example request (copy-pasteable)
[ ] Each route has: example success response (valid JSON with realistic data)
[ ] Each route has: all error responses with status codes and reasons
[ ] Each route has: side effects documented (or "None" for read-only routes)
[ ] Vote endpoint: 409 Conflict documented with explanation and client handling guidance
[ ] Vote endpoint: status transition table included
[ ] Points endpoint: viewport parameters explained (what north/south/east/west mean)
[ ] Points endpoint: large viewport behavior documented (~500 point limit)
[ ] Points endpoint: Indonesia bounds constraint documented
[ ] Photo URL: conditional null behavior documented for non-approved points
[ ] Photo URL: full URL construction from Supabase Storage path documented
[ ] Regions endpoint: data quality caveat documented (inconsistent spelling)
[ ] Stability notice at top: "Routes may change until v1.0"
[ ] Authentication section: "None. All endpoints are public."
[ ] No internal implementation details exposed (no SQL, no hashing details, no RLS)
[ ] No future/planned endpoints documented
[ ] Response shapes match src/types/index.ts definitions
[ ] Field constraints match src/lib/validation.ts Zod schemas
[ ] Inline JSDoc added to each route.ts file
[ ] /docs/api.md file created or updated
```

---

## Integration with Other Skills

| Condition | Invoke |
|-----------|--------|
| New route added | `architect` for design review, then this skill to document |
| Route behavior changed | This skill to update both JSDoc and /docs/api.md |
| Validation schema changed | Re-verify constraints in docs match new Zod schema |
| New feature shipped | `changelog-writer` for the changelog entry |
| API docs link needed in CONTRIBUTING.md | `technical-writer` to update contributor docs |

---

## Exit Criteria

API documentation is complete when:

1. All 6 routes are documented in both inline JSDoc and `/docs/api.md`.
2. Every parameter, response field, and error code is documented with types and constraints.
3. Every example request is copy-pasteable and every example response is valid JSON.
4. The vote endpoint's 409, dedup rule, and status transition table are all explicitly documented.
5. The photo_url conditional behavior is documented for both the field list and in a callout.
6. The viewport parameter semantics and large-viewport behavior are documented.
7. No internal implementation details are exposed.
8. The checklist above is fully checked.
9. Documentation has been verified against the current source code, not written from memory or the spec alone.

---

*API docs are a contract with the developer. Every undocumented behavior is a bug they will file.*
