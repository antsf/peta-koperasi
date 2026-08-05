# Skill: architect

Architectural decision-making for the Koperasi Desa Merah Putih Map project.

---

## Purpose

Guide every structural decision — data flow, module boundaries, service choices, query patterns, state management — through the lens of this project's specific constraints: civic-tech values, anonymous participation, PostGIS geography, community governance, and long-term maintainability by a distributed open-source community.

This skill is about **thinking through consequences**, not generating boilerplate.

---

## When to Invoke

- A new feature is being proposed and you need to reason about where it fits in the existing structure.
- An existing module is growing too large or has unclear ownership.
- A new dependency is being considered.
- Someone proposes something that feels architecturally wrong but you cannot articulate why.
- A decision will touch multiple layers (API + DB + UI) simultaneously.
- A "simple" request would require violating one of the locked architectural rules.

## When NOT to Invoke

- Implementation details within an already-decided module (use `nextjs-expert`, `postgis-expert`, etc.).
- Styling or UI layout questions (use `ui-review`).
- Performance tuning of existing code (use `react-performance`, `bundle-review`).
- Writing a single utility function.

---

## Inputs

Before starting, answer these:

1. What is the **proposed change or feature** in plain language?
2. Which **existing modules** would it touch? (API routes, DB tables, components, lib utilities)
3. What **soul.md value** is this serving? (If none, that's a signal.)
4. Does this change **any of the 9 locked architectural rules** in `CLAUDE.md`?
5. Is this **v1 scope or explicitly out-of-scope** per `SPEC.md §10`?

If the answer to question 5 is "out of scope," stop. Do not architect it. Return the out-of-scope list to the requester and explain why.

---

## Outputs

A written architectural decision containing:

- **Decision**: one sentence, what we're doing.
- **Why**: what problem it solves, which soul.md value it serves.
- **What changes**: which files/modules are added or modified.
- **What stays the same**: explicit call-out of boundaries not crossed.
- **Risks**: what could go wrong with this approach.
- **Alternatives rejected**: what else was considered and why it was worse.
- **Exit criteria**: how we know the implementation is done and correct.

---

## Thinking Process

### Step 1 — Apply the soul.md filter first

Before any technical analysis, run the proposal through the four decision questions from `soul.md`:

```
1. Does this make the map more useful for village residents?
2. Does this keep the project simple and runnable by anyone?
3. Does this respect contributors?
4. Does this stay open (no vendor lock-in)?
```

A proposal that fails question 1 and cannot answer "it enables something that will" is suspect. Document this. Do not reject it outright — civic tech occasionally needs infrastructure work — but name the gap.

### Step 2 — Check locked rules

Go through `CLAUDE.md`'s 9 locked architectural rules one by one. Not just the ones obviously related. Check all nine. Ask: "Does this change put pressure on any of these rules?"

Common pressure points:
- New data stored → Does it include IP or fingerprint? → Must hash.
- New status transition → Is it in the spec? → Reject if not.
- New photo display → Is the point approved? → Must check status.
- New map data load → Is it viewport-bounded? → Must use ST_Within.
- New route → Does it need a "privileged" action? → No admin routes.

### Step 3 — Draw the data flow

Sketch the data path from user action to DB and back. Ask at each boundary:

- **Who calls this?** (browser, server component, API route, background job)
- **What trust level does the caller have?** (public anonymous = untrusted; service role = trusted)
- **Where is validation?** Zod schema must be the first thing that runs in every API route.
- **Where does hashing happen?** IP + fingerprint hash must happen before any INSERT.
- **What does the DB return?** Never return raw PII columns. Strip `submitter_ip`, `submitter_fingerprint` from all API responses.

### Step 4 — Module boundary test

For each new file/module being proposed, apply this test:

> "Could a contributor who just discovered this repo in one day understand what this module does, modify it safely, and know what NOT to touch?"

If no: the boundary is wrong. Either it's doing too much, or it's named opaquely, or it depends on implicit context.

Prefer **flat over nested**. A utility function used once stays near its use site. Only promote to `src/lib/` when used by 2+ independent modules.

### Step 5 — Dependency cost analysis

For every new `npm install` being proposed:

| Question | Threshold |
|----------|-----------|
| What is the bundle size impact? | Reject > 50kB gzipped without strong justification |
| Is it maintained? (last commit?) | Reject if abandoned > 1 year |
| Does it replace something we already have? | Yes → use what we have |
| Is there a native Web API alternative? | Yes → use that instead |
| Does it require a paid tier for production use? | Reject immediately |
| Does it introduce a new config file? | Question whether the complexity is worth it |

This project uses: Next.js, Supabase client, Leaflet, Tailwind, Zod, FingerprintJS. These are **locked**. Do not replace them. Do not add competitors alongside them.

### Step 6 — Open-source contributor legibility

Every architectural decision must be evaluated from the perspective of:

- A **serious developer** who wants to add a significant feature.
- A **vibe coder** who wants to fix a typo or improve a UI string.
- A **non-coder** who wants to improve documentation or file an issue.

Ask: "Does this change make the codebase harder for any of these three to engage with?" If yes, document the tradeoff explicitly.

---

## Decision Tree

```
Is it in SPEC.md's out-of-scope list?
  YES → Decline. Return SPEC.md §10.
  NO  ↓

Does it violate any of the 9 locked rules in CLAUDE.md?
  YES → Decline. Name the specific rule. Suggest a compliant alternative.
  NO  ↓

Does it fail all four soul.md decision questions?
  YES → Flag as misaligned. Ask requester to justify.
  NO  ↓

Does it add a new npm dependency?
  YES → Run dependency cost analysis (Step 5). Must pass all criteria.
  NO  ↓

Does it add a new DB table or column?
  YES → Also run postgis-expert and supabase-review skills.
  NO  ↓

Does it add a new API route?
  YES → Also run api-review and security-review skills.
  NO  ↓

Proceed to data flow sketch (Step 3) → Module boundary test (Step 4).
```

---

## Architecture Patterns for This Project

### Pattern: Server-First Data Fetching

Default pattern for all page-level data:

```
page.tsx (Server Component)
  └── fetch from Supabase directly via server client
  └── pass data as props to child components
      └── only leaf components with interactivity use "use client"
```

Do NOT: fetch in client components via `useEffect` on initial render for data that exists at page load time.

Exception: map viewport data must be fetched client-side after user pans/zooms (the map cannot know its viewport until Leaflet initializes in browser).

### Pattern: Voting as an Append-Only Event Log

The `votes` table is append-only. Never update or delete votes. The `upvotes`/`downvotes` counters on `koperasi_points` are a cached derived value — they can be recalculated from the votes table at any time.

If counter drift is suspected, the source of truth is always the votes table. Build recalculation into the casting logic, not as a separate cron job.

### Pattern: Geography as the First-Class Filter

PostGIS is not an afterthought. The `location` column with GIST index is the **primary access pattern** for the main map view. All performance reasoning starts from: "How many points are in this viewport? What's the index selectivity?"

Rule: the `GET /api/points` endpoint must NEVER load more than ~500 points per response. If viewport is too large (e.g., user fully zoomed out), return a count and a message to zoom in, not a data dump.

### Pattern: Status as Explicit State Machine

`koperasi_points.status` is a state machine with exactly 4 states and 5 valid transitions (per SPEC.md §5.2). The transition logic in `src/app/api/points/[id]/vote/route.ts` is the **only place** where status changes happen. No other file may write to the `status` column.

Enforce this via Supabase RLS: only the service role key can UPDATE the `status` column. The API route handler uses the service role key. The anon key cannot.

### Pattern: PII Minimization at Entry

Hash IP and fingerprint at the absolute edge — inside the route handler, before the data even touches a Supabase query. The `hash.ts` utility must be called in exactly two places: `POST /api/points` and `POST /api/points/[id]/vote`. No other module should ever handle raw IP or fingerprint strings.

### Pattern: Bahasa Indonesia as a Single Source

This project is Bahasa Indonesia only. UI strings are hardcoded directly in the components — there is no i18n system, no message files, no locale switching. Write all user-facing text in Indonesian directly in JSX.

---

## Common Architectural Mistakes in This Project

### Mistake 1: "Let's add a simple admin flag to the user..."

There are no users. There is no user table. There is no auth. Whenever you find yourself writing "admin user" or "trusted account," you are violating the project's core design. The governance model is community voting, not privilege escalation.

**Corrective question:** "Can this be solved by adjusting vote thresholds or adding a moderation queue state instead?"

### Mistake 2: "We should cache this in Redis for performance."

The scale target is thousands of points, not millions. Supabase with PostGIS GIST indexes and viewport filtering is sufficient. Redis introduces infra complexity, another service to maintain, and invalidation bugs. Supabase has built-in connection pooling via PgBouncer.

**Corrective question:** "Have we actually measured a performance problem? What does a EXPLAIN ANALYZE on the slow query show?"

### Mistake 3: "This component is getting complex, let's create a context."

React Context is for data that needs to be accessible deep in the tree without prop drilling. The cases where this is genuinely needed in this project: locale preference. That's it.

Vote state, map viewport, pending points list — these all live in the components that own them. Do not create a global state management system for this.

### Mistake 4: "Let's move the vote logic to a Supabase Edge Function."

The vote logic in the API route handler is intentional. It is co-located with the application code, readable by any contributor, testable with Vitest, and deployable to Vercel without a separate Supabase function deployment pipeline.

Edge Functions add deployment complexity and a separate runtime to understand. Do not introduce them unless a genuine latency or access problem exists that cannot be solved in the Next.js route.

### Mistake 5: "Let's normalize the address fields into a separate regions table."

The address fields (`kelurahan`, `kecamatan`, `kabupaten`, `provinsi`) are denormalized text on the `koperasi_points` table. This is intentional. Indonesia's administrative geography changes, spelling conventions vary, and enforcing a foreign key to a region table would require maintaining an authoritative list of all ~500 kabupaten and ~7,000 kecamatan, which this project does not own.

The `GET /api/regions` endpoint derives distinct values from existing data. If a contributor spells "Kab. Bogor" instead of "Bogor," that is a data quality issue handled by the community, not a schema problem.

---

## Anti-Patterns

| Anti-Pattern | Signal | Correct Approach |
|---|---|---|
| Loading all pins on mount | `SELECT * FROM koperasi_points` anywhere | Viewport-bounded `ST_Within` query |
| Storing raw IP/fingerprint | `voter_ip = req.headers['x-forwarded-for']` directly | Hash in `hash.ts` before any variable assignment |
| Status change outside vote route | `UPDATE koperasi_points SET status = ...` in a component or non-vote handler | Only `vote/route.ts` touches status |
| Photo URL without status check | Returning `photo_path` when `status != 'approved'` | Explicit null if not approved |
| Adding a dependency to solve a one-time problem | Installing `lodash` for `_.debounce` | Use native `setTimeout` or inline 5-line debounce |
| New page with hardcoded English text | English UI string in a component | All user-facing strings in Bahasa Indonesia |
| Using Supabase Auth for "something small" | "Let's just use Auth for..." | No. Auth is architecturally excluded. |

---

## Integration with Other Skills

After completing an architectural decision, route work to the relevant specialist skill:

| If the change involves... | Also run... |
|---|---|
| New DB table or column | `postgis-expert` + `supabase-review` |
| New API route | `api-review` + `security-review` |
| New UI component | `nextjs-expert` + `ui-review` |
| Map rendering changes | `leaflet-expert` + `geo-data-review` |
| New npm dependency | `bundle-review` |
| New feature across multiple layers | `feature-planner` first |
| Something touching the spec scope | `product-review` |

---

## Checklist Before Approving an Architectural Decision

```
[ ] soul.md filter: passes at least 2 of 4 questions
[ ] All 9 CLAUDE.md locked rules checked, none violated
[ ] SPEC.md §10 out-of-scope list checked
[ ] Data flow drawn from user action → DB → response
[ ] PII handling: IP + fingerprint hashed at entry, never stored raw
[ ] Photos: never returned for non-approved points
[ ] Status transitions: only valid transitions per SPEC.md §5.2
[ ] No new auth or privileged roles introduced
[ ] No paid services or APIs introduced
[ ] New dependencies: bundle cost justified (< 50kB gzipped)
[ ] Module boundaries: passable by a contributor in 1 day
[ ] Language: all user-facing strings hardcoded in Bahasa Indonesia
[ ] PostGIS queries: viewport-bounded, never full-table-scan
[ ] Server components used by default; "use client" justified
[ ] No new global state management
[ ] Supabase RLS: new tables have appropriate policies
```

---

## Exit Criteria

An architectural decision is complete when:

1. The decision document is written (Decision / Why / What changes / What stays / Risks / Alternatives rejected / Exit criteria).
2. All checklist items above are checked.
3. At least one person (or one AI review pass via `product-review`) has looked at the decision and found no soul.md violations.
4. The implementation scope is small enough for a single PR. If not, break it down — use `feature-planner`.
5. Any follow-on skill work has been explicitly named (e.g., "next step: run `postgis-expert` for the migration").

---

## Example: Evaluating "Add edit functionality for submitted points"

**Proposed:** Contributors should be able to edit their own submitted koperasi point after submission.

**Step 1 — soul.md filter:**
- Makes map more useful? Marginally — bad data can be corrected.
- Keeps it simple? No — "their own" requires identity tracking.
- Respects contributors? Arguably yes.
- Stays open? Neutral.

**Step 2 — Locked rules:**
- Rule 4: "No authentication." Implementing "their own" requires auth or a secret edit token.
- This rule is violated.

**Step 3 — Alternative:**
- Could editing be replaced by a "report as incorrect" vote + new submission workflow?
- Anyone can submit a corrected version. The community votes the old one down (flagged) and the new one up.
- This respects Rule 4, respects Rule 9 (status transitions), and requires no new infrastructure.

**Decision:** Reject edit functionality. Incorrect data is handled by resubmitting with correct data and community voting down the incorrect version. Document this as a FAQ for contributors.

**Outcome:** SPEC.md §10 gets a new entry: "Edit/update submitted points — use re-submission + community flagging workflow."

---

*This skill is governed by soul.md. When in doubt: simpler, more open, more useful to village residents.*
