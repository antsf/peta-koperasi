# Skill: product-review

Review a completed feature or PR against the project's soul, spec, and architectural rules before it is merged.

---

## Purpose

Code review in most projects asks: "Does this work? Is it clean?" Product review for this project asks five harder questions, in order of priority:

1. Does this belong in this project at all?
2. Does it comply with what the spec says?
3. Does it obey the rules we locked for good reasons?
4. Can the next contributor understand it?
5. Will we regret merging this in six months?

This skill is for the review that happens after the code compiles and the tests pass — the review that asks whether the change is right for *this* project, not just technically correct in the abstract.

---

## When to Invoke

- A PR is ready for review and touches more than a single file.
- A feature has been implemented and needs sign-off before merge.
- A contributor submits something that "feels wrong" but you cannot articulate why.
- You want to verify that a completed feature plan (from `feature-planner`) was implemented faithfully.
- Before any release or deployment of new functionality.

## When NOT to Invoke

- The change is a typo fix, a dependency version bump, or a Tailwind class adjustment.
- The change is still in progress (use `feature-planner` or `architect` to guide in-progress work).
- You need to decide whether to build something (use `roadmap-planner`).
- You need to decide how to build something (use `architect`).

---

## The Five Review Lenses

Apply these in order. If a change fails an earlier lens, do not spend time on later lenses — the earlier failure must be resolved first.

### Lens 1: Soul Alignment

Read the diff and ask the four soul.md questions:

1. **Does this make the map more useful for village residents?** Not for developers, not for the project's GitHub stars, not for a demo. For the person in Kabupaten Bogor looking for a koperasi simpan pinjam.
2. **Does this keep the project simple and runnable by anyone?** Could a developer in a rural Indonesian town with a 2 Mbps connection clone this repo and run it? Does this change make that harder?
3. **Does this respect contributors?** If this change affects the submit flow, does it add friction? If it changes the UI, does it introduce complexity that makes future contributions harder?
4. **Does this stay open?** Does this introduce a vendor dependency? Does it require a paid service? Does it lock data into a format only one tool can read?

**Failure at this lens:** The change may be technically excellent but philosophically wrong for this project. This is the hardest feedback to give and the most important.

How to handle it: "This is well-built code. However, it introduces [specific thing] which moves us away from [specific soul.md value]. Here is what I would change to bring it into alignment: [specific suggestion]."

### Lens 2: Spec Compliance

Compare the implementation against SPEC.md:

- Does the API route match the spec's request/response format (§4)?
- Does the data model match the schema (§3)?
- Do status transitions follow §5.2 exactly?
- Is the component listed in §6.2?
- Does the file live where §7 says it should?
- Is the feature in §10's out-of-scope list?

**Common spec compliance failures in this project:**

- Adding a field to the API response that is not in SPEC.md §4 (even if useful).
- Implementing a status transition not in the state diagram.
- Creating a new page route not in §6.1 without running `architect` first.
- Adding a new env var not in §8 without documenting it.

**Failure at this lens:** "The spec says X, but this implements Y. Either the implementation should change to match the spec, or we need to amend the spec first (which requires `architect` review). We do not ship spec-divergent code."

### Lens 3: Architectural Rules

Go through all 9 locked rules in CLAUDE.md. Not just the ones that seem relevant. All nine. Every time.

| Rule | What to check in the diff |
|---|---|
| 1. Vote dedup mandatory | Any vote INSERT must be preceded by a dedup query on `(point_id, hashed_ip, hashed_fingerprint)`. Check that the UNIQUE constraint is relied upon, not just application-level logic. |
| 2. Photos hidden until approved | Search the diff for any code path that returns `photo_url` or `photo_path`. Verify it checks `status === 'approved'` before returning a non-null value. Check both API responses and component rendering. |
| 3. PostGIS viewport queries | Any query against `koperasi_points` for map display must use `ST_Within(location, ST_MakeEnvelope(...))`. If the diff adds a new query path, verify it includes bounds. |
| 4. No authentication | Search for: `auth`, `session`, `login`, `jwt`, `token`, `middleware`, `NextAuth`, `supabase.auth`. Any of these in the diff is a red flag requiring justification. |
| 5. No admin dashboard | Search for: `/admin`, `role`, `isAdmin`, `service_role` used outside of the vote route handler. The service role key should appear only in `src/lib/supabase/server.ts` and be used only by API route handlers that need to update status. |
| 6. IP and fingerprint always hashed | Any code that reads `x-forwarded-for` or `x-fingerprint` must pass the value through `hash.ts` before any other operation. Check that raw values are not logged, stored in variables that persist, or passed to functions other than the hash utility. |
| 7. OSM tiles only | Any map tile URL must be `tile.openstreetmap.org` or an equivalent free OSM provider. No Mapbox, no Google, no paid tile CDN. |
| 8. Indonesia bounds validation | Any code that accepts latitude/longitude must validate: lat between -11.0 and 6.0, lng between 95.0 and 141.0. This must happen at the Zod schema level in the API route, not just in the UI. |
| 9. Status transitions per spec | The only valid transitions are: `pending→approved` (3 up), `pending→flagged` (3 down), `flagged→removed` (6 down), `flagged→approved` (5 up). Any code that writes to the `status` column must be checked against this list. |

**Failure at this lens:** "This PR violates CLAUDE.md rule [N]: [quote the rule]. Specifically, [exact line/file where the violation occurs]. This rule is locked and cannot be waived. Here is how to fix it: [specific fix]."

### Lens 4: Contributor Legibility

Review the code from the perspective of three contributor personas:

- **Serious developer** (wants to add a feature): Can they understand the module boundaries? Can they find where to make their change? Are dependencies between files obvious or hidden?
- **Vibe coder** (wants to fix a typo or add a translation): Can they find the file they need to edit? Is the file structure obvious from the directory listing? Are there surprising conventions?
- **Non-coder** (wants to file an issue or improve docs): Does the PR change any README, SPEC.md, or CLAUDE.md content? Is it accurate?

Specific things to check:

- **File naming:** kebab-case per CLAUDE.md. `MapView.tsx` → reject, should be `map-view.tsx`.
- **Export style:** Named exports, not default (except `page.tsx`).
- **Component size:** If a component exceeds ~150 lines, it probably does too much. Suggest decomposition.
- **Magic numbers:** Vote thresholds (3, 5, 6) should be constants, not literals scattered in code.
- **Comments:** Explain *why*, not *what*. `// Hash IP before storage (CLAUDE.md rule 6)` is good. `// Set x to 5` is noise.
- **Type safety:** No `any` types without a `// TODO: type properly` comment. No type assertions (`as`) that mask real type mismatches.

**Failure at this lens:** "A new contributor reading this file would not understand [specific thing] because [specific reason]. Consider: [specific improvement]."

### Lens 5: Long-Term Maintainability

Ask: "If nobody touches this code for a year and then a contributor needs to modify it, what will go wrong?"

- **Dependencies:** Does this add a new npm package? Run the dependency cost analysis from `architect` Step 5.
- **Coupling:** Does this change create a dependency between two modules that were previously independent? If `map-view.tsx` now imports from `vote-buttons.tsx`, that is coupling that did not exist before. Is it justified?
- **Test coverage:** Does this change include tests? For this project, the required test coverage is: API route handlers (Vitest), Zod schemas, voting state machine logic. Components are tested only for complex stateful behavior.
- **Migration reversibility:** If this adds a DB migration, can it be reversed? What happens to existing data?
- **i18n debt:** Does this add user-facing strings? Are they in both `messages/id.json` and `messages/en.json`? Missing translations are not "we will add them later" — they are a blocker.

**Failure at this lens:** "This will work today but create problems in [specific scenario]. Consider: [specific mitigation]."

---

## Project-Specific Review Checks

These are things unique to Koperasi Desa Merah Putih Map that a generic code review would miss.

### Photo visibility

Every code path that returns or renders a photo must be checked:

```
Does the code access photo_url or photo_path?
  YES → Does it check status === 'approved' before returning/rendering?
    YES → Pass
    NO  → BLOCK. This violates CLAUDE.md rule 2.
```

Why this matters: pending submissions may contain photos of private property, people's faces, or other content that the community has not verified. Showing these publicly before approval is a privacy risk.

### Vote dedup

Every code path that inserts a vote must be checked:

```
Does the code INSERT INTO votes?
  YES → Is there a preceding SELECT or ON CONFLICT check for (point_id, hashed_ip, hashed_fingerprint)?
    YES → Does the dedup check use hashed values (not raw)?
      YES → Pass
      NO  → BLOCK. Raw IP/fingerprint in dedup query.
    NO  → BLOCK. This violates CLAUDE.md rule 1.
```

### PII hashing

Every code path that reads `x-forwarded-for` or `x-fingerprint` headers must be checked:

```
Does the code read IP or fingerprint from headers?
  YES → Is hash.ts called IMMEDIATELY (before any other use of the value)?
    YES → Is the raw value discarded after hashing (not stored in a variable that persists)?
      YES → Pass
      NO  → BLOCK. Raw PII persists in memory longer than necessary.
    NO  → BLOCK. This violates CLAUDE.md rule 6.
```

### Status transitions

Every code path that updates `koperasi_points.status` must be checked:

```
Does the code UPDATE ... SET status = ?
  YES → Is this in src/app/api/points/[id]/vote/route.ts?
    NO  → BLOCK. Status changes outside vote route violate the architecture.
    YES → Does the new status follow one of the 4 valid transitions?
      YES → Are the threshold values correct (3/3/6/5)?
        YES → Pass
        NO  → BLOCK. Threshold mismatch with SPEC.md §5.
      NO  → BLOCK. Invalid status transition.
```

### PostGIS queries

Every code path that queries `koperasi_points` for map display must be checked:

```
Does the query fetch multiple points for rendering on a map?
  YES → Does it use ST_Within with ST_MakeEnvelope?
    YES → Does it have a reasonable LIMIT or the ~500 point cap?
      YES → Pass
      NO  → Flag: may return too many points at low zoom levels.
    NO  → BLOCK. This violates CLAUDE.md rule 3.
```

### i18n completeness

Every code path that renders user-facing text must be checked:

```
Does the component render text visible to users?
  YES → Does the text come from useTranslation() or getTranslation()?
    YES → Is the key present in BOTH messages/id.json AND messages/en.json?
      YES → Pass
      NO  → BLOCK. Missing translation in one language file.
    NO  → Is it cooperative data (name, address) from the database?
      YES → Pass (data is not translated)
      NO  → BLOCK. Hardcoded string.
```

---

## How to Give Feedback That Respects Contributors

This project's soul.md says: "Does this respect contributors? They give their time for free. Honor that."

This applies to code review feedback. A contributor who submitted a PR gave hours of their time to this project. Your review must honor that even when the code needs significant changes.

### Principles

1. **Start with what is good.** Every PR has something done well. Name it specifically. "The Zod schema validation is thorough — you caught the edge case where kabupaten is empty but provinsi is set."

2. **Separate must-fix from nice-to-have.** Use clear labels:
   - **BLOCK:** This must change before merge. Cite the specific rule, spec section, or safety concern.
   - **SUGGEST:** This would improve the code but is not required for merge. The contributor decides.
   - **QUESTION:** I do not understand this choice. Explain the reasoning so I can review it properly.
   - **NIT:** Style preference only. Ignore if you disagree.

3. **Explain why, not just what.** Bad: "Move this to a separate function." Good: "This block handles both validation and database insertion. Separating them would let us test validation independently (which we need per CLAUDE.md testing approach)."

4. **Offer solutions, not just problems.** If you request a change, show what the changed code would look like. Do not make the contributor guess what you want.

5. **Do not pile on.** If you have 15 comments, prioritize the 5 most important. File the rest as follow-up suggestions, not blockers.

6. **Acknowledge the difficulty.** If the contributor tackled a hard problem (PostGIS query optimization, complex state machine logic, mobile responsive layout for the map), say so. Difficulty deserves recognition even when the result needs changes.

7. **Never use the review as a teaching moment about things unrelated to the PR.** If the contributor did not use your preferred pattern elsewhere in the codebase, that is not this PR's problem.

### Tone examples

Bad: "This is wrong. You cannot return photo_url for pending points."

Good: "BLOCK: The photo_url is returned here for pending points, which violates CLAUDE.md rule 2 (photos hidden until approved). This is a privacy safeguard — pending photos may contain unverified content. The fix is to add a status check: `photo_url: point.status === 'approved' ? point.photo_url : null`."

Bad: "Why did you do it this way?"

Good: "QUESTION: I see you are fetching all points and filtering client-side rather than using the PostGIS viewport query. Was there a specific reason for this approach? The viewport query in geo.ts handles this use case and keeps the response size bounded."

---

## When to Approve with Comments vs Request Changes vs Reject

### Approve with comments

The PR is correct, follows all rules, and can be merged. You have suggestions that would improve it but are not required. Use SUGGEST and NIT labels. The contributor can address them in a follow-up PR or not at all.

**Threshold:** Zero BLOCKs. All five lenses pass. Suggestions are genuine improvements, not gatekeeping.

### Request changes

The PR has one or more issues that must be resolved before merge, but the overall direction is correct. The contributor should be able to fix these without re-architecting.

**Threshold:** One or more BLOCKs, but they are specific and fixable. The soul alignment and spec compliance are sound. The issues are implementation-level (missing status check, unhashed PII, missing i18n key).

**How to communicate:** "This is heading in the right direction. I have [N] items that need to change before merge — all are specific and I have included the fix for each. Once these are addressed, I will approve."

### Reject

The PR fundamentally violates soul.md, implements something in SPEC.md §10's out-of-scope list, or introduces an architectural change that was not approved by the `architect` skill. The code cannot be fixed incrementally — it needs to be rethought.

**Threshold:** Fails Lens 1 (soul alignment) or Lens 2 (spec compliance) in a way that cannot be fixed by modifying the existing code.

**How to communicate:** "Thank you for this work. I have to flag a fundamental issue: [specific problem]. This is not something that can be fixed with a code change — it requires rethinking the approach. Here is why: [explanation rooted in soul.md or SPEC.md]. Here is what I would suggest instead: [alternative approach]. I am happy to discuss this further before you invest more time."

**Never:** reject without an alternative. If you cannot suggest what they should do instead, your rejection is not actionable.

---

## Review Checklist

Apply this checklist to every PR. Check every item, not just the ones that seem relevant.

### Soul & Scope (Lens 1-2)

```
[ ] soul.md Q1: Change makes the map more useful for village residents (or enables something that will)
[ ] soul.md Q2: Change does not make the project harder to run or contribute to
[ ] soul.md Q3: Change respects contributors (no unnecessary friction added to submit/vote flows)
[ ] soul.md Q4: Change introduces no vendor lock-in or paid service dependency
[ ] SPEC.md §10: Feature is not in the out-of-scope list
[ ] SPEC.md §2-4: Implementation matches the spec's user stories, data model, and API contracts
[ ] If this adds something not in the spec: architect skill was run first, and the architectural decision is documented
```

### Locked Rules (Lens 3)

```
[ ] Rule 1 — Vote dedup: every vote INSERT has dedup check on (point_id, hashed_ip, hashed_fingerprint)
[ ] Rule 2 — Photos hidden: photo_url/photo_path returns null when status != 'approved' in both API and UI
[ ] Rule 3 — PostGIS viewport: map point queries use ST_Within(location, ST_MakeEnvelope(...))
[ ] Rule 4 — No auth: no login, session, JWT, token, middleware, or auth library introduced
[ ] Rule 5 — No admin: no /admin routes, no privileged roles, no service-role bypass of voting
[ ] Rule 6 — PII hashed: IP and fingerprint are SHA-256 hashed via hash.ts before any storage or comparison
[ ] Rule 7 — OSM tiles: map tiles are from tile.openstreetmap.org or equivalent free provider
[ ] Rule 8 — Indonesia bounds: lat/lng validated at API level (-11 to 6, 95 to 141)
[ ] Rule 9 — Status transitions: only the 4 valid transitions with correct thresholds (3/3/6/5)
```

### Code Quality (Lens 4-5)

```
[ ] TypeScript strict: no untyped `any` without `// TODO: type properly`
[ ] File naming: kebab-case for all files
[ ] Named exports (except page.tsx default)
[ ] Server components by default; `"use client"` only where genuinely needed (Leaflet, event handlers, useState/useEffect)
[ ] No CSS modules or styled-components — Tailwind only
[ ] Zod validation at top of every API route handler
[ ] Supabase queries go through src/lib/supabase/ or src/lib/geo.ts — not inline in components
[ ] No new global state (React Context only for locale, nothing else)
[ ] i18n: all user-facing strings come from messages/ files, present in both id.json and en.json
[ ] No hardcoded Indonesian or English text in components
[ ] No unnecessary npm dependency added (check bundle size impact)
[ ] Tests: API routes tested with valid/invalid/edge-case inputs
[ ] Tests: Zod schemas tested with valid and invalid payloads
[ ] Tests: voting state machine transitions tested (if touched)
[ ] Component does not exceed ~150 lines (suggest decomposition if so)
[ ] No magic numbers for vote thresholds — use named constants
```

---

## Common Mistakes Reviewers Make

### Mistake 1: Being too strict on style while ignoring logic bugs

**Symptom:** Review has 12 comments about variable naming and Tailwind class ordering but misses that the photo URL is returned for pending points.

**Fix:** Always apply Lens 3 (locked rules) before Lens 4 (legibility). A perfectly styled component that leaks pending photos is worse than an ugly component that does not.

### Mistake 2: Not checking i18n

**Symptom:** PR adds a new button with text "Submit" hardcoded in English. Reviewer approves. Indonesian users see English-only UI.

**Fix:** The i18n check is a BLOCK, not a SUGGEST. Every user-facing string must come from the message files. Check both files. Bilingual UI is a core feature, not a nice-to-have.

### Mistake 3: Reviewing only the happy path

**Symptom:** Reviewer verifies that a valid submission works. Does not check: what happens with out-of-bounds coordinates? What happens when the photo is 10MB? What happens when the voter has already voted?

**Fix:** For every API route change, mentally walk through: valid input, invalid input, edge case, and abuse case. The Zod schema should handle invalid input. The route handler should handle edge cases. If either is missing, BLOCK.

### Mistake 4: Applying rules from other projects

**Symptom:** "You should add error boundary components." "You should use React Query for data fetching." "You should add Storybook for component documentation."

**Fix:** Review against THIS project's rules (CLAUDE.md), not best practices from your last project. Error boundaries may be useful, but they are not in the spec. React Query adds a dependency the project does not need (server components handle most data fetching). Storybook adds tooling complexity for a project with 11 components.

### Mistake 5: Not checking the database migration

**Symptom:** PR adds a new column to `koperasi_points` but the reviewer only looks at the TypeScript code. The migration is missing an index, has no DOWN migration, or uses a type that does not match the Zod schema.

**Fix:** If a PR includes a file in `supabase/migrations/`, review it with the same rigor as application code. Check: column type matches TypeScript type, indexes exist for columns used in WHERE clauses, RLS policy is updated if needed, migration is reversible.

### Mistake 6: Approving to be nice

**Symptom:** The contributor is new, enthusiastic, and the code mostly works. Reviewer approves to not discourage them, despite a missing status check on photo display.

**Fix:** Approving broken code is not kind — it is negligent. The contributor will learn more from a respectful "request changes" with specific fixes than from a rubber-stamp approval that lets a bug into production. Respect for contributors means taking their code seriously, not waving it through.

### Mistake 7: Reviewing the PR in isolation

**Symptom:** The PR is perfect in isolation but duplicates logic that already exists in `src/lib/geo.ts`, or introduces a pattern that contradicts how the rest of the codebase works.

**Fix:** Before reviewing the diff, skim the files the PR touches to understand the existing patterns. Check: does this duplicate a utility function? Does it follow the same naming conventions? Does it use the same Supabase client pattern as adjacent routes?

---

## Exit Criteria: What "Approved" Means

A PR is approved for merge when ALL of the following are true:

1. **All five lenses pass.** Soul alignment, spec compliance, architectural rules, contributor legibility, and long-term maintainability.
2. **Zero BLOCK comments remain unresolved.** Every BLOCK has been addressed with a code change, not just a comment reply.
3. **i18n is complete.** Every user-facing string exists in both `messages/id.json` and `messages/en.json`.
4. **Tests exist for new logic.** API routes, Zod schemas, and state machine changes have corresponding test cases that cover valid, invalid, and edge-case inputs.
5. **No locked rule is violated.** All 9 rules in CLAUDE.md have been checked against the diff.
6. **No out-of-scope feature has been introduced.** SPEC.md §10 has been checked.
7. **The deployment checklist is still valid.** If this change modifies the deployment process, SPEC.md §9 is updated.
8. **The reviewer can explain what this PR does in one sentence.** If they cannot, the PR is doing too much and should be split.

"Approved" does not mean "perfect." It means: this code is correct, safe, aligned with the project's soul, compliant with the spec, and will not create problems for the next contributor who touches it. SUGGEST and NIT comments can remain open — they are improvements for the future, not blockers for today.

---

*Review is a gift. The reviewer gives attention. The contributor gives code. Both are volunteering their time for village residents who will never know their names. Treat the exchange accordingly.*
