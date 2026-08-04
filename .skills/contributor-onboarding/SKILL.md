# Skill: contributor-onboarding

Onboarding new contributors to the Koperasi Desa Merah Putih Map project — including non-coders, vibe coders, casual contributors, and serious developers.

---

## Purpose

Guide every new contributor from "I found this project" to "I made my first contribution" as quickly and warmly as possible. This skill handles the human side of open-source contribution — not the code review itself, but the path to getting there.

This project has a wider contributor base than a typical open-source project. Many contributors are motivated by civic impact (their village cooperative on the map), not by engineering. The onboarding process must reflect this.

---

## When to Invoke

- A new contributor opens their first issue or PR.
- Someone asks "how can I help?" in any channel.
- A contributor is confused about the project structure, setup, or workflow.
- You need to guide someone to the right type of contribution for their skill level.
- A contributor's first PR needs special handling (extra patience, more explanation in review).

## When NOT to Invoke

- Reviewing code quality of a PR (use `typescript-reviewer`).
- Triaging an issue (use `issue-triager`).
- Managing repository infrastructure (use `github-maintainer`).
- Handling conflict or community health issues (use `community-manager`).

---

## The Four Contributor Types

### Type 1: Non-Coder / Community Member

**Profile**: Village cooperative member, local government staff, community organizer, student. They found the project because they want their cooperative on the map, or they noticed incorrect data. They may not have a GitHub account. They may write only in Bahasa Indonesia.

**Onboarding Path:**

1. **Submit a map point**: Direct them to the live site's submission form. No GitHub needed. No technical knowledge needed. Walk them through: open the site, click "Tambah Koperasi" / "Add Cooperative," fill in the form, place the pin, submit.

2. **Report bad data**: If they found incorrect data (wrong location, fake cooperative, duplicate), they have two options:
   - **On the site**: Use the downvote/flag mechanism on the point's detail view.
   - **On GitHub**: File a Data Quality Report issue using the template. Help them create a GitHub account if needed.

3. **Improve translations**: The Indonesian translations in `messages/id.json` can always be improved. Guide them to edit the file directly on GitHub (no local setup needed):
   - Navigate to `messages/id.json` in the GitHub web UI.
   - Click the pencil icon to edit.
   - Find the key that needs improvement, change the value.
   - Click "Propose changes" — GitHub creates a fork and PR automatically.
   - No terminal, no git commands, no local setup.

4. **Response template for non-coders:**

```
Terima kasih sudah tertarik dengan proyek ini! / Thank you for your interest in this project!

Anda tidak perlu menjadi programmer untuk berkontribusi. / You don't need to be a programmer to contribute.

Berikut cara Anda bisa membantu: / Here's how you can help:
- Tambahkan koperasi desa Anda ke peta / Add your village cooperative to the map: [link to submission page]
- Laporkan data yang salah / Report incorrect data: [link to data quality issue template]
- Perbaiki terjemahan Bahasa Indonesia / Improve Indonesian translations: [link to messages/id.json]

Setiap kontribusi sangat berarti. / Every contribution matters.
```

### Type 2: Vibe Coder

**Profile**: Someone who codes casually, maybe uses AI tools, knows basic git but not advanced workflows. They want to contribute but are intimidated by "real" open-source projects. They may have tried contributing elsewhere and had a bad experience.

**Onboarding Path:**

1. **Find a good first issue**: Direct them to issues labeled `good first issue`. These are specifically curated to be completable in under 2 hours with minimal codebase knowledge.

2. **Local setup in under 10 minutes**:
   ```bash
   git clone <repo-url>
   cd peta-koperasi
   npm install
   cp .env.local.example .env.local
   # Fill in Supabase URL and anon key (provided in CONTRIBUTING.md)
   npm run dev
   # Open http://localhost:3000 — you should see the map centered on Indonesia
   ```

3. **The "make a small visible change" strategy**: Their first contribution should produce a visible result they can screenshot. Good candidates:
   - Add or fix a translation string (they see the text change on the page).
   - Fix a UI alignment issue (they see the visual fix).
   - Add an aria-label (they can verify with browser dev tools).

4. **The first PR workflow (simplified)**:
   ```bash
   git checkout -b i18n/fix-missing-translation
   # Make the change
   git add messages/id.json
   git commit -m "fix: add missing Indonesian translation for submit page header"
   git push origin i18n/fix-missing-translation
   # Open GitHub, click "Create Pull Request", fill in the template
   ```

5. **What they need to hear**: "Your contribution matters. A translation fix is a real contribution. You don't need to understand the whole codebase to help."

### Type 3: Casual Contributor

**Profile**: Working developer who wants to contribute occasionally. Comfortable with git, TypeScript, React. May contribute a few PRs per month. Wants to understand the project well enough to be effective but is not trying to become a maintainer.

**Onboarding Path:**

1. **Full dev setup**: Follow the complete setup in CLAUDE.md (clone, install, env vars, Supabase local or remote, `npm run dev`, `npm test`).

2. **Read the project guides in this order**:
   - `soul.md` — understand the project's values and decision framework (10 minutes)
   - `SPEC.md` — understand the technical specification, especially section 10 (out of scope) (20 minutes)
   - `CLAUDE.md` — understand the code style and architectural constraints (10 minutes)
   - `CONTRIBUTING.md` — understand the PR workflow and expectations

3. **How SPEC.md and CLAUDE.md guide work**: SPEC.md defines *what* the project does and does not do. CLAUDE.md defines *how* the code is written. Together, they prevent scope creep and style drift. When in doubt, check these two files first.

4. **PR workflow**:
   - Pick an issue (or file one first if the change is not tracked).
   - Create a feature branch from `main`.
   - Make the change. Run `npm run lint`, `npm run type-check`, `npm test` locally.
   - Push and open a PR using the template.
   - Expect review within 3 days. Address feedback by pushing new commits (do not force-push).
   - After approval, a maintainer merges.

5. **What they need to know**: The 9 locked architectural rules in CLAUDE.md are non-negotiable. If a change requires violating one of them, it requires an architectural discussion first (use the `architect` skill).

### Type 4: Serious Developer

**Profile**: Experienced developer who wants to make significant contributions — new features, architectural improvements, performance optimization. May want to become a maintainer.

**Onboarding Path:**

1. **Full setup + run the test suite**: After local setup, run the complete test suite and read through the test files to understand coverage.

2. **Study the architecture**:
   - Read the `architect` skill to understand how architectural decisions are made.
   - Read `src/app/api/` route handlers to understand the data flow.
   - Read `src/lib/geo.ts` to understand PostGIS query patterns.
   - Read `supabase/migrations/` to understand the database schema.

3. **How to propose significant changes (RFC process)**:
   - Before writing code, open a GitHub Discussion with the title: "RFC: [description of proposed change]"
   - In the discussion, address: What problem does this solve? Which soul.md values does it serve? What are the alternatives? What is the implementation plan?
   - Wait for maintainer feedback before starting implementation.
   - For changes that touch the database schema, API contracts, or architectural rules: the `architect` skill must be run first.

4. **The architecture review gate**: Any PR that adds a new API route, modifies the database schema, adds a new dependency, or changes the voting logic must pass architectural review. This is not bureaucracy — it protects the project's simplicity.

5. **Path to maintainership**: Consistent quality contributions over time. No formal process — maintainers are recognized when they have demonstrated understanding of soul.md values and architectural discipline. Being a good maintainer means saying "no" to features that do not belong, not just shipping code.

---

## Local Dev Setup Validation

After running `npm run dev`, the contributor should see:

- The map centered on Indonesia (approximately lat -2.5, lng 118).
- OpenStreetMap tiles loading correctly.
- The language toggle working (switching between Indonesian and English).
- If using a remote Supabase project with data: pins visible on the map.

### Troubleshooting: Blank Page

If they see a blank page after `npm run dev`:

1. **Check the browser console** for errors. Common issues:
   - `NEXT_PUBLIC_SUPABASE_URL is not defined` — `.env.local` not created or not populated.
   - `Failed to fetch` on API calls — Supabase URL is wrong or Supabase is not running.
   - `window is not defined` — a server component is trying to use Leaflet. Check for missing `"use client"` directive.

2. **Check the terminal** for build errors:
   - TypeScript errors — run `npx tsc --noEmit` to see the full list.
   - Missing dependencies — run `npm install` again.

3. **Leaflet-specific issues**:
   - Map tiles not loading but page renders — check network tab for tile requests. If 403, the tile server may be rate-limiting. Wait and retry.
   - Map container has zero height — check that the map container div has explicit height in Tailwind (`h-screen`, `h-[500px]`, etc.).

4. **Supabase issues**:
   - If using local Supabase (`npx supabase start`): ensure Docker is running.
   - If using remote Supabase: ensure the URL and anon key in `.env.local` match the project settings.

---

## The "I Want to Add X" Response Protocol

When a contributor says "I want to add [feature]":

```
Step 1: Check SPEC.md section 10 (Out of Scope).
  - If the feature is listed → explain why it is out of scope, suggest alternative contribution.
  - If the feature is NOT listed → proceed to Step 2.

Step 2: Check soul.md decision questions.
  1. Does this make the map more useful for village residents?
  2. Does this keep the project simple and runnable by anyone?
  3. Does this respect contributors?
  4. Does this stay open (no vendor lock-in)?
  - If it fails all four → explain misalignment, suggest alternative.
  - If it passes at least two → proceed to Step 3.

Step 3: Check scope and complexity.
  - Small change (< 1 day, single file area) → point to relevant code, suggest a branch name, let them start.
  - Medium change (multi-file, new component) → suggest filing an issue first for discussion.
  - Large change (new API route, schema change, new page) → suggest RFC process via GitHub Discussions.
```

**Response template for out-of-scope requests:**

```
Thank you for the suggestion! I can see why [feature] would be useful.

However, this is currently listed as out of scope for the first version of the project (see SPEC.md section 10). The reason is [explain the specific reason — e.g., "adding categories would require a taxonomy that the community hasn't agreed on yet, and it could become a barrier to submission"].

Here are some ways you could contribute that would have immediate impact:
- [suggest 2-3 specific open issues or contribution types]

If you feel strongly about this feature for a future version, you're welcome to open a GitHub Discussion so the community can weigh in!
```

---

## The First PR Experience

### What to Expect

- **Review turnaround**: target 3 business days for first response. Translation-only PRs may be faster.
- **Type of feedback**: expect suggestions, not demands. Comments like "Consider renaming this to X for clarity" or "Could you also add the English translation?" — not "This is wrong."
- **Iteration**: most first PRs need 1-2 rounds of feedback. This is normal and expected.

### How to Address Feedback

- Push new commits to the same branch — do not force-push or squash during review.
- Reply to each review comment to indicate whether you have addressed it.
- If you disagree with feedback, explain your reasoning. Respectful discussion is welcome.
- If you are stuck, say so. Ask for help. No one will judge you for asking.

### First PR Special Handling (for reviewers)

When reviewing a contributor's first PR:

1. **Check if it is their first contribution** (GitHub shows "First-time contributor" badge).
2. **Start with what they did well.** Even if the PR needs changes, find something positive.
3. **Explain the "why" behind every change request.** Do not just say "change this" — say "change this because [reason]."
4. **Offer to pair or help if the changes are complex.** "I'm happy to walk you through this if you'd like."
5. **After merge, welcome them explicitly.** "Welcome to the project! Thank you for your first contribution."

---

## Bilingual Onboarding

### CONTRIBUTING.md Structure

The `CONTRIBUTING.md` file must have:

1. **Indonesian summary at the top** — a 10-line summary in Bahasa Indonesia covering: what the project is, how to contribute without coding, how to contribute with code, and where to ask questions.
2. **Full English guide** — the detailed contributing guide in English.
3. **Translation contribution guide** — step-by-step with screenshots for editing `messages/id.json` via the GitHub web UI.

### Language Policy

- Issues and PRs can be written in Bahasa Indonesia or English. Both are equally valid.
- Reviewers should respond in the language the contributor used (or both if unsure).
- Code comments and commit messages should be in English (for broader accessibility).
- Documentation should be in English with Indonesian summaries where possible.

---

## What to NEVER Say to a Contributor

These phrases violate soul.md's respect-for-contributors value. Never use them, even implicitly:

| Never say | Why it is harmful | Say instead |
|---|---|---|
| "This is trivial." | Dismisses their effort. What is trivial to you may have taken them hours. | "Thank you for this fix!" |
| "Why didn't you check SPEC.md first?" | Blames them for not knowing a document exists. | "This is actually covered in SPEC.md section X — here's the link." |
| "This PR is too small." | Discourages small, safe contributions. | "Every fix counts. Thank you!" |
| "Just use [tool/command]." | Assumes knowledge they may not have. | "You can use [tool/command] — here's how: [explanation]." |
| "This is not how we do things here." | Gatekeeping without explanation. | "In this project, we do X because Y. Here's why: [link to docs]." |
| "LGTM" (on a first PR with no other comment) | Feels dismissive even if technically an approval. | "This looks good! [One specific thing you liked]. Welcome to the project!" |

---

## Checklist for Welcoming a New Contributor

```
[ ] Identify contributor type (non-coder, vibe coder, casual, serious)
[ ] Respond within 3 days of their first issue/PR/question
[ ] Use bilingual greeting if their message is in Indonesian
[ ] Point them to the right contribution path for their type
[ ] If they opened a PR: check for "First-time contributor" badge, apply special handling
[ ] If their contribution is out of scope: decline kindly with explanation and alternatives
[ ] If their setup is failing: help debug (check the troubleshooting section above)
[ ] After their first merged contribution: explicitly welcome them
[ ] If they disappear after feedback: follow up once after 7 days with "No pressure, just checking in — let me know if you need help"
```

---

## Exit Criteria

The contributor-onboarding task is complete when:

1. The contributor has a working local dev setup (or knows how to contribute via GitHub web UI for non-code contributions).
2. They understand which type of contribution matches their skills and interest.
3. They have opened (or are actively working on) their first issue or PR.
4. They know where to find SPEC.md, soul.md, and CLAUDE.md.
5. They have received a welcoming response within 3 days.
6. If their first PR was merged: they received an explicit welcome message.
7. If their contribution was out of scope: they were redirected kindly with alternative suggestions.
8. They know how to ask for help if they get stuck.

---

*This skill is governed by soul.md. Every contributor — from a village cooperative member filing a data report to a senior developer proposing an architectural change — deserves the same respect and warmth. Gotong royong means everyone contributes what they can.*
