# Skill: changelog-writer

Write meaningful changelogs for an open-source civic-tech project.

---

## Purpose

Maintain a changelog that communicates project progress to three distinct audiences simultaneously: developers (what changed technically), community contributors (what they can now do), and non-technical stakeholders like local government officials and NGOs (what impact this has). A changelog is the project's public record of progress — it must be honest, clear, and useful.

This project follows the [Keep a Changelog](https://keepachangelog.com/) format.

---

## When to Invoke

- A new version is being tagged or released.
- A batch of changes has accumulated in the `Unreleased` section and needs to be organized.
- A PR has been merged that adds a user-visible feature, fixes a bug, changes the API, changes the data model, or adds new user-facing copy.
- A dependency update has user-visible impact (e.g., Leaflet upgrade changes map behavior).

## When NOT to Invoke

- Internal refactors with no user-visible impact (do not log "refactored geo.ts for readability").
- Test additions or fixes (tests are internal quality, not user-facing).
- Documentation-only changes (docs changes are visible but do not go in the changelog — they go in the commit history).
- Dependency minor/patch version bumps with no behavior change.
- Changes to `CLAUDE.md`, `soul.md`, or dev tooling config.

---

## Inputs

Before writing a changelog entry, gather:

1. **What changed?** Read the PR description, commit messages, and diff.
2. **Who is affected?** Developers, community contributors, non-technical stakeholders, or all three?
3. **What is the user-visible impact?** Not what code changed, but what the user now experiences differently.
4. **Is this a breaking change?** Does it change API response shapes, remove a feature, or alter existing behavior?
5. **Version context:** Is this going into `Unreleased`, or is a version being tagged?

---

## Outputs

Entries in `CHANGELOG.md` at the project root, following Keep a Changelog format.

---

## Changelog Format

### File structure

```markdown
# Changelog

All notable changes to the Koperasi Desa Merah Putih Map will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...

## [0.2.0] - 2026-07-15

### Added
- ...

## [0.1.0] - 2026-06-01

### Added
- ...
```

### Section definitions

| Section | Use for | Example |
|---------|---------|---------|
| Added | New features, new endpoints, new UI elements, new user-facing copy | "Region filter: filter map pins by province and kabupaten" |
| Changed | Modifications to existing features, API response shape changes, behavior changes | "Vote buttons now disable immediately after voting (was delayed)" |
| Fixed | Bug fixes | "Fixed: pins outside Indonesia bounds were accepted by the form" |
| Removed | Features or endpoints removed | "Removed: legacy /api/v0/points endpoint" |

Do NOT use: `Deprecated`, `Security` (unless there is a genuine security fix). Keep the sections to the four above for simplicity.

---

## Writing Changelog Entries

### The civic-tech framing rule

Every entry must be written in terms of **impact on users and the community**, not just technical changes. The reader should understand what they can now do, not what the developer did.

**Wrong (technical-only):**
```
- Added Leaflet.markercluster dependency
```

**Right (impact-first):**
```
- Koperasi pins now cluster at national zoom level, making the map readable when zoomed out
  *Pin koperasi sekarang dikelompokkan saat zoom nasional agar peta lebih mudah dibaca*
```

**Wrong (technical-only):**
```
- Changed POST /api/points to accept multipart/form-data
```

**Right (impact-first):**
```
- Photos can now be uploaded when submitting a new koperasi point
  *Foto sekarang bisa diunggah saat menambahkan titik koperasi baru*
```

### The bilingual rule

Each entry gets an Indonesian summary on the line immediately below, in italics. The Indonesian line can be shorter — it is a summary, not a full translation. It serves community stakeholders who may not read English.

Format:
```markdown
- Region filter: filter map pins by province and kabupaten
  *Filter wilayah: saring titik koperasi berdasarkan provinsi dan kabupaten*
```

The English line is the primary entry (developers). The Indonesian line is the community summary.

### Entry writing guidelines

1. **Start with a noun or feature name**, not a verb. "Region filter: ..." not "Added region filter: ..." (the section heading already says "Added").

2. **One entry per user-visible change.** If a PR touches 5 files but produces one visible change, that is one entry. If a PR adds two independent features, that is two entries.

3. **Include the scope.** If the change is API-only, say so: "API: GET /api/points now accepts `provinsi` filter parameter." If it is UI-only, say so: "Map: zoom controls moved to bottom-right corner."

4. **Breaking changes get a prefix.** Use `**BREAKING:**` at the start of the entry:
   ```
   - **BREAKING:** API: GET /api/points response now includes `status` field (was omitted)
     *API: respons GET /api/points sekarang menyertakan field `status`*
   ```

5. **Keep entries to one or two lines.** If you need more, the change is either too big for one entry or you are over-explaining.

---

## What Goes in the Changelog

### YES — log these:

- New features visible to users (new page, new UI element, new map behavior)
- New API endpoints or changes to existing endpoint behavior
- Bug fixes that affected users (broken form, incorrect vote count, map not loading)
- Data model changes (new column, changed constraint) — framed as impact, not schema
- New user-facing copy that changes what users read in the app
- Significant dependency updates with user-visible impact (Leaflet major version, Next.js major version)
- Performance improvements users can feel (map loads faster, search responds quicker)

### NO — do not log these:

- Internal refactors (renamed a variable, split a function, moved a file)
- Test additions or modifications
- Documentation-only changes (README update, CONTRIBUTING update, CLAUDE.md update)
- Dependency minor/patch bumps with no behavior change (`npm audit fix`, Tailwind 3.4.1 to 3.4.2)
- CI/CD pipeline changes
- Linter config changes
- Code comment additions
- `.gitignore` changes

### Edge cases:

- **Indonesian copy improvements for existing features:** Do not log. The feature was already logged when it shipped. Rewording an existing string is maintenance.
- **Indonesian copy additions for NEW features:** Log as part of the feature entry, not separately.
- **Major dependency upgrade with no user-visible change:** Do not log. If Next.js 15 ships and everything looks the same to users, it is an internal change.
- **Major dependency upgrade WITH visible change:** Log the visible change, not the upgrade. "Map tiles now load progressively (Leaflet 1.10 upgrade)" not "Upgraded Leaflet from 1.9 to 1.10."

---

## Version Milestones

This project uses semantic versioning. The planned milestones are:

| Version | Milestone | What it means |
|---------|-----------|---------------|
| 0.1.0 | MVP deploy | Map loads, points display, submission form works, voting works, basic region filter |
| 0.2.0 | Region filter + stats | Province/kabupaten filter, statistics page, improved clustering |
| 0.3.0 | Data quality | Flagging workflow, community moderation, data quality reporting |
| 0.x.x | Pre-1.0 releases | Features accumulating toward stability |
| 1.0.0 | First stable release | All SPEC.md MVP features complete, API surface stable, data export considered |

**Version tagging rules:**

- Increment PATCH (0.1.x) for bug fixes only.
- Increment MINOR (0.x.0) for new features.
- MAJOR is reserved for 1.0.0 (first stable) and beyond.
- Pre-1.0, breaking changes can happen in MINOR versions — document them clearly.

---

## Thinking Process

### Step 1 — Gather the changes

Read the git log since the last version tag (or the last `Unreleased` review). For each commit or merged PR, ask: "Did this change anything a user, contributor, or stakeholder would notice?"

### Step 2 — Categorize

Sort changes into Added / Changed / Fixed / Removed. If a change does not fit any of these, it probably should not be in the changelog.

### Step 3 — Write the impact-first English entry

For each change, write the entry from the user's perspective. What can they now do? What is different? What was broken and is now fixed?

### Step 4 — Write the Indonesian summary

Write a natural Indonesian summary. Not a word-for-word translation — a shorter summary that conveys the same impact. Use language a village resident or local government staff member would understand.

### Step 5 — Check for breaking changes

Any change to API response shape, removed feature, or altered behavior gets the `**BREAKING:**` prefix.

### Step 6 — Order entries by significance

Within each section (Added, Changed, etc.), order entries from most impactful to least. The most important changes should be at the top.

### Step 7 — Run the checklist

See below.

---

## Common Changelog Mistakes

### Mistake 1: Git log as changelog

Symptom: The changelog reads like `git log --oneline`. Every commit is an entry. "fix typo in readme" sits next to "implement voting system."

Fix: A changelog is curated. Not every commit is notable. Filter ruthlessly: if a user would not care, it does not go in.

### Mistake 2: Developer-only language

Symptom: "Refactored the PostGIS query in geo.ts to use ST_DWithin instead of ST_Distance for viewport queries."

Fix: "Map now loads pins faster when panning to a new area." The user does not care about the function name. They care that the map is faster.

### Mistake 3: Hype without accuracy

Symptom: "Revolutionary new voting system overhaul!" when the actual change was adjusting the upvote threshold from 3 to 5.

Fix: State facts. "Koperasi points now need 5 community upvotes to be verified (was 3)." Let the reader assess significance.

### Mistake 4: Missing Indonesian summaries

Symptom: English-only changelog. Community stakeholders (local government, NGO partners) who read Indonesian are excluded from understanding project progress.

Fix: Every entry gets an Italian summary line. It is one extra line per entry — low effort, high inclusion.

### Mistake 5: Logging every dependency bump

Symptom: Half the changelog is "Updated next from 14.1.0 to 14.1.1" and "Updated tailwindcss from 3.4.1 to 3.4.2."

Fix: Only log dependency changes with user-visible impact. "Map loads 2x faster on mobile (Leaflet performance update)" is worth logging. "Updated leaflet from 1.9.3 to 1.9.4" is not.

---

## Example Changelog Entries

### Good entries:

```markdown
## [Unreleased]

### Added
- Region filter: filter map pins by selecting province and kabupaten from dropdown menus
  *Filter wilayah: saring titik koperasi berdasarkan provinsi dan kabupaten*
- Statistics page showing total koperasi count, verified count, and votes cast
  *Halaman statistik menampilkan jumlah total koperasi, jumlah terverifikasi, dan suara yang diberikan*
- Clearer Indonesian wording for voting status messages
  *Wording Bahasa Indonesia yang lebih jelas untuk pesan status pemungutan suara*

### Changed
- **BREAKING:** API: GET /api/points response now includes `status` field in each point object
  *API: respons titik koperasi sekarang menyertakan field `status`*
- Map pins now cluster when zoomed out to national level, improving readability
  *Pin peta sekarang dikelompokkan saat zoom ke level nasional*

### Fixed
- Vote buttons now correctly disable after casting a vote (previously stayed active until page refresh)
  *Tombol suara sekarang langsung nonaktif setelah memberikan suara*
- Fixed: koperasi points near the Indonesia-Malaysia border were sometimes rejected by bounds validation
  *Diperbaiki: titik koperasi dekat perbatasan Indonesia-Malaysia terkadang ditolak oleh validasi batas wilayah*
```

### Bad entries (do not write these):

```markdown
- Added Leaflet.markercluster to package.json  ← technical, no user impact framing
- Updated README  ← documentation change, does not belong in changelog
- Refactored validation.ts  ← internal refactor
- Fixed lint errors  ← internal quality
- Bumped next from 14.1.0 to 14.1.1  ← no user-visible change
- Added awesome new super fast search!!!  ← hype, inaccurate, unprofessional
```

---

## Checklist

```
[ ] Every entry describes user-visible impact, not implementation details
[ ] Every entry has an Indonesian summary line in italics
[ ] Entries are categorized correctly (Added / Changed / Fixed / Removed)
[ ] Breaking changes are prefixed with **BREAKING:**
[ ] Entries within each section are ordered by significance (most important first)
[ ] No internal refactors, test changes, or doc-only changes included
[ ] No dependency bumps without user-visible impact included
[ ] No hype or marketing language — facts only
[ ] Version number follows semver (PATCH for fixes, MINOR for features, MAJOR for 1.0+)
[ ] Date format is ISO 8601 (YYYY-MM-DD)
[ ] Unreleased section exists at the top for work-in-progress
[ ] Indonesian summaries are natural language, not mechanical translations
[ ] Each entry is 1-2 lines maximum (English + Indonesian)
[ ] Git log has been reviewed — no notable user-visible changes were missed
```

---

## Integration with Other Skills

| Condition | Invoke |
|-----------|--------|
| New feature documented in changelog | `technical-writer` to update README/CONTRIBUTING if needed |
| API change logged | `api-doc-generator` to update /docs/api.md and inline JSDoc |
| Version being tagged | Review full Unreleased section, move to versioned section |
| Breaking change logged | Verify `api-doc-generator` has updated the affected route docs |
| UI copy changed | Verify the new/edited strings are hardcoded in Bahasa Indonesia |

---

## Exit Criteria

A changelog update is complete when:

1. Every user-visible change since the last entry is represented.
2. Every entry has both an English description and an Indonesian summary.
3. Entries are categorized into the correct section (Added/Changed/Fixed/Removed).
4. Breaking changes are clearly marked.
5. No internal-only changes are included.
6. Entries are written in impact-first language that all three audiences can understand.
7. The checklist above is fully checked.
8. If a version is being tagged: the version number is correct per semver, the date is today's date in ISO format, and the Unreleased section is empty (or contains only truly unreleased work).

---

*A changelog is a letter to your community. Write it for the village resident who wants to know the map got better, not just the developer who made it so.*
