# Skill: roadmap-planner

Plan the sequenced evolution of Koperasi Desa Merah Putih Map from MVP toward long-term civic impact — without scope creep, feature bloat, or loss of the project's soul.

---

## Purpose

The MVP is a map that works. What comes next determines whether this project becomes a living civic tool used by thousands of village residents or an abandoned GitHub repo with 12 stars. This skill exists to make that determination deliberately — not reactively, not by chasing trends, not by over-engineering.

Roadmap planning in civic tech without a product team, without revenue, and without auth is fundamentally different from commercial product planning. There is no conversion funnel to optimize. There is no quarterly target. The only metric that matters is: are village residents finding cooperatives they did not know existed?

---

## When to Invoke

- After MVP launch, to decide what v1.5 looks like.
- When a contributor proposes a significant new feature and you need to decide whether it belongs now, later, or never.
- When the issue tracker has accumulated 15+ feature requests and you need to prioritize.
- When someone says "we should add X because [other project] has it."
- When you feel the project losing focus but cannot articulate why.
- At any major milestone to re-evaluate the horizon.

## When NOT to Invoke

- For implementation planning of an already-decided feature (use `feature-planner`).
- For architectural decisions about how to build something (use `architect`).
- For reviewing completed work (use `product-review`).
- For a single bug fix or translation improvement.

---

## The Civic Tech Roadmap Principle

### Adoption before features

In commercial software, you build features to attract users. In civic tech, you attract contributors to validate features. The order is inverted.

A civic-tech roadmap after MVP must answer these questions in this order:

1. **Is anyone using what we already built?** If not, more features will not fix that. The next work item is outreach, documentation, or removing friction — not a new page.
2. **Are contributors submitting real data?** If not, the submit flow has UX problems or the project has a trust problem. Fix that before adding capabilities.
3. **Is the community voting?** If not, the verification mechanism is broken. A map full of unverified pins is worse than a map with fewer verified ones.
4. **What do the people who actually use it say is missing?** Not what developers think is missing. Not what looks cool. What do the village residents, the NGO workers, the students — the users named in `soul.md` — actually need?

Only after questions 1-3 are answered "yes" does question 4 produce useful roadmap items.

### The difference between "community asks for X" and "X serves the mission"

A contributor opens an issue: "Add cooperative categories (simpan pinjam, pertanian, perikanan, etc.)." Twenty people upvote it.

The community asked for it. But does it serve the mission?

Run it through soul.md:
- Does this make the map more useful for village residents? Maybe — but a resident looking for the nearest koperasi probably does not filter by type. They want proximity.
- Does it keep the project simple? No — it introduces a taxonomy that Indonesia's cooperative movement does not standardize. Who decides the categories? Who maintains them?
- Does it respect contributors? Adding a required "type" field to the submit form adds friction for contributors who may not know the cooperative's official classification.
- Does it stay open? It is neutral on this axis.

Result: this is SPEC.md §10 out-of-scope for v1, and the community request does not change that analysis. Popularity of a request is not evidence of mission alignment.

**How to communicate this:** "We hear you. Categories would be useful someday. Right now, adding them would require solving the taxonomy problem — which categories? who maintains them? — and would add friction to the submit form. We are focusing on getting more verified pins on the map first. When we have 5,000+ approved points, category filtering becomes worth the complexity. Until then, geographic search (which we already have) serves the same 'find what is near me' need."

This is how you say no to a good idea without disrespecting the person who proposed it.

---

## The Horizon Model: Now / Next / Later

Every potential roadmap item lives in exactly one of three horizons. Items move between horizons only through deliberate re-evaluation, not by default advancement.

### Now (current cycle, 1-3 months)

Items that directly address one of:
- A broken or incomplete part of the MVP spec
- A friction point blocking adoption (people try to use the tool and fail)
- A data quality problem threatening the map's usefulness
- Infrastructure that is currently blocking a visible improvement

**Constraint:** Maximum 3 items in Now at any time. If you cannot pick 3, your prioritization is not sharp enough.

**Examples for this project's post-MVP Now:**
- Fix submit form mobile UX if user testing reveals drop-offs
- Add a "share this point" link so approved cooperatives can be shared on WhatsApp (adoption driver)
- Improve viewport query performance if map feels slow with 1,000+ pins

### Next (after Now is done, 3-6 months)

Items that:
- Depend on Now items being complete
- Are validated by user behavior from Now-phase adoption
- Have a clear implementation path (no open architectural questions)
- Could be worked on by a new contributor with guidance

**Constraint:** Maximum 5 items. Items in Next must have a written `feature-planner` output before they move to Now.

**Examples:**
- Bulk data import tool for NGOs who have existing cooperative lists in spreadsheets
- Improved region filter with kecamatan-level granularity
- Embed widget so other websites can show the map on their page

### Later (6+ months, only if the project is healthy)

Items that:
- Require significant infrastructure or architectural work
- Are speculative (we think users want this but have no evidence)
- Would increase maintenance burden substantially
- Become relevant only at scale (10,000+ points, hundreds of contributors)

**Constraint:** Unbounded list, but every item must have a one-sentence justification for why it is not Never.

**Examples:**
- Data export API for researchers (requires rate limiting, API key management, documentation)
- Mobile-optimized PWA experience
- Integration with government cooperative registry data (requires partnership, legal review)
- Multilingual support beyond ID/EN (only if significant non-Indonesian contributor community emerges)

### Never (for this project)

Items that violate `soul.md`, `CLAUDE.md`'s locked rules, or `SPEC.md §10`. These do not graduate to Later. They are rejected with a documented reason.

The Never list is a feature, not a failure. Every item on it protects the project's focus.

**Permanent residents of Never:**
- Admin dashboard (CLAUDE.md rule 5)
- User authentication/login (CLAUDE.md rule 4)
- Edit/delete by submitter (requires auth, SPEC.md §10)
- Comments or discussion threads (SPEC.md §10)
- Paid map tiles (CLAUDE.md rule 7)
- Analytics/tracking (SPEC.md §10)
- Cooperative categories/types in v1 (SPEC.md §10 — may graduate to Later only if taxonomy problem is solved)
- Notification system (SPEC.md §10)
- Reverse geocoding API (SPEC.md §10)
- Gamification, leaderboards, contributor profiles (requires identity — rule 4)

---

## Evaluating a Proposed Roadmap Item

For every item proposed by a contributor, issue, or internal discussion:

### Step 1 — Never-list check

Is this item on the Never list? Check SPEC.md §10 and CLAUDE.md locked rules explicitly. If yes, respond with the specific rule and a respectful explanation. Do not hedge. Do not say "maybe someday."

### Step 2 — Soul filter

Run the four soul.md questions. An item must pass at least 2 of 4 to proceed. Document which ones it passes and which it fails.

### Step 3 — Evidence check

What evidence exists that this item is needed?

| Evidence Type | Strength |
|---|---|
| A village resident or NGO worker reported this need | Strong |
| Multiple independent contributors filed the same issue | Strong |
| User testing revealed this friction point | Strong |
| A developer thinks it would be cool | Weak |
| Another civic-tech project does it | Irrelevant unless their context matches ours |
| It is technically elegant | Irrelevant |
| It would look good in a demo | Irrelevant |

If the only evidence is developer enthusiasm, the item goes to Later at best. It does not enter Now or Next without user evidence.

### Step 4 — Dependency check

Does this item depend on something that does not exist yet?

- Needs a new DB table → run `architect` first, then `feature-planner`
- Needs a new npm dependency → run `architect` Step 5 (dependency cost analysis)
- Needs a new API route → check if it conflicts with existing routes
- Needs changes to voting logic → requires architect sign-off (touches locked rules)
- Needs changes to status transitions → requires architect sign-off + SPEC.md amendment
- Needs infrastructure (Redis, queue, cron) → almost certainly Later, not Now

### Step 5 — Horizon assignment

Based on Steps 1-4:

```
Failed Never-list check → Never
Passed soul filter + strong evidence + no dependencies → Now (if space)
Passed soul filter + strong evidence + has dependencies → Next
Passed soul filter + weak evidence → Later
Failed soul filter but has strong evidence → Later (re-evaluate when evidence grows)
```

### Step 6 — Write the roadmap entry

Format:

```
## [Item Name]
Horizon: Now / Next / Later
Soul filter: passes Q1 (useful to residents), fails Q3 (adds contributor friction)
Evidence: [source]
Dependencies: [list or "none"]
Architect sign-off needed: yes/no
One-line description: [what it does for the user]
Why this horizon: [1-2 sentences]
```

---

## Sequencing Infrastructure vs Visible Features

Infrastructure work (performance optimization, database indexing, code refactoring, CI pipeline) is invisible to users. It is essential but it does not drive adoption.

### The rule: infrastructure follows user pain, not developer aesthetics

Do NOT:
- Refactor the codebase because the code "feels messy" before anyone is using it
- Add a CI/CD pipeline before you have contributors who need it
- Optimize PostGIS queries before you have enough points to reveal performance issues
- Add monitoring before you have traffic to monitor

DO:
- Fix the slow query that users reported
- Add CI when PRs start coming in and manual testing is not scaling
- Refactor the module that three contributors independently said confused them
- Add error tracking when you see users hitting errors in production

### The 70/30 rule for this project

In any given Now cycle, at most 30% of items should be infrastructure. At least 70% should produce a user-visible change. If infrastructure dominates, the project looks abandoned to outsiders even though work is happening.

Exception: immediately after MVP launch, one infrastructure-heavy cycle is acceptable to stabilize things that broke under real usage. But only one.

---

## Planning Without a Product Team

This project has no PM, no designer, no QA team. It has contributors who show up when they feel like it and a soul.md that provides values-based guardrails.

### How decisions get made

1. **soul.md is the product manager.** Every prioritization dispute is resolved by re-reading the four decision questions. They are not abstract — apply them literally to the item in question.

2. **The spec is the designer.** SPEC.md defines what exists. Changes to the spec require the same rigor as changes to production code. Do not casually add a bullet point to §2 user stories. New user stories require soul.md alignment, architect review, and feature-planner decomposition.

3. **Contributors are the QA team.** The deployment checklist in SPEC.md §9 is the test plan. If a contributor cannot verify their own work using that checklist, the checklist needs improvement — not more process.

4. **GitHub Issues are the backlog.** The roadmap horizon model maps directly to issue labels: `now`, `next`, `later`, `never` (or `wontfix`). Every issue gets triaged into a horizon. Untriaged issues are noise.

### How to handle disagreement

When two contributors disagree on priority:

1. Both write a one-paragraph case for their position.
2. Apply the soul.md filter to both.
3. Apply the evidence check to both.
4. The item with stronger soul.md alignment and stronger evidence wins.
5. If tied, the simpler item wins. Simplicity is a tiebreaker in this project, always.

---

## How to Say No to Good Ideas

This is the hardest part of roadmap planning in community-driven projects. Good ideas are abundant. Focus is scarce.

### Framework for saying no

1. **Acknowledge the idea's merit.** "This would genuinely help users who [specific use case]."
2. **Explain the cost.** "Implementing this requires [specific technical work] and maintaining [specific ongoing burden]."
3. **Name what it displaces.** "If we do this now, we delay [specific Now-horizon item] which [specific user impact]."
4. **Offer the horizon.** "We are putting this in [Next/Later] because [specific reason]. When [specific condition] is met, we will re-evaluate."
5. **Thank the contributor.** They spent time thinking about this project. That matters.

### What NOT to do

- Do not say "great idea, we will add it to the backlog" if you mean Never. That is disrespectful because it wastes their anticipation.
- Do not say "this is out of scope" without explaining which scope boundary and why it exists.
- Do not ignore the issue. A rejected issue with a thoughtful response is better than an open issue with no response for months.

---

## When a Roadmap Item Needs Architect Sign-Off

Some items cannot enter Now without running the `architect` skill first. These are:

1. **Anything that touches a locked rule.** Even if the item complies with the rule, the architect must confirm compliance before implementation begins.
2. **Any new database table or column.** Schema changes are expensive to reverse. The architect evaluates data model implications.
3. **Any new API route.** The architect checks for conflicts with existing routes and ensures the route follows established patterns.
4. **Any item that introduces a new npm dependency.** The architect runs dependency cost analysis.
5. **Any item that changes the voting or status transition logic.** These are the project's governance mechanism. Changing them is equivalent to changing the project's constitution.
6. **Any item that changes how PII (IP, fingerprint) is handled.** Privacy decisions are architectural.
7. **Any item estimated at L-size by `feature-planner`.** If it is too large for a single PR, the architect must validate the decomposition.

Items that do NOT need architect sign-off:
- New i18n strings
- Tailwind styling changes
- Bug fixes within existing modules
- Documentation improvements
- Test additions for existing code

---

## Anti-Patterns in Roadmap Planning

### Anti-Pattern 1: Roadmap driven by tech trends

**Signal:** "We should rewrite the map in [new framework] because it is faster/more modern/trending."

**Problem:** The current stack (Next.js, Supabase, Leaflet) works. Rewriting does not add a single cooperative to the map. It only satisfies developer preferences while creating months of integration work and invalidating all existing contributor knowledge of the codebase.

**Response:** "What user problem does this solve that the current stack cannot? If the answer is 'none, but the DX would be better,' it is not a roadmap item."

### Anti-Pattern 2: Roadmap driven by one vocal contributor

**Signal:** One person files 10 issues in a week, all for features they personally want. They are articulate and persistent. The roadmap starts bending toward their vision.

**Problem:** One contributor's priorities are not the community's priorities. Their enthusiasm is valuable, but their direction may not align with soul.md.

**Response:** Apply the same evaluation framework to their proposals as to anyone else's. Do not fast-track because someone is loud. Do not suppress because they are annoying. Evaluate on merit: soul filter, evidence check, dependency check, horizon assignment.

### Anti-Pattern 3: Roadmap driven by "competitors"

**Signal:** "Google Maps added cooperative data for [country]. We need to add [feature] to compete."

**Problem:** This project does not compete with Google Maps. It exists because Google Maps does NOT have this data for Indonesian village cooperatives. The moment Google solves this problem, this project has succeeded, not failed — the mission was visibility, not market share.

**Response:** "Our roadmap serves our users' needs, not a competitive position. If another project solves the same problem differently, we learn from them — but we do not chase their feature list."

### Anti-Pattern 4: Roadmap as a promise

**Signal:** A README or blog post lists features "coming soon" that have not been evaluated, planned, or staffed.

**Problem:** Public roadmaps in volunteer projects create expectations that cannot be met. Contributors feel obligated, not inspired. Users feel misled when features do not arrive.

**Response:** Public roadmaps should show only Now items. Next and Later are internal planning tools, not marketing material.

### Anti-Pattern 5: Shipping infrastructure as progress

**Signal:** Three consecutive cycles of "we refactored the API layer," "we added CI/CD," "we migrated to a new hosting provider." No user-visible change for months.

**Problem:** The project is technically healthier but functionally identical. Users see a stale product. Contributors see no impact from their work. Momentum dies.

**Response:** Apply the 70/30 rule. Every cycle must include something a village resident would notice.

### Anti-Pattern 6: Refusing to cut scope after launch

**Signal:** The original spec listed 10 features. Nine shipped. The tenth is proving much harder than expected. The team keeps working on it instead of shipping what works.

**Problem:** The 90% that works is being held hostage by the 10% that does not. Users cannot access the value that already exists.

**Response:** Ship what works. Move the incomplete item to Next with a note about what made it hard. Real usage data from the shipped features will inform whether the tenth feature is even needed.

---

## Roadmap Review Cadence

For a community-driven project without a product team:

- **Monthly:** Review the Now horizon. Are items progressing? Do any need to be cut or deferred? Should anything from Next graduate to Now?
- **Quarterly:** Review all three horizons. Has user evidence changed any priorities? Have new locked rules or spec amendments changed what is possible?
- **After each milestone:** (e.g., 1,000 approved points, first external contributor, first NGO partnership) Re-evaluate the entire horizon model. Milestones change what is feasible and what matters.

---

## Checklist Before Approving a Roadmap Decision

```
[ ] Never-list checked: item is not on it
[ ] soul.md filter: passes at least 2 of 4 questions
[ ] Evidence exists beyond "a developer thinks it would be cool"
[ ] Dependencies identified and evaluated
[ ] Architect sign-off obtained if required (per the 7 criteria above)
[ ] Horizon assigned with written justification
[ ] If Now: displaces nothing currently in progress, or displacement is justified
[ ] If Now: feature-planner output exists or is trivially small
[ ] If Next: clear condition for when it graduates to Now
[ ] If Later: clear reason it is not Never
[ ] Communication plan: how the contributor or community will be informed of the decision
[ ] No anti-patterns present (tech trends, one vocal contributor, competition, promises)
```

---

## Exit Criteria

A roadmap planning session is complete when:

1. Every proposed item has a horizon assignment (Now / Next / Later / Never) with a written justification.
2. The Now horizon has at most 3 items, each with a clear owner or "unassigned" label.
3. The Next horizon has at most 5 items, each with a one-paragraph description of what moves it to Now.
4. The Later horizon has items with one-sentence justifications for why they are not Never.
5. The Never list has been reviewed and re-confirmed — no items accidentally omitted.
6. Items requiring architect sign-off are flagged and the sign-off status is documented.
7. The 70/30 infrastructure-to-visible-feature ratio is maintained in the Now horizon.
8. The roadmap is short enough to be read in under 15 minutes. If not, too many items are in Now/Next.
9. At least one Now item directly addresses adoption (getting more real users or real data), not just capability.

---

*A roadmap is not a feature list. It is a sequence of bets about what matters most to the people this project serves. Every item on it should be traceable to a village resident, a student, an NGO worker, or a local government official who will be better off because of it. If you cannot name who benefits, the item does not belong.*
