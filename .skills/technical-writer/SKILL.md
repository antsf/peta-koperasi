# Skill: technical-writer

Writing documentation for a bilingual open-source civic-tech project.

---

## Purpose

Create and maintain the documentation that makes this project accessible to every type of contributor: serious developers, casual coders, vibe coders, and non-coders (village residents, students, NGO workers, local government staff). Documentation is how gotong royong scales beyond the people who were there at the start.

This skill covers the three documents this project actually needs: `README.md`, `CONTRIBUTING.md`, and a `/docs` directory for non-code contributors. It does NOT cover: a dedicated docs site, API reference website, video tutorials, or a wiki. Those are out of scope — they add maintenance burden without matching the audience.

---

## When to Invoke

- The project needs a README, CONTRIBUTING guide, or contributor-facing documentation created or updated.
- A new feature has shipped and the docs have not been updated to reflect it.
- A non-technical contributor reports confusion about how to participate.
- A PR changes API behavior, submission flow, or voting rules — and the docs still describe the old behavior.
- You are reviewing a PR and notice hardcoded instructions that should be in a docs file.

## When NOT to Invoke

- Writing inline code comments or JSDoc (use `api-doc-generator`).
- Writing a changelog entry (use `changelog-writer`).
- Writing the technical spec itself (that is `SPEC.md`, maintained separately).
- Writing `soul.md` or `CLAUDE.md` (those are governance documents, not contributor docs).

---

## Inputs

Before writing or updating documentation, answer these:

1. **Which document?** README.md, CONTRIBUTING.md, or a `/docs/*.md` file?
2. **Who is the primary reader?** Developer setting up locally? Non-coder submitting a map point? Translator adding strings?
3. **What changed?** If updating, what specific feature or flow is now different?
4. **Bilingual requirement?** Does this section need both Indonesian and English, or is English-only acceptable?

---

## Outputs

A documentation file or update that:

- Is accurate to the current state of the codebase.
- Serves the identified audience without condescension or jargon walls.
- Follows the bilingual strategy defined below.
- Passes the documentation review checklist at the end of this skill.

---

## What This Project Needs (and Nothing More)

### Document 1: README.md

The front door. Must work for someone who landed on the GitHub page from a search result, a shared link, or a government report.

**Required sections, in order:**

1. **Project title + bilingual summary** — 2-3 sentences in both Indonesian and English explaining what this is. Indonesian first (it is the default locale). The summary must answer: What is this? Who is it for? Why does it exist?

2. **Live demo link** — One line. Link to the deployed Vercel URL. If no deployment yet, a placeholder with `<!-- TODO: add live URL after first deploy -->`.

3. **Screenshot** — A single screenshot of the map with pins visible. Store in `/docs/assets/` or use a direct image URL. Alt text must be descriptive ("Map showing koperasi locations across Java").

4. **Quick start** — Exactly three commands for developers:
   ```
   git clone <repo-url> && cd peta-koperasi
   npm install
   npm run dev
   ```
   Plus a note about `.env.local` setup pointing to `CONTRIBUTING.md` for full details.

5. **How to contribute** — Short list of contribution types (not just code). Link to `CONTRIBUTING.md` for details. Frame this around gotong royong — communal contribution, everyone welcome.

6. **Tech stack** — Brief list, no explanations needed. Developers will recognize the tools.

7. **License** — MIT. One line.

**What does NOT go in README:**
- Full API documentation (that goes in `/docs/api.md`).
- Detailed setup instructions (that goes in `CONTRIBUTING.md`).
- Project philosophy (that is `soul.md`).
- The full spec (that is `SPEC.md`).

### Document 2: CONTRIBUTING.md

The guide for anyone who wants to help. Must serve four distinct contributor types in one document without making any of them feel lost.

**Required sections, in order:**

1. **Welcome message** — Bilingual (ID + EN). Frame contribution as gotong royong. Explicitly state: "You do not need to write code to contribute."

2. **How to submit a map point (non-technical)** — Step-by-step with screenshots if possible. This is for village residents and community workers. No terminal commands. Explain: go to the website, click submit, fill in the form, what happens after submission (pending status, community voting). Explain the voting/verification system using the gotong royong framing: "The community verifies each submission together."

3. **How to improve an Indonesian UI string** — Explain where user-facing text lives (directly in `src/components/*.tsx`) and how to propose a wording improvement. Show a before/after example. The app is Bahasa Indonesia only — there is no translation system. This is for contributors who want to improve the copy but may not be developers.

4. **How to report a data quality issue** — Explain what a data quality issue is (wrong location, closed koperasi, duplicate pin). Explain how to use GitHub Issues with a template. Explain how downvoting works as a community mechanism.

5. **Developer setup** — Full setup instructions:
   - Prerequisites (Node.js version, npm/pnpm)
   - Clone + install
   - Environment variables (`.env.local` setup with Supabase)
   - Database setup (Supabase CLI local or remote project)
   - Running the dev server
   - Running tests
   - File structure overview (link to SPEC.md section 7 for details)

6. **PR guidelines** — Branch naming, commit message format, what to include in the PR description, how reviews work.

7. **Code style summary** — Brief version of CLAUDE.md's code style rules. Link to CLAUDE.md for the full list. Key points: TypeScript strict, Tailwind only, server components by default, Zod validation in API routes.

### Document 3: /docs directory

For reference material that does not fit in README or CONTRIBUTING.

**Required files:**
- `/docs/api.md` — API reference (generated by `api-doc-generator` skill)
- `/docs/voting-system.md` — Non-technical explanation of how the voting and verification system works, written for community stakeholders. Bilingual. The gotong royong framing is essential here.

**Optional files (create only when needed):**
- `/docs/data-quality.md` — Guide for reporting and fixing data quality issues.
- `/docs/assets/` — Screenshots and images referenced by docs.

---

## The Bilingual Writing Challenge

Not every section needs both languages. The rule:

### Must be bilingual (Indonesian + English):

- README project summary — this is the first thing anyone reads.
- CONTRIBUTING welcome message — sets the tone for all contributors.
- How to submit a map point — the primary non-technical audience reads Indonesian.
- How to report a data quality issue — same audience.
- Voting system explanation (`/docs/voting-system.md`) — community stakeholders include local government and NGO workers who may not read English.

### English-only is acceptable:

- Developer setup instructions — developers working with Node.js, TypeScript, and Supabase can read English technical docs.
- PR guidelines — same.
- Code style rules — same.
- API documentation — developer audience, English is the standard for API docs.
- Quick start in README — three terminal commands are language-neutral.

### Why this split:

The audience for technical setup is developers who already navigate English-language tooling daily. The audience for submission and community participation includes people who may have limited English. Writing bilingual technical setup docs doubles the maintenance burden with minimal benefit. Writing bilingual community docs is essential for inclusion.

### Bilingual formatting convention:

Use a clear visual separator. Do not interleave languages sentence-by-sentence — that is unreadable. Use this pattern:

```markdown
## Cara Berkontribusi / How to Contribute

Proyek ini menggunakan semangat gotong royong — semua orang bisa membantu.
Kamu tidak perlu bisa coding untuk berkontribusi.

---

This project uses the spirit of gotong royong — everyone can help.
You do not need to know how to code to contribute.
```

Indonesian first (it is the default locale), then a horizontal rule, then English. Consistent throughout.

---

## Tone Guidelines

### For non-technical sections:

- Use simple, direct sentences. Avoid compound-complex structures.
- Define technical terms on first use. "GitHub (the website where this project's code is stored)."
- Use "you" not "the user" or "one."
- Frame actions positively: "Click the Submit button" not "The Submit button should be clicked."
- Avoid idioms that do not translate well between Indonesian and English.

### For technical sections:

- Be precise. Name exact files, exact commands, exact URLs.
- Do not explain what `npm install` does — developers know.
- Do not add unnecessary warnings or caveats. If the setup works, say so. If there is a known issue, say that specifically.
- Use code blocks for every command, file path, or code snippet. Never put code inline in a paragraph without backticks.

### For both:

- Never be condescending. "This is easy!" alienates people who find it hard. "This is complex!" scares off people who would have been fine.
- State facts. Let the reader judge difficulty for themselves.

---

## Documenting the Voting/Verification System

The voting system is the project's core governance mechanism. It must be documented for non-technical users using the gotong royong framing.

### What to explain:

1. **What happens after you submit a koperasi point** — It starts as "pending." It appears on the map but is not yet verified.

2. **How verification works** — Other community members can vote on whether the koperasi exists and the information is correct. This is gotong royong: the community verifies together.

3. **The status transitions, in plain language:**
   - Pending: "Menunggu verifikasi masyarakat" / "Waiting for community verification"
   - Approved (3 upvotes): "Diverifikasi oleh masyarakat" / "Verified by the community"
   - Flagged (3 downvotes): "Ditandai untuk ditinjau" / "Flagged for review"
   - Removed (6 downvotes): "Dihapus oleh keputusan masyarakat" / "Removed by community decision"
   - Community override (flagged + 5 upvotes): "Dipulihkan oleh masyarakat" / "Restored by the community"

4. **Why anonymous voting works** — No accounts needed. Anyone can vote. The system uses technical methods (not explained in detail) to prevent one person from voting twice on the same point. Frame this as fairness, not surveillance.

5. **What to do if you disagree with a vote outcome** — Submit more accurate information. Encourage others to verify. The community decides, not any single person.

### What NOT to explain in user-facing docs:

- IP hashing or fingerprinting implementation details.
- The specific dedup algorithm.
- The database schema.
- Supabase internals.

---

## Thinking Process

### Step 1 — Identify the document and audience

Which document is being written or updated? Who will read it? A README reader is different from a CONTRIBUTING reader is different from a `/docs/voting-system.md` reader.

### Step 2 — Check current accuracy

Read the existing document (if it exists). Read the relevant source files. Verify that every command, file path, API route, and behavior description matches the current codebase. Stale docs are worse than no docs.

### Step 3 — Apply the bilingual rule

Is this section one that must be bilingual? If yes, write the Indonesian version first, then the English version. Do not translate mechanically — write naturally in each language. The meaning must be identical but the phrasing should feel native.

### Step 4 — Apply the tone rules

Read the draft aloud (mentally). Does it sound welcoming to a village resident? Does it sound precise enough for a developer? If writing a bilingual section, does the Indonesian sound natural (not Google Translated)?

### Step 5 — Verify every command and path

Every `git clone`, `npm install`, `npm run dev` — run it mentally against the project structure. Every file path — check it exists. Every API route — check it matches SPEC.md. Every environment variable — check it matches `.env.local.example`.

### Step 6 — Run the checklist

See below.

---

## Common Documentation Mistakes

### Mistake 1: Writing for yourself, not the reader

Symptom: "Set up Supabase with PostGIS and configure the RLS policies." A developer who has never used Supabase does not know what RLS policies are.

Fix: Link to Supabase documentation for concepts. Provide the exact commands. The reader should be able to copy-paste their way to a working setup.

### Mistake 2: Mixing audiences in one section

Symptom: A "Getting Started" section that starts with "Anyone can contribute!" and then immediately shows terminal commands. Non-coders are lost. Coders are annoyed by the preamble.

Fix: Separate sections for separate audiences. Non-technical contribution guide is its own section. Developer setup is its own section. Clear headings.

### Mistake 3: Documenting aspirational features

Symptom: "You can export data as CSV from the API." This feature does not exist. It is in SPEC.md section 10 as explicitly out of scope.

Fix: Document only what exists in the current codebase. If a feature is planned, do not document it. If you must mention future work, label it clearly: "Planned for v2 (not yet available)."

### Mistake 4: Translating English idioms literally

Symptom: "Get your feet wet by submitting a point!" translated to Indonesian as a literal foot-wetting instruction.

Fix: Write each language independently. The Indonesian version of "try it out" is "coba saja" — direct, natural, no idiom needed.

### Mistake 5: Forgetting to update docs when code changes

Symptom: CONTRIBUTING.md says `npm run test` but the actual command is `npm test`. README says the API is at `/api/v1/points` but there is no versioning.

Fix: Every PR that changes behavior should include a docs update check. This skill should be invoked after feature PRs, not just for "docs PRs."

---

## Documentation Review Checklist

```
[ ] Every terminal command has been verified against the actual project
[ ] Every file path mentioned exists in the current repo structure
[ ] Every API route mentioned matches SPEC.md and the actual route files
[ ] Every environment variable mentioned matches .env.local.example
[ ] Bilingual sections: Indonesian is written naturally, not machine-translated
[ ] Bilingual sections: Indonesian appears first, then English after separator
[ ] Non-technical sections: no unexplained jargon, no assumed knowledge
[ ] Technical sections: precise file paths, exact commands, no ambiguity
[ ] Tone: welcoming without being condescending, precise without being intimidating
[ ] No aspirational features documented — only what currently exists
[ ] Screenshots (if used): alt text is descriptive, images are in /docs/assets/
[ ] Links: all internal links (to other docs, to SPEC.md, to soul.md) are valid
[ ] Voting system: described in gotong royong terms, no implementation details exposed
[ ] README: has project summary, quick start, contribution types, license
[ ] CONTRIBUTING: has non-technical guide, UI copy improvement guide, developer setup, PR guidelines
[ ] No duplicate information — each fact lives in one place, others link to it
```

---

## Integration with Other Skills

| Condition | Invoke |
|-----------|--------|
| API behavior changed | `api-doc-generator` to update `/docs/api.md` |
| New feature shipped | `changelog-writer` for the changelog entry |
| Voting rules changed | Update `/docs/voting-system.md` + verify against SPEC.md section 5 |
| New component or page added | Check if README or CONTRIBUTING needs updating |
| User-facing text added | Verify strings are hardcoded in Bahasa Indonesia |

---

## Exit Criteria

Documentation work is complete when:

1. The target document passes all items in the documentation review checklist above.
2. Every command in the document can be run successfully by a new contributor on a clean machine.
3. Bilingual sections read naturally in both Indonesian and English (not mechanical translations).
4. Non-technical sections are understandable by someone with no programming experience.
5. Technical sections are precise enough that a developer needs no follow-up questions to complete setup.
6. No information is duplicated across documents — each fact lives in one canonical location.
7. The document has been checked against the current codebase — no stale references to renamed files, changed commands, or removed features.

---

*Documentation is the gotong royong of knowledge — write it so everyone can participate.*
