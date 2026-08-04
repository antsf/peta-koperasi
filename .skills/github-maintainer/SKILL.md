# Skill: github-maintainer

Maintaining the Koperasi Desa Merah Putih Map GitHub repository as a welcoming, well-organized open-source project that reflects the soul.md values of gotong royong, openness, and respect for every contributor.

---

## Purpose

Keep the repository infrastructure — branch strategy, CI, issue templates, PR workflow, release process — running smoothly so that contributors of all skill levels can participate without friction, and maintainers can review work efficiently without burning out.

This skill is about **repository governance**, not code quality. For code review standards, use `typescript-reviewer` or `ui-review`. For architectural decisions, use `architect`.

---

## When to Invoke

- Setting up or auditing the repository's GitHub configuration (branch protection, templates, Actions).
- Reviewing a PR for process compliance (not code quality — that is another skill).
- Deciding whether to merge, request changes, or close a PR.
- Curating "good first issue" labels for new contributors.
- Cutting a release tag and writing release notes.
- Handling a PR that is technically sound but philosophically misaligned with soul.md.
- Cleaning up stale issues or branches.

## When NOT to Invoke

- Reviewing code quality or architecture (use `typescript-reviewer`, `architect`).
- Triaging a new issue (use `issue-triager`).
- Onboarding a new contributor (use `contributor-onboarding`).
- Managing community health or conflict (use `community-manager`).

---

## Repository Setup Checklist

Run through this checklist when setting up the repo or auditing its configuration.

### Branch Protection on `main`

```
Settings > Branches > Branch protection rules > main:
[x] Require a pull request before merging
[x] Require approvals: 1
[x] Dismiss stale pull request approvals when new commits are pushed
[x] Require status checks to pass before merging
    - Required checks: lint, type-check, test
[x] Require branches to be up to date before merging
[x] Do not allow bypassing the above settings
[ ] Do NOT require signed commits (too much friction for new contributors)
[ ] Do NOT restrict who can push — maintainers should be able to merge freely
```

### Issue Templates

Create four issue templates in `.github/ISSUE_TEMPLATE/`:

**1. Bug Report (`bug_report.yml`)**
- Title prefix: `[Bug]`
- Fields: description, steps to reproduce, expected behavior, actual behavior, browser/device, screenshot (optional)
- Note in description: "Jika lebih nyaman menulis dalam Bahasa Indonesia, silakan. / If you prefer writing in Indonesian, please do."

**2. Feature Request (`feature_request.yml`)**
- Title prefix: `[Feature]`
- Fields: description, problem it solves, proposed solution, alternatives considered
- Reminder: "Please check SPEC.md section 10 (Out of Scope) before submitting."

**3. Data Quality Report (`data_quality.yml`)**
- Title prefix: `[Data]`
- Fields: koperasi name, location/region, what is wrong (wrong location, fake entry, duplicate, wrong name), evidence
- This template is designed for non-developers. Language is plain, no jargon.

**4. Translation (`translation.yml`)**
- Title prefix: `[i18n]`
- Fields: language (id/en), which page or component, current text, suggested text
- Include a note: "Translation contributions are highly valued. Thank you!"

### PR Template

Create `.github/pull_request_template.md`:

```markdown
## What does this PR do?

<!-- Describe the change in 1-3 sentences. -->

## Why?

<!-- Link to an issue, or explain the motivation. -->

## What changed?

<!-- List the files/areas changed. -->

## Checklist

- [ ] I have read CONTRIBUTING.md
- [ ] My changes follow the code style in CLAUDE.md
- [ ] I have added/updated i18n strings in both `messages/id.json` and `messages/en.json` (if applicable)
- [ ] I have added tests for logic changes (if applicable)
- [ ] I have tested locally with `npm run dev`
- [ ] This PR has a small, focused scope (one concern per PR)

## Screenshots (if UI change)

<!-- Paste before/after screenshots here. -->
```

### GitHub Actions CI

Create `.github/workflows/ci.yml` with three jobs:

1. **lint**: `npm run lint` (ESLint)
2. **type-check**: `npx tsc --noEmit`
3. **test**: `npm test`

Trigger on: `push` to `main`, `pull_request` to `main`.

Node version: match `.nvmrc` or use 20.x.

### Auto-Label by File Path

Create `.github/labeler.yml` for `actions/labeler`:

| Path pattern | Label |
|---|---|
| `messages/**` | `translation` |
| `src/app/api/**` | `api` |
| `src/components/**` | `ui` |
| `supabase/**` | `database` |
| `docs/**`, `*.md` | `documentation` |
| `src/lib/geo.ts`, `src/lib/map/**` | `map` |
| `.github/**` | `infra` |

---

## Branch Strategy

```
main (deployed to Vercel)
  |
  +-- feature/add-region-filter     (new functionality)
  +-- feature/improve-search-ux     (enhancement)
  +-- fix/vote-dedup-race-condition  (bug fix)
  +-- hotfix/null-island-bypass      (urgent production fix)
  +-- i18n/add-missing-en-strings   (translation work)
  +-- docs/update-contributing       (documentation)
```

### Rules

- **No `develop` branch.** Too complex for this community. `main` is always deployable. Vercel preview deployments handle staging.
- **Feature branches**: `feature/<description>` — for new functionality or significant enhancements.
- **Fix branches**: `fix/<description>` — for bug fixes.
- **Hotfix branches**: `hotfix/<description>` — for urgent production fixes. These get expedited review (same-day merge target).
- **i18n branches**: `i18n/<description>` — for translation additions or corrections.
- **Docs branches**: `docs/<description>` — for documentation improvements.
- **Branch names**: kebab-case, descriptive, no issue numbers in the branch name (link the issue in the PR instead).
- **Delete branches after merge.** Enable "Automatically delete head branches" in repo settings.

---

## PR Review Standards

### What Makes a PR Reviewable

A PR is ready for review when it meets ALL of these criteria:

1. **Small scope**: one logical change per PR. A PR that adds a feature AND refactors an unrelated file is two PRs.
2. **Clear description**: the PR template is filled in, the "what" and "why" are explained.
3. **Tests for logic changes**: if the PR changes API route logic, validation, or voting behavior, it has tests.
4. **i18n strings updated**: if the PR adds user-facing text, both `messages/id.json` and `messages/en.json` are updated.
5. **CI passes**: lint, type-check, and tests all green.
6. **No unrelated changes**: no formatting-only diffs, no dependency bumps mixed with feature code.

### When to Request Changes

Request changes when:

- The PR violates one of the 9 locked architectural rules in CLAUDE.md.
- The PR is out of scope per SPEC.md section 10.
- Tests are missing for logic changes.
- i18n strings are hardcoded instead of using message keys.
- The PR introduces a new dependency without justification.
- The PR stores raw IP or fingerprint data.
- The PR loads all map points without viewport filtering.

### When to Merge with Comments

Merge with comments (approve but leave suggestions) when:

- Minor style issues that do not affect functionality.
- A slightly better variable name could be used.
- A test could cover one more edge case (but the main cases are covered).
- Documentation could be slightly clearer.

Do NOT block a PR for style preferences. If CI passes and the logic is correct, merge and file a follow-up issue for polish.

### When to Merge Immediately

- Translation-only PRs (changes only in `messages/id.json` or `messages/en.json`).
- Typo fixes in documentation.
- README improvements.
- These still require CI to pass, but do not need a deep code review.

---

## Issue Hygiene

### Labels

| Label | Color | Description |
|---|---|---|
| `bug` | `#d73a4a` | Something is broken |
| `enhancement` | `#a2eeef` | New feature or improvement |
| `good first issue` | `#7057ff` | Good for newcomers |
| `translation` | `#0075ca` | i18n string additions or fixes |
| `data-quality` | `#e4e669` | Wrong/fake/duplicate map data |
| `needs-spec` | `#fbca04` | Requires specification before implementation |
| `documentation` | `#0075ca` | Documentation improvements |
| `out-of-scope` | `#cfd3d7` | Outside v1 scope per SPEC.md section 10 |
| `duplicate` | `#cfd3d7` | Duplicate of an existing issue |
| `stale` | `#cfd3d7` | No activity for 60+ days |
| `help wanted` | `#008672` | Extra attention is needed |
| `api` | `#1d76db` | API route changes |
| `ui` | `#1d76db` | UI component changes |
| `map` | `#1d76db` | Map/geo functionality |
| `database` | `#1d76db` | Schema or migration changes |

### When to Close Issues

- **Duplicate**: link to the original issue, explain what the original is tracking, then close. Never close with just "duplicate."
- **Out of scope**: thank the reporter, explain why it is out of scope (reference SPEC.md section 10), suggest an alternative if one exists, then close.
- **Completed**: close when the implementing PR is merged. Link the PR in the closing comment.
- **Stale**: after 60 days of no activity, add `stale` label with a comment. After 14 more days, close with explanation. Reopen if the reporter responds.

### When to Keep Open

- The issue is valid but no one has picked it up yet.
- The issue requires a spec decision before implementation (label: `needs-spec`).
- The issue is a known bug that is not yet fixed.

---

## Release Tagging

### When to Cut a Release

- After merging a significant feature (new page, new API endpoint, major UX change).
- After fixing a critical bug (data loss, security issue, broken core flow).
- After accumulating 5+ minor PRs since the last release.
- Never: after a single typo fix or minor style change.

### Version Scheme

Semantic versioning: `vMAJOR.MINOR.PATCH`

- **MAJOR**: breaking changes to the API or data model (unlikely in v1).
- **MINOR**: new features, new pages, significant enhancements.
- **PATCH**: bug fixes, translation updates, documentation improvements.

### Release Notes Format

```markdown
## v0.3.0 — Region Filter & Search Improvements

### New
- Region filter on the map page — filter by provinsi, kabupaten, kecamatan (#42)
- Search bar now searches by cooperative name (#38)

### Fixed
- Vote button not disabling after voting on mobile Safari (#45)
- Indonesian translation missing for pending page header (#41)

### Improved
- Map loads 40% faster on initial viewport with optimized PostGIS query (#43)

### Contributors
Thank you to @contributor1, @contributor2, and @contributor3 for their contributions to this release!
```

Always list contributors. Always thank them. This is a civic project — recognition matters.

### Process

1. Ensure `main` is stable (CI green, no known critical bugs).
2. Update `CHANGELOG.md` with the release notes.
3. Create a git tag: `git tag -a v0.3.0 -m "v0.3.0 — Region Filter & Search Improvements"`
4. Push the tag: `git push origin v0.3.0`
5. Create a GitHub Release from the tag, paste the release notes.
6. Vercel auto-deploys from `main`, so no separate deployment step.

---

## Protecting the Soul

### How to Handle Philosophically Wrong PRs

A PR can be technically excellent but wrong for this project. Common cases:

| PR proposes... | Why it is wrong | How to respond |
|---|---|---|
| Adding auth/login | Violates rule 4 (no authentication) | Thank contributor, explain the anonymous-first design, link to soul.md |
| Adding an admin panel | Violates rule 5 (no admin dashboard) | Explain community governance model, suggest voting threshold adjustment instead |
| Using Google Maps tiles | Violates rule 7 (OSM only) | Explain the no-paid-services commitment, note that OSM tiles are free forever |
| Adding analytics/tracking | Violates CLAUDE.md "What NOT to Do" | Explain privacy-first approach, no tracking of users |
| Adding cooperative categories | Out of scope per SPEC.md section 10 | Explain that all cooperatives are equal in v1, suggest filing for v2 consideration |
| Adding social features (comments, likes) | Out of scope per SPEC.md section 10 | Explain that the map is a utility, not a social platform |

### How to Say No Kindly

**Template for declining a PR:**

```
Thank you for this PR, @contributor — it's clear you put real work into this, and the code quality is solid.

However, this change is outside the scope of the current version of the project. Specifically, [explain which soul.md value or SPEC.md constraint it conflicts with].

The reason we maintain this constraint is [explain the "why" in terms of the civic mission — e.g., "keeping the project simple enough that any village tech volunteer can maintain it"].

If you're interested in contributing in another way, here are some open issues that could use help: [link to 2-3 good first issues].

Thank you for your interest in the project. We hope to see you contribute again!
```

**What to NEVER say:**

- "This is out of scope." (without explaining why)
- "Read the spec." (without linking to the specific section)
- "We don't need this." (dismissive)
- "This is too complex." (without explaining for whom and why simplicity matters)

---

## Good First Issue Curation

### What Makes a Genuinely Good First Issue

A good first issue for this project must be:

1. **Completable in under 2 hours** by someone unfamiliar with the codebase.
2. **Self-contained**: does not require understanding the voting system, PostGIS, or Supabase internals.
3. **Has a clear definition of done**: the contributor knows exactly when they are finished.
4. **Low risk**: cannot break core functionality if done incorrectly.

### Examples of Good First Issues

| Issue | Why it is good | Files involved |
|---|---|---|
| Add missing Indonesian translation for [specific key] | Single file edit, clear before/after | `messages/id.json` |
| Add missing English translation for [specific key] | Single file edit, clear before/after | `messages/en.json` |
| Fix typo in README | No code knowledge needed | `README.md` |
| Add alt text to map marker images | Accessibility improvement, clear scope | Component files |
| Update CONTRIBUTING.md with [specific section] | Documentation, no code | `CONTRIBUTING.md` |
| Add aria-label to vote buttons | Accessibility, small scope | Vote component |
| Fix label text alignment on mobile | CSS-only change, visual verification | Component + Tailwind |

### What is NOT a Good First Issue

- "Add region filter feature" (too large, touches multiple layers)
- "Improve map performance" (vague, requires deep knowledge)
- "Fix the voting bug" (requires understanding the state machine)
- "Set up CI/CD" (infrastructure, not beginner-friendly)

### Curation Process

1. When creating a good first issue, write the issue body as a mini-tutorial: explain what the file does, where to find it, what to change, and how to verify the change works.
2. Include the exact file path(s) involved.
3. If possible, include a code snippet showing the area to modify.
4. Add both `good first issue` and the relevant domain label (`translation`, `documentation`, `ui`, etc.).

---

## PR Review Checklist

Run through this checklist for every PR before approving:

```
## Process
[ ] PR description is filled in (what, why, what changed)
[ ] PR has a small, focused scope (one concern)
[ ] CI passes (lint, type-check, test)
[ ] Branch is up to date with main

## Architectural Compliance
[ ] No violations of the 9 locked rules in CLAUDE.md
[ ] Not out of scope per SPEC.md section 10
[ ] No new dependencies without justification
[ ] No raw IP or fingerprint storage
[ ] No hardcoded user-facing strings (i18n keys used)

## Code Quality
[ ] TypeScript strict mode — no `any` without TODO comment
[ ] Server components by default, `"use client"` justified
[ ] Zod validation at API route entry points
[ ] Supabase queries go through helper functions, not inline

## For UI Changes
[ ] Responsive on mobile and desktop
[ ] Both languages tested (id and en)
[ ] Accessibility basics (alt text, aria labels, keyboard navigation)

## For API Changes
[ ] Tests cover valid input, invalid input, and edge cases
[ ] Viewport-bounded PostGIS queries (no full table scans)
[ ] PII hashed before storage

## For Translation Changes
[ ] Both id.json and en.json updated
[ ] Keys are nested correctly under the right component namespace
[ ] No orphaned keys (keys that exist in one file but not the other)
```

---

## Exit Criteria

The github-maintainer task is complete when:

1. All repository setup checklist items are configured and verified.
2. Branch protection rules are active on `main`.
3. Issue templates exist for all four types (bug, feature, data quality, translation).
4. PR template exists and is auto-populated on new PRs.
5. CI workflow runs on all PRs and blocks merge on failure.
6. Auto-labeler is configured and labeling PRs correctly.
7. Labels are created with correct names, colors, and descriptions.
8. At least 3 issues are labeled `good first issue` with tutorial-style descriptions.
9. CHANGELOG.md exists and is up to date with the current release.
10. The PR review checklist is documented and accessible to all reviewers.

---

*This skill is governed by soul.md. The repository is a public space — keep it welcoming, keep it organized, keep it honest about what the project is and is not.*
