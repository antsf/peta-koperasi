# Skill: feature-planner

Break a feature request into a safe, mergeable, reviewable implementation plan before any code is written.

---

## Purpose

Most features fail not because the code is wrong but because the plan was never explicit. This skill converts a vague feature request into a sequence of concrete, ordered tasks — each small enough to be understood and reviewed in isolation, each building on a stable foundation.

This is not a project management tool. It is an engineering decomposition tool. The output is a plan that any contributor to this repo can pick up and execute without a follow-up explanation.

---

## When to Invoke

- A feature spans more than one file or layer (API + DB + component).
- You are about to write more than ~100 lines of new code.
- The feature touches a locked architectural rule (even if it complies with it).
- A PR would be too large to review in one sitting.
- Multiple contributors might work on the feature in parallel.
- You are unsure what order to implement things in.

## When NOT to Invoke

- A single-file change (typo, Indonesian copy tweak, color tweak).
- A pure refactor within one module.
- A bug fix with a clear, isolated root cause.
- You already have a plan and just need implementation guidance — use `nextjs-expert`, `postgis-expert`, etc. directly.

---

## Inputs

1. **Feature name** — one noun phrase. ("Region filter search", not "make search work better".)
2. **User story** — one sentence. Who does what and why.
3. **Scope confirmation** — Is this in SPEC.md? Is it explicitly in §10 out-of-scope? If out-of-scope, stop here.
4. **Affected soul.md value** — which of the four decision questions does this serve?
5. **Known constraints** — anything from `CLAUDE.md`'s locked rules that this feature touches.

---

## Outputs

A written plan containing:

1. **Feature summary** — 2–3 sentences of context.
2. **Prerequisite check** — DB migrations, env vars, new dependencies needed before implementation starts.
3. **Implementation tasks** — ordered list, each task is:
   - One sentence description
   - Files touched (specific paths from SPEC.md §7 file structure)
   - Acceptance criterion (how to verify this task is done)
   - Estimated size: S (< 30 lines), M (30–100 lines), L (> 100 lines)
4. **Integration points** — where this feature connects to existing code (specific function/route names).
5. **Test plan** — what tests must be written and where.
6. **Rollback notes** — if this goes wrong, what breaks and how to revert.
7. **Follow-on skills** — which specialist skills to invoke during implementation.

---

## Thinking Process

### Step 1 — Validate against scope

```
Is this feature in SPEC.md §10 out-of-scope list?
  YES → Stop. Return the exact §10 line that covers it. Explain the "why" from soul.md.
  NO  ↓

Does this feature exist in SPEC.md already (user stories §2, API routes §4, components §6)?
  YES → This is an implementation task, not a new feature. Use the spec directly.
  NO  ↓

Does this feature serve at least one of the four soul.md decision questions?
  NO  → Flag misalignment. Ask: "Is this feature for village residents or for engineers?"
  YES ↓

Proceed to decomposition.
```

### Step 2 — Identify the data path

Every feature has a data path. Trace it before writing a single task:

```
Where does data originate?
  → User input (form, map click, search query)
  → External data (geocoding result, OSM tile)
  → DB query result

Where does it end up?
  → DB row inserted/updated
  → UI rendered
  → API response returned

What transforms happen in between?
  → Validation (Zod schema — always at API boundary)
  → Hashing (IP/fingerprint — always before INSERT)
  → Status check (photo visibility — always before returning photo_url)
  → Spatial query (viewport bounds — always ST_Within, never full scan)
```

Map the full path on paper before deciding on task order. The data path reveals dependencies. Tasks that produce data must come before tasks that consume it.

### Step 3 — Find the natural seams

This project's layer structure creates natural seam points where one task ends and the next begins:

```
Layer 1: DB migration (Supabase SQL)
Layer 2: Server-side lib (geo.ts, validation.ts, supabase/server.ts)
Layer 3: API route handler (app/api/.../route.ts)
Layer 4: Server component (app/.../page.tsx)
Layer 5: Client component (components/*.tsx)
Layer 6: Tests (*.test.ts colocated with source)
```

Each layer can be implemented and verified independently. Tasks should map to layers, not to "frontend" vs "backend" (which is too coarse).

**Rule:** Never write a Layer 3 task that depends on a Layer 5 decision. Work top-down or bottom-up, not interleaved.

### Step 4 — Size each task

Apply these heuristics:

| Size | Lines of new code | Review time | Criterion |
|------|-------------------|-------------|-----------|
| S | < 30 | 5 min | Single function, single responsibility |
| M | 30–100 | 20 min | One module, one clear concern |
| L | > 100 | 45+ min | Needs sub-tasks |

If any task is L, decompose it further. A plan with an L task is an unfinished plan.

Exception: DB migration files can be M–L because they are declarative SQL, not logic.

### Step 5 — Check for parallel work

Which tasks have no dependency on each other? These can be worked on simultaneously by different contributors. Make this explicit in the plan.

Common parallelizable pairs in this project:
- API route + component shell (component renders loading state while route is built)
- DB migration + Zod validation schema (both define the same data shape, from different angles)

### Step 6 — Write the test plan before the implementation tasks

Yes, before. The test plan reveals what each task must prove. If you cannot describe a test for a task, the task's acceptance criterion is unclear and needs to be rewritten.

Test locations per layer:
- Layer 2 lib functions → `src/lib/*.test.ts`
- Layer 3 API routes → `src/app/api/**/*.test.ts`
- Layer 5 client components → `src/components/*.test.tsx` (only if complex stateful logic)
- No tests for: page layout, static text, Tailwind classes

---

## Feature Decomposition by Type

### Type A: New data field on `koperasi_points`

Order of tasks:
1. DB migration: add column + index if needed
2. Update Zod schema in `src/lib/validation.ts`
3. Update TypeScript types in `src/types/index.ts`
4. Update `GET /api/points/[id]` to return new field
5. Update `POST /api/points` to accept and store new field
6. Update `PointCard` component to display new field
7. Update `SubmitForm` component to include new field input
8. Add field label as hardcoded Bahasa Indonesia in the component
9. Write tests for new Zod schema rules and API response shape

**Critical check:** Does the new field contain any PII? If yes, add hashing at Layer 2 (hash.ts) before the validation schema.

### Type B: New map filter or search behavior

Order of tasks:
1. Update `GET /api/points` query params + Zod validation
2. Update PostGIS query in `src/lib/geo.ts`
3. Update `RegionFilter` or `SearchBar` component state
4. Update `MapView` to re-fetch on filter change
5. Add new filter labels as hardcoded Bahasa Indonesia
6. Write tests for: Zod param validation, geo query builder, component filter state

**Critical check:** Is the filter using viewport bounds? Any new filter that ignores the bounding box risks loading too many points.

### Type C: New page route

Order of tasks:
1. Confirm page is in SPEC.md §6.1 (if not, run `architect` first)
2. Create `app/[route]/page.tsx` (server component shell)
3. Create required API routes if not yet existing
4. Create any new components (client components with `"use client"` only if needed)
5. Add link to page in `Header` component
6. Add page title, description, and UI labels as hardcoded Bahasa Indonesia
7. Write tests for the new API routes
8. Manual test via SPEC.md §9 deployment checklist steps

### Type D: Voting logic change

**Stop.** Voting logic changes touch CLAUDE.md's locked rules 1 (vote dedup), 6 (hash PII), and 9 (status transitions). Run `architect` first. Do not implement voting logic changes without explicit architectural sign-off.

If approved, the only files that change:
- `src/app/api/points/[id]/vote/route.ts` — logic
- `supabase/migrations/` — if threshold values become configurable
- `SPEC.md §5` — spec must be updated to reflect new transitions
- Tests for the new transition cases

---

## Planning Checklist

```
[ ] Feature is in-scope (not in SPEC.md §10)
[ ] Feature serves at least one soul.md decision question
[ ] Data path traced end-to-end before any tasks written
[ ] All tasks assigned to a specific layer (1–7)
[ ] No task is L-sized (> 100 lines) — decomposed further if so
[ ] Parallel tasks identified and labeled
[ ] Test plan written before implementation tasks finalized
[ ] Bahasa Indonesia copy task included (all new UI strings hardcoded in Indonesian)
[ ] No new auth, admin routes, or paid services introduced
[ ] Photo visibility rule checked: photo_url null unless status = 'approved'
[ ] PII handling checked: any new stored data must be reviewed for IP/fingerprint
[ ] PostGIS check: any new DB query loading map points is viewport-bounded
[ ] Rollback: if DB migration, is it reversible? (DOWN migration written?)
[ ] Follow-on skills identified
```

---

## Common Planning Mistakes

### Mistake 1: Planning the UI before the data model

Symptoms: Task list starts with "Build the search bar component" before the API route or DB schema is defined. The component then gets re-written twice as the data shape clarifies.

Fix: Always start from the data. Layer 1 (DB) → Layer 2 (lib) → Layer 3 (API) → Layer 4–5 (UI).

### Mistake 2: One task that does everything

Symptoms: "Implement the region filter feature" as a single task. No acceptance criterion. Could take a day or an hour.

Fix: If a task description contains "and," split it. If you cannot write a 1-sentence acceptance criterion, the task is too large.

### Mistake 3: Forgetting to use Bahasa Indonesia

Symptoms: PR adds a new UI feature in English only. Contributor realizes too late the UI is inconsistent.

Fix: Every feature plan must include a task to write all new user-facing strings in Bahasa Indonesia directly in the component. This project has no i18n system — strings are hardcoded in Indonesian. It is always an S-sized task. There is no excuse to forget it.

### Mistake 4: Planning new behavior without planning the test

Symptoms: "Add downvote count display" with no test task. Later: is the count correct? Nobody checked.

Fix: For every task that changes business logic or data display, write the test task immediately after. They travel in pairs.

### Mistake 5: Planning around a locked rule

Symptoms: Plan includes "store the submitter's session ID so they can view their pending submissions." Sounds innocent. It's auth — Rule 4.

Fix: Catch this at Step 1 (validate against scope). If a plan step requires identifying who did something, it requires auth. Reject and redesign.

---

## Example: Planning "Region Filter Search" Feature

**Input:** "As a visitor, I can filter map pins by selecting a province and/or kabupaten from dropdowns."

**Step 1 — Scope check:**
- Is it in §10 out-of-scope? No. "Search / filter by region" is explicitly in MVP scope.
- Is it in SPEC.md §2? Yes — user story V3.
- soul.md: serves "useful for village residents" (they can find cooperatives in their area).

**Step 2 — Data path:**
```
User selects provinsi dropdown
  → RegionFilter component state updates
  → MapView re-fetches GET /api/points with ?provinsi=X&kabupaten=Y params
  → API route validates params via Zod
  → geo.ts PostGIS query adds WHERE provinsi = $1 AND kabupaten = $2 to ST_Within query
  → Returns filtered pin list
  → MapView re-renders with new pins
```

**Step 3 — Seams identified:**
- Layer 1: No migration needed (columns exist)
- Layer 2: Update `src/lib/geo.ts` query builder to accept optional provinsi/kabupaten filters
- Layer 3: Update `GET /api/points` Zod schema to accept optional `provinsi`, `kabupaten` params
- Layer 4: None (home page.tsx is already server component shell, no change)
- Layer 5: Update `RegionFilter` component + wire to `MapView` re-fetch
- Layer 5: Update `SearchBar` to include `RegionFilter`
- Layer 6: Tests for Zod schema (valid/invalid params), geo.ts filter query

**Tasks:**

| # | Task | Files | Acceptance | Size |
|---|------|-------|------------|------|
| 1 | Add optional `provinsi` + `kabupaten` params to `GET /api/points` Zod schema | `src/lib/validation.ts` | Zod rejects unknown params, accepts valid strings | S |
| 2 | Update `getPointsInViewport()` in geo.ts to accept optional region filters | `src/lib/geo.ts` | SQL includes WHERE clause only when params provided | M |
| 3 | Update `GET /api/points` route to pass region params to geo.ts | `src/app/api/points/route.ts` | API returns filtered results for valid region params | S |
| 4 | Build `RegionFilter` component with cascading province → kabupaten dropdowns | `src/components/region-filter.tsx` | Selecting province populates kabupaten options; clear resets filter | M |
| 5 | Wire `RegionFilter` into `MapView` re-fetch on filter change | `src/components/map-view.tsx` | Map pins update when filter changes; viewport bounds preserved | M |
| 6 | Ensure `RegionFilter` labels are hardcoded in Bahasa Indonesia | `src/components/region-filter.tsx` | All dropdown labels render in Bahasa Indonesia | S |
| 7 | Unit tests for validation schema + geo.ts filter query | `src/lib/validation.test.ts`, `src/lib/geo.test.ts` | Tests cover: no filter, province only, both province+kabupaten, invalid input | M |

**Parallel tasks:** 4 and 1/2/3 can be parallelized (component can render with mock data while API is built).

**Test plan:** See task 7. Also manual: verify pins disappear when filtering to a region with no approvals.

**Follow-on skills:** `postgis-expert` for geo.ts query syntax. `react-performance` to verify MapView does not re-render on every keystroke.

---

## Integration with Other Skills

| Condition | Invoke |
|-----------|--------|
| New feature that changes architecture | `architect` first — always |
| Implementation of any DB task | `postgis-expert` + `supabase-review` |
| Implementation of any API task | `api-review` + `security-review` |
| Implementation of any UI task | `nextjs-expert` + `ui-review` |
| Implementation of any map task | `leaflet-expert` + `map-ux-reviewer` |
| Feature is fully implemented | `product-review` for acceptance |

---

## Exit Criteria

A feature plan is complete when:

1. All tasks are S or M sized (no L tasks).
2. Every task has: one-sentence description, specific file path(s), acceptance criterion.
3. Bahasa Indonesia copy task is present for every new UI string.
4. Test task is present for every logic or data-display change.
5. Checklist above is fully checked.
6. Plan has been reviewed against SPEC.md: no contradictions, no out-of-scope items.
7. Plan is short enough to be read in under 10 minutes. If not, split the feature.

---

*A plan is a promise to your future reviewers. Write it for them, not for yourself.*
