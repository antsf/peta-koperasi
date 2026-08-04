# typescript-reviewer

TypeScript code review skill for the Koperasi Desa Merah Putih Map codebase.

## Activation

Use this skill when reviewing TypeScript code for type safety, correctness, and adherence to this project's type contracts.

---

## The Shared Type Contract

All types live in `src/types/index.ts`. Every API response, every component prop, every Supabase query result must use these types. No ad-hoc inline types for domain objects.

```typescript
// src/types/index.ts

export type PointStatus = "pending" | "approved" | "flagged" | "removed";
export type VoteType = "upvote" | "downvote" | "flag";

export interface KoperasiPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  province: string;
  regency: string;
  description: string | null;
  photo_url: string | null;       // Only populated for approved points
  status: PointStatus;
  vote_count: number;
  created_at: string;             // ISO 8601
}

// DB-only type — NEVER exposed to client
export interface KoperasiPointDB extends KoperasiPoint {
  submitter_ip: string;           // Hashed
  submitter_fingerprint: string;  // Hashed
  updated_at: string;
}

export interface Vote {
  id: string;
  point_id: string;
  vote_type: VoteType;
  voter_fingerprint: string;      // Hashed
  created_at: string;
}

export interface Viewport {
  north: number;
  south: number;
  east: number;
  west: number;
  zoom: number;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string | Record<string, string[]>;
}
```

---

## Reviewing Zod Schemas vs TypeScript Types

Zod schemas and TypeScript types must mirror each other. When reviewing, check both:

```typescript
// ZOD SCHEMA — validates incoming data at runtime
const createPointSchema = z.object({
  name: z.string().min(1).max(200),
  latitude: z.number().min(-11).max(6),
  longitude: z.number().min(95).max(141),
  province: z.string().min(1),
  regency: z.string().min(1),
  description: z.string().max(2000).optional(),
  submitter_fingerprint: z.string().min(1),
});

// TYPESCRIPT TYPE — should match the Zod schema's output
type CreatePointInput = z.infer<typeof createPointSchema>;
```

### What to check
1. Every field in the Zod schema has a corresponding field in the TypeScript type.
2. Optional fields use `.optional()` in Zod and `?` or `| undefined` in the type.
3. Nullable fields use `.nullable()` in Zod and `| null` in the type. These are NOT the same as optional.
4. Use `z.infer<typeof schema>` to derive the type from the schema — do not manually duplicate.
5. Zod constraints (`.min()`, `.max()`) encode business rules. The TypeScript type alone cannot enforce these, which is why Zod is required at every API entry point.

---

## The PII Rule

### Client-facing types: NO PII

`KoperasiPoint` (the client type) must NEVER include:
- `submitter_ip`
- `submitter_fingerprint`

These exist only in `KoperasiPointDB` (the DB type).

### Review checklist for PII
- [ ] Does any API route return `submitter_ip` or `submitter_fingerprint` in its response?
- [ ] Does any Supabase query use `select("*")` that could leak these fields? Always use explicit column lists.
- [ ] Does any component import `KoperasiPointDB`? Client components should only use `KoperasiPoint`.
- [ ] Is the hash function applied BEFORE the Supabase insert, never after?

```typescript
// BAD — select("*") leaks PII columns
const { data } = await supabase.from("koperasi_points").select("*");

// GOOD — explicit columns, no PII
const { data } = await supabase
  .from("koperasi_points")
  .select("id, name, latitude, longitude, province, regency, description, photo_url, status, vote_count, created_at");
```

---

## Photo URL Typing

```typescript
photo_url: string | null;  // null until photo is approved by community votes
```

### Rules
- `photo_url` is `string | null`, never `string | undefined`, never `string`.
- Every place that renders a photo must handle the `null` case explicitly.
- The `null` case is not an error — it means "no photo submitted" or "photo pending review."

```typescript
// GOOD
{point.photo_url ? (
  <img src={point.photo_url} alt={point.name} loading="lazy" />
) : (
  <div className="bg-slate-100 aspect-video flex items-center justify-center">
    <span className="text-slate-400">{t("point.noPhoto")}</span>
  </div>
)}

// BAD — crashes when photo_url is null
<img src={point.photo_url} alt={point.name} />
```

---

## Status as a Union Type

`PointStatus` is `"pending" | "approved" | "flagged" | "removed"`. Never `string`.

### How to catch "status could be anything" bugs

```typescript
// BAD — status is string, no compile-time safety
function getStatusColor(status: string): string {
  if (status === "approved") return "green";
  if (status === "pending") return "yellow";
  return "gray"; // What about "flagged"? Compiler doesn't know.
}

// GOOD — exhaustive switch with never check
function getStatusColor(status: PointStatus): string {
  switch (status) {
    case "approved": return "text-green-600";
    case "pending": return "text-yellow-600";
    case "flagged": return "text-red-600";
    case "removed": return "text-slate-400";
    default: {
      const _exhaustive: never = status;
      throw new Error(`Unknown status: ${_exhaustive}`);
    }
  }
}
```

The `never` pattern ensures that if a new status is added to `PointStatus`, the compiler will flag every switch statement that does not handle it.

### Where to enforce
- `getStatusColor()` utility
- Status badge rendering in `PointCard`
- Filter logic in `/pending` page
- API route validation schemas (`z.enum(["pending", "approved", "flagged", "removed"])`)

---

## API Response Return Types

Every API route handler must have an explicit return type annotation.

```typescript
// GOOD — explicit return type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<KoperasiPoint> | ApiError>> {
  // ...
}

// BAD — inferred return type, unclear what the client receives
export async function GET(request: NextRequest) {
  // TypeScript infers something, but the reader can't see the contract
}
```

### Why this matters
- The return type IS the API contract. Making it explicit catches accidental response shape changes.
- `ApiResponse<T>` and `ApiError` are the only two shapes a handler should return.
- The client can rely on checking `response.success` to narrow the type.

---

## Common TypeScript Mistakes in This Codebase

### 1. Typing Supabase responses as `any`
```typescript
// BAD
const { data } = await supabase.from("koperasi_points").select("*");
const points = data as any[];  // Lost all type safety

// GOOD — use Supabase generated types
import type { Database } from "@/lib/supabase/types";
type PointRow = Database["public"]["Tables"]["koperasi_points"]["Row"];
```

### 2. Forgetting null checks on optional fields
```typescript
// BAD — description could be null
<p>{point.description.substring(0, 100)}</p>

// GOOD
<p>{point.description?.substring(0, 100) ?? t("point.noDescription")}</p>
```

### 3. Using `as` to bypass validation
```typescript
// BAD — skipping Zod, trusting the shape
const body = await request.json() as CreatePointInput;

// GOOD — runtime validation
const parsed = createPointSchema.safeParse(await request.json());
if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
const body = parsed.data; // Now correctly typed AND validated
```

### 4. Importing DB types in client code
```typescript
// BAD — client component imports KoperasiPointDB
import type { KoperasiPointDB } from "@/types";

// GOOD — client only sees the safe type
import type { KoperasiPoint } from "@/types";
```

### 5. Raw string comparisons for status
```typescript
// BAD — typo "aproved" compiles fine
if (point.status === "aproved") { ... }

// GOOD — TypeScript catches the typo because status is PointStatus
// Error: This comparison appears to be unintentional because the types
// '"pending" | "approved" | "flagged" | "removed"' and '"aproved"' have no overlap.
```

---

## Using Supabase Generated Types

Supabase can generate types from the database schema into `src/lib/supabase/types.ts`.

### How to use them without spreading everywhere

```typescript
// src/lib/supabase/types.ts — auto-generated, do not edit
export interface Database {
  public: {
    Tables: {
      koperasi_points: {
        Row: { /* all columns */ };
        Insert: { /* columns for insert */ };
        Update: { /* columns for update */ };
      };
    };
  };
}

// src/lib/supabase/points.ts — manual mapping layer
import type { Database } from "./types";
import type { KoperasiPoint, KoperasiPointDB } from "@/types";

type PointRow = Database["public"]["Tables"]["koperasi_points"]["Row"];

// Map from DB row to client-safe type
function toKoperasiPoint(row: PointRow): KoperasiPoint {
  return {
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    province: row.province,
    regency: row.regency,
    description: row.description,
    photo_url: row.photo_url,
    status: row.status as PointStatus,  // Safe because DB constraint matches the union
    vote_count: row.vote_count,
    created_at: row.created_at,
    // NOTE: submitter_ip and submitter_fingerprint are deliberately excluded
  };
}
```

### Rules
- Supabase generated types (`Database`) live in `src/lib/supabase/types.ts`. Regenerate with `npx supabase gen types`.
- Domain types (`KoperasiPoint`, `Vote`, etc.) live in `src/types/index.ts`.
- The mapping functions in `src/lib/supabase/points.ts` are the ONLY place where `as PointStatus` casting is acceptable — because the DB constraint guarantees validity.
- Components and API routes import from `@/types`, never from `@/lib/supabase/types`.

---

## TypeScript Review Checklist

For every file under review:

- [ ] No `any` types (or each one has a `// TODO:` comment with justification).
- [ ] All API route handlers have explicit return type annotations using `ApiResponse<T>` or `ApiError`.
- [ ] Zod schemas mirror TypeScript types — use `z.infer<>` where possible.
- [ ] `PointStatus` is a union type, never `string`. All switches are exhaustive.
- [ ] `photo_url` is typed as `string | null` and null-checked before rendering.
- [ ] No `submitter_ip` or `submitter_fingerprint` in client-facing types or responses.
- [ ] Supabase queries use explicit column lists, not `select("*")`.
- [ ] No `as` casts except in the DB-to-domain mapping layer (`src/lib/supabase/*.ts`).
- [ ] Null/undefined checks present for every optional field before access.
- [ ] Types imported from `@/types`, not from `@/lib/supabase/types` in components.

---

## Exit Criteria

A TypeScript review is complete when:
1. Zero `any` types without justification.
2. Every API route has an explicit return type.
3. All Zod schemas match their corresponding TypeScript types.
4. The PII rule is enforced — no IP/fingerprint in client types or responses.
5. All status comparisons use `PointStatus`, not raw strings.
6. All `photo_url` usages handle the `null` case.
7. No `as` casts outside the Supabase mapping layer.
8. The review checklist has zero unchecked items.
