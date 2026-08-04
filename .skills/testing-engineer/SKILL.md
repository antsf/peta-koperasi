# testing-engineer

Test strategy and implementation skill for the Koperasi Desa Merah Putih Map project.

## Philosophy

Test the voting logic like your life depends on it. Test everything else proportionally to its risk. No snapshot tests, no "a div renders" tests, no testing vendor behavior (Supabase connects, Next.js routes). Every test must justify its existence by protecting against a real failure mode.

---

## What MUST Be Tested (Critical Path)

These are non-negotiable. A PR touching any of these areas without corresponding tests must be blocked.

### 1. Voting State Machine — All Transitions

The voting system is the trust layer of the entire platform. Every valid transition and every invalid transition must be covered.

**Valid transitions (test each):**

| Current State | Condition | Next State |
|---|---|---|
| `pending` | `upvotes >= 3` | `approved` |
| `pending` | `downvotes >= 3` | `flagged` |
| `flagged` | `downvotes >= 6` | `removed` |
| `flagged` | `upvotes >= 5` | `approved` |

**Invalid transitions (test that each is rejected):**

| Current State | Attempted Action | Expected |
|---|---|---|
| `approved` | any vote | Reject — approved points are immutable |
| `removed` | any vote | Reject — removed points are immutable |

**Boundary conditions (test each):**

- `pending` with `upvotes = 2` -> still `pending`
- `pending` with `upvotes = 3` -> transitions to `approved`
- `flagged` with `upvotes = 4` -> still `flagged`
- `flagged` with `upvotes = 5` -> transitions to `approved`
- `flagged` with `downvotes = 5` -> still `flagged`
- `flagged` with `downvotes = 6` -> transitions to `removed`
- `pending` with `downvotes = 2` -> still `pending`
- `pending` with `downvotes = 3` -> transitions to `flagged`

Write these as a state transition table using `it.each` or `describe.each`:

```typescript
describe("Voting State Machine", () => {
  describe("valid transitions", () => {
    it.each([
      { initial: "pending", upvotes: 3, downvotes: 0, expected: "approved" },
      { initial: "pending", upvotes: 0, downvotes: 3, expected: "flagged" },
      { initial: "flagged", upvotes: 0, downvotes: 6, expected: "removed" },
      { initial: "flagged", upvotes: 5, downvotes: 0, expected: "approved" },
    ])(
      "$initial -> $expected (up=$upvotes, down=$downvotes)",
      ({ initial, upvotes, downvotes, expected }) => {
        // ...
      }
    );
  });

  describe("boundary: no transition yet", () => {
    it.each([
      { initial: "pending", upvotes: 2, downvotes: 0, expected: "pending" },
      { initial: "pending", upvotes: 0, downvotes: 2, expected: "pending" },
      { initial: "flagged", upvotes: 4, downvotes: 0, expected: "flagged" },
      { initial: "flagged", upvotes: 0, downvotes: 5, expected: "flagged" },
    ])(
      "$initial stays $expected (up=$upvotes, down=$downvotes)",
      ({ initial, upvotes, downvotes, expected }) => {
        // ...
      }
    );
  });

  describe("invalid transitions (immutable states)", () => {
    it.each(["approved", "removed"])(
      "rejects vote on %s point",
      (status) => {
        // Expect 409 or appropriate error
      }
    );
  });
});
```

### 2. Vote Deduplication

Test the UNIQUE constraint behavior: same `voter_hash` + `point_id` must return 409 on second attempt.

```typescript
describe("POST /api/points/[id]/vote", () => {
  it("returns 409 when same voter votes twice", async () => {
    // First vote succeeds
    const res1 = await POST(request, { params: { id: pointId } });
    expect(res1.status).toBe(200);

    // Second vote from same voter_hash is rejected
    const res2 = await POST(request, { params: { id: pointId } });
    expect(res2.status).toBe(409);
  });

  it("allows different voters to vote on same point", async () => {
    // voter A votes — 200
    // voter B votes — 200
  });
});
```

### 3. Zod Schema Validation

Test every schema for all 6 routes. Focus on boundary values.

**Indonesia coordinate bounds:**

```typescript
describe("Coordinate validation", () => {
  // Valid boundaries
  it("accepts lat = -11 (south boundary)", ...);
  it("accepts lat = 6 (north boundary)", ...);
  it("accepts lng = 95 (west boundary)", ...);
  it("accepts lng = 141 (east boundary)", ...);

  // Just outside boundaries
  it("rejects lat = -11.0001", ...);
  it("rejects lat = 6.0001", ...);
  it("rejects lng = 94.9999", ...);
  it("rejects lng = 141.0001", ...);

  // Edge: exactly on boundary
  it("accepts lat = -11.0000", ...);
  it("accepts lat = 6.0000", ...);
});
```

**Other schema tests:**

- `name` field: empty string rejected, max length enforced, whitespace-only rejected
- Required vs optional fields: omitting required fields returns 400 with field-specific error
- `photo_url`: valid URL accepted, non-URL string rejected, `null`/`undefined` accepted (optional)
- `koperasi_type`: only enum values accepted, random string rejected
- `vote_type`: only `"up"` or `"down"` accepted

### 4. photo_url Null Rule

Verify that `photo_url` is null/hidden in API responses for non-approved points:

```typescript
it("returns photo_url for approved points", async () => {
  const point = await fetchPoint(approvedId);
  expect(point.photo_url).toBe("https://example.com/photo.jpg");
});

it("returns photo_url as null for pending points", async () => {
  const point = await fetchPoint(pendingId);
  expect(point.photo_url).toBeNull();
});

it("returns photo_url as null for flagged points", async () => {
  const point = await fetchPoint(flaggedId);
  expect(point.photo_url).toBeNull();
});
```

### 5. PII Hashing

Assert that raw IP and raw fingerprint are never stored or returned.

```typescript
describe("PII protection", () => {
  it("stores SHA-256 hash, not raw IP", async () => {
    const rawIp = "192.168.1.100";
    const rawFingerprint = "abc123fingerprint";

    await submitVote(rawIp, rawFingerprint);

    // Inspect the mock — assert the value passed to Supabase insert
    const insertedRow = mockSupabase.getLastInsert("votes");
    expect(insertedRow.voter_hash).not.toContain(rawIp);
    expect(insertedRow.voter_hash).not.toContain(rawFingerprint);
    expect(insertedRow.voter_hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
  });

  it("does not include raw IP in any API response", async () => {
    const res = await GET(request);
    const body = await res.json();
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain("192.168.1.100");
  });
});
```

### 6. Rate Limit Logic

Test the 10 submissions per IP per hour rule:

```typescript
describe("Rate limiting", () => {
  it("allows 10 submissions from same IP", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await POST(makeRequest(i));
      expect(res.status).toBe(201);
    }
  });

  it("rejects 11th submission from same IP within 1 hour", async () => {
    // Submit 10 successfully, then...
    const res = await POST(makeRequest(11));
    expect(res.status).toBe(429);
  });

  it("allows submission after rate limit window expires", async () => {
    // Mock time advancement past 1 hour
  });
});
```

---

## What SHOULD Be Tested

Lower priority but still valuable. Write these after critical-path tests pass.

- **`geo.ts` query builder**: Verify correct SQL parameters for bounding box and radius queries. Mock the Supabase `.rpc()` call, assert parameters match expected values.
- **API response shapes**: Assert correct fields are present, no PII fields leak (no `voter_hash`, no `ip_address`, no `fingerprint` in response JSON).
- **Error responses**: Correct HTTP status codes (400 for validation, 404 for not found, 409 for conflict, 429 for rate limit, 500 for server error). Error body includes a human-readable `message` field.

---

## What Should NOT Be Tested

Do not write tests for any of the following:

- Tailwind classes render correctly
- Next.js routing works (vendor responsibility)
- Supabase client connects (vendor responsibility)
- A `<div>` renders
- Component visual output (no snapshot tests)
- Third-party library internals (Leaflet, FingerprintJS)
- CSS/layout (use manual QA or visual regression in v2+)

---

## Vitest Setup

### Configuration

Tests live colocated next to source files:

```
src/lib/validation.test.ts
src/lib/voting.test.ts
src/lib/geo.test.ts
src/lib/privacy.test.ts
src/app/api/points/route.test.ts
src/app/api/points/[id]/vote/route.test.ts
```

### Mocking the Supabase Client

Create a shared mock factory. Both `anon` (public reads) and `service_role` (writes, admin) keys need mocking.

```typescript
// src/test/mocks/supabase.ts
import { vi } from "vitest";

export function createMockSupabaseClient() {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();

  // Chain builder pattern
  mockFrom.mockReturnValue({
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle,
        limit: vi.fn(),
      }),
    }),
    insert: mockInsert.mockReturnValue({
      select: mockSelect,
    }),
    update: mockUpdate.mockReturnValue({
      eq: mockEq,
    }),
  });

  return {
    client: { from: mockFrom, rpc: mockRpc },
    mocks: { mockFrom, mockRpc, mockInsert, mockSelect, mockUpdate, mockEq, mockSingle },
  };
}
```

Mock the module in test files:

```typescript
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase", () => {
  const { client, mocks } = createMockSupabaseClient();
  return {
    supabaseAnon: client,
    supabaseAdmin: client,
    __mocks: mocks, // Exposed for assertions
  };
});
```

### Mocking FingerprintJS

```typescript
vi.mock("@fingerprintjs/fingerprintjs", () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue({
      visitorId: "mock-fingerprint-id",
    }),
  }),
}));
```

### Test Utilities — Fake Data Factories

```typescript
// src/test/factories.ts
import { randomUUID } from "crypto";

export function fakeKoperasiPoint(overrides: Partial<KoperasiPoint> = {}): KoperasiPoint {
  return {
    id: randomUUID(),
    name: "Koperasi Maju Bersama",
    koperasi_type: "simpan_pinjam",
    latitude: -6.2,
    longitude: 106.816,
    status: "pending",
    upvotes: 0,
    downvotes: 0,
    photo_url: null,
    description: "Test koperasi",
    created_at: new Date().toISOString(),
    voter_hash: null,
    ...overrides,
  };
}

export function fakeVote(overrides: Partial<Vote> = {}): Vote {
  return {
    id: randomUUID(),
    point_id: randomUUID(),
    vote_type: "up",
    voter_hash: "a".repeat(64),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
```

---

## Test Naming Convention

Follow this pattern strictly:

```typescript
describe("POST /api/points/[id]/vote", () => {
  it("returns 200 and increments upvotes for valid upvote", ...);
  it("returns 409 when same voter votes twice", ...);
  it("returns 404 when point does not exist", ...);
  it("returns 400 when vote_type is invalid", ...);
  it("transitions pending to approved at 3 upvotes", ...);
  it("rejects vote on approved point", ...);
});

describe("Zod: SubmitPointSchema", () => {
  it("accepts valid point at Indonesia south boundary (lat = -11)", ...);
  it("rejects latitude below -11", ...);
  it("rejects empty name", ...);
});
```

Format: `describe("<HTTP Method> <route>" | "<Module>: <SchemaOrFunction>")` and `it("<verb>s <what> <condition>")`.

---

## Checklist Before Marking a Feature as Tested

Before a feature is considered tested, confirm ALL of the following:

- [ ] All valid state transitions covered with exact threshold values
- [ ] All invalid state transitions covered (approved/removed are immutable)
- [ ] Boundary conditions tested (N-1 vs N for every threshold)
- [ ] Zod schema tested: valid input, each invalid field individually, edge values
- [ ] Dedup constraint tested (409 on duplicate voter)
- [ ] PII assertion: raw IP/fingerprint never in stored data or response
- [ ] Rate limit: 10th request passes, 11th fails with 429
- [ ] photo_url hidden for non-approved statuses
- [ ] Error responses return correct status codes and message field
- [ ] No flaky tests (no real timers, no network calls, no random values without seed)
- [ ] Tests run in < 5 seconds total
- [ ] `npx vitest run` passes with zero warnings

---

## Exit Criteria

The test suite is complete when:

1. **100% of critical-path items** from the MUST list are tested
2. **All voting state transitions** pass including boundary cases
3. **Zero PII leaks** — tests assert raw IP/fingerprint never appears in any output
4. **Coverage of `src/lib/voting.ts`** is 100% branch coverage
5. **Coverage of `src/lib/validation.ts`** is 100% line coverage
6. **All tests pass** with `npx vitest run` — zero failures, zero skips
7. **Tests are deterministic** — running 10 times produces identical results
8. **No mocks of implementation details** — only mock external boundaries (Supabase, FingerprintJS, time)
