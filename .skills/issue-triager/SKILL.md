# Skill: issue-triager

Triaging and managing GitHub issues for the Koperasi Desa Merah Putih Map project — a civic-tech project with contributors ranging from village cooperative members to senior developers.

---

## Purpose

Ensure every issue filed on this repository gets a timely, respectful, and accurate response. Triage means: read, categorize, label, respond, assign (if applicable), and close (if appropriate). No issue should go unanswered for more than 3 days.

This is a civic project. Some issues will come from people who have never filed a GitHub issue before. Some will be in Bahasa Indonesia. Some will describe a technical problem using non-technical language. Triage with patience and generosity.

---

## When to Invoke

- A new issue is filed and needs categorization and response.
- A batch of issues needs triage (backlog cleanup).
- An issue is stale and needs follow-up or closure.
- A duplicate issue is filed and needs linking to the original.
- An out-of-scope feature request needs a kind decline.
- A data quality report needs a civic-appropriate response.

## When NOT to Invoke

- Reviewing a PR (use `github-maintainer` or code review skills).
- Onboarding a new contributor (use `contributor-onboarding`).
- Making architectural decisions about a feature described in an issue (use `architect`).
- Community health concerns beyond issue response (use `community-manager`).

---

## Issue Types

### 1. Bug Report

**Signal**: Something is broken. The user describes unexpected behavior.

**Common examples in this project**:
- "Peta tidak muncul" / "Map doesn't appear" — could be tile loading failure, JavaScript error, or Supabase connection issue.
- "Saya sudah vote tapi bisa vote lagi" / "I already voted but can vote again" — vote dedup issue (critical).
- "Foto tidak tampil" / "Photo not showing" — could be correct behavior (photos hidden for non-approved points) or a bug.

**Triage actions**:
1. Label: `bug` + domain label (`map`, `api`, `ui`, `database`).
2. Assess severity:
   - **Critical**: data integrity (duplicate votes, wrong status transitions), security (raw IP stored), map completely broken. Label: `bug` + `critical`.
   - **Major**: feature not working for many users (vote button broken, submission form fails). Label: `bug`.
   - **Minor**: cosmetic issue, edge case, single browser. Label: `bug` + `low-priority`.
3. If information is missing, request it (see Bug Report Quality section below).
4. If it is a known issue, link to the existing issue.
5. If it is actually correct behavior (e.g., photos hidden for pending points), explain the behavior and close.

### 2. Data Quality Report

**Signal**: A user found wrong, fake, or duplicate data on the map.

**Common examples**:
- "Koperasi ini tidak ada" / "This cooperative doesn't exist" — fake entry.
- "Lokasinya salah, seharusnya di [location]" / "The location is wrong, it should be at [location]" — wrong pin placement.
- "Koperasi ini sudah ada, ini duplikat" / "This cooperative already exists, this is a duplicate."
- "Nama koperasinya salah" / "The cooperative name is wrong."

**Triage actions**:
1. Label: `data-quality`.
2. Respond with the data quality response template (see below).
3. This is a civic issue, not a technical bug. Treat it with urgency.
4. If it involves a fake/non-existent cooperative, escalate: this undermines the map's credibility.

### 3. Feature Request

**Signal**: A user wants new functionality.

**Triage actions**:
1. Check SPEC.md section 10 (Out of Scope). If the feature is listed there, respond with the out-of-scope template.
2. If not out of scope, run the soul.md filter:
   - Does this make the map more useful for village residents?
   - Does this keep the project simple?
   - Does this respect contributors?
   - Does this stay open?
3. Label: `enhancement` if in scope, `out-of-scope` if not.
4. If it needs specification before implementation: label `needs-spec`.
5. If it is a good small enhancement: consider also labeling `good first issue` if appropriate.

### 4. UI Text Issse

**Signal**: Incorrect or awkward Indonesian text in the interface.

**Common examples**:
- "Teks di halaman pending masih dalam Bahasa Inggris" / "The text on the pending page is still in English."
- "Kalimat ini kurang pas" / "This sentence is not quite right."

**Triage actions**:
1. Label: `ui-text`.
2. If the fix is obvious and small, also label `good first issue`.
3. Verify the issue by checking the relevant component in `src/components/*.tsx` (strings are hardcoded there — no i18n system).
4. Respond with encouragement — copy improvements are often overlooked.

### 5. Documentation Issue

**Signal**: README, CONTRIBUTING.md, or other docs are unclear, outdated, or missing.

**Triage actions**:
1. Label: `documentation`.
2. If the fix is small and clear, also label `good first issue`.
3. Verify the issue by reading the referenced documentation.

### 6. Question

**Signal**: The user is asking how something works, not reporting a bug or requesting a feature.

**Common examples**:
- "Bagaimana cara menambahkan koperasi?" / "How do I add a cooperative?"
- "Apakah proyek ini gratis?" / "Is this project free?"

**Triage actions**:
1. Answer the question directly.
2. If the question reveals a documentation gap, file a separate documentation issue.
3. If the user seems like a potential contributor, use the `contributor-onboarding` response.
4. Close after answering (with a note: "Closing this since the question is answered. Feel free to reopen if you need more help!").

### 7. Out-of-Scope Request

**Signal**: The user requests something explicitly listed in SPEC.md section 10.

**Triage actions**:
1. Label: `out-of-scope`.
2. Respond with the out-of-scope template (see below).
3. Close the issue.

---

## Triage Workflow

```
New issue filed
  |
  v
READ the full issue carefully
  |
  v
Is it in Indonesian? → Respond bilingually
  |
  v
CATEGORIZE into one of the 7 types above
  |
  v
LABEL appropriately (type + domain + priority if applicable)
  |
  v
Is it a DUPLICATE?
  YES → Link to original, explain what it tracks, close
  NO  ↓

Is it OUT OF SCOPE per SPEC.md §10?
  YES → Use out-of-scope template, label, close
  NO  ↓

Does it need MORE INFORMATION?
  YES → Request specific information (see templates below), label `needs-info`
  NO  ↓

RESPOND with appropriate template
  |
  v
Is it ASSIGNABLE? (clear scope, someone available)
  YES → Assign or add `help wanted` label
  NO  → Leave unassigned, it will be picked up
  |
  v
Done. Monitor for follow-up.
```

---

## Response Templates

### Data Quality Report Response

```
Terima kasih atas laporannya! / Thank you for this report!

Data quality is critical for this map to be trustworthy. Here's what happens next:

1. **Community voting**: Other community members can vote on this point. If enough people flag it (downvote), it will be automatically flagged for review and eventually removed.

2. **How you can help now**: If you visit the point on the map, you can use the downvote button to flag it. This adds your voice to the community review process.

3. **If the data is correct but the location is wrong**: Unfortunately, the current version does not support editing existing points. The best approach is to:
   - Downvote/flag the incorrect point so the community can review it.
   - Submit a new point with the correct information at the right location.

Kami sangat menghargai laporan seperti ini — ini membantu menjaga keakuratan peta. / We really appreciate reports like this — they help keep the map accurate.
```

### Out-of-Scope Feature Request Response

```
Thank you for this suggestion, @{username}! I can see the reasoning behind it.

This feature is currently outside the scope of the first version of this project. Specifically, SPEC.md section 10 lists [specific item] as out of scope because [specific reason grounded in soul.md — e.g., "it would add complexity that makes the project harder for community volunteers to maintain"].

The soul.md decision framework asks: "Does this keep the project simple and runnable by anyone?" For this feature, the answer is [explain].

If you'd like to discuss this for a future version, you're welcome to start a GitHub Discussion. The community's input on what to build next is valuable.

In the meantime, here are some open issues where your help would make an immediate impact:
- [link to good first issue 1]
- [link to good first issue 2]

Terima kasih! / Thank you!
```

### Bug Report — Needs More Information

```
Thank you for reporting this, @{username}!

To help us investigate, could you provide:

1. **Browser and version** (e.g., Chrome 120, Safari on iPhone)
2. **Steps to reproduce** — what exactly did you do before the issue occurred?
3. **Expected behavior** — what should have happened?
4. **Actual behavior** — what happened instead?
5. **Screenshot** (if possible) — a screenshot helps us see exactly what you see.

Jika lebih nyaman menulis dalam Bahasa Indonesia, silakan! / If you're more comfortable writing in Indonesian, please do!
```

### Duplicate Issue Response

```
Thank you for filing this, @{username}!

This issue is being tracked in #{original_issue_number}: [title of original issue]. That issue describes [brief summary of what it tracks and its current status].

I'm closing this one to keep the discussion in one place, but your report is valuable — it confirms that this is affecting multiple people. Feel free to add any additional context to the original issue.

Terima kasih! / Thank you!
```

### The "I Found a Fake Cooperative" Response

This is a critical civic issue. A fake cooperative on the map undermines trust in the entire project.

```
Terima kasih banyak atas laporan ini — ini sangat penting. / Thank you very much for this report — this is very important.

A fake entry on the map undermines the trust that real cooperatives and communities place in this tool. We take this seriously.

Here's what we'll do:

1. **Immediate action**: Please downvote/flag this point on the map if you haven't already. This starts the community review process.
2. **Community review**: With enough flags from community members, the point will be automatically flagged and eventually removed from the public map.
3. **Verification**: If you have evidence that this cooperative does not exist (e.g., no such organization registered, the address is a vacant lot), please share it here so reviewers have context.

The community voting system is specifically designed to handle this — it's how we maintain data quality without requiring a central authority.

Kami sangat menghargai kewaspadaan Anda. / We really appreciate your vigilance.
```

---

## Bug Report Quality

### What Information to Request

| Field | Why we need it | How to ask non-technical reporters |
|---|---|---|
| Browser/device | Bugs are often browser-specific (especially Leaflet on mobile) | "Anda pakai HP atau komputer? Browser apa?" / "Are you on phone or computer? Which browser?" |
| Steps to reproduce | Without this, we cannot investigate | "Bisa ceritakan langkah-langkahnya?" / "Can you walk us through what you did?" |
| Expected behavior | Clarifies whether it is a bug or a misunderstanding | "Seharusnya apa yang terjadi?" / "What should have happened?" |
| Actual behavior | The symptom | "Apa yang terjadi?" / "What happened instead?" |
| Screenshot | Worth a thousand words, especially for map issues | "Bisa kirim screenshot?" / "Can you share a screenshot?" |
| URL | Which page the issue occurred on | "Di halaman mana?" / "Which page were you on?" |

### Interpreting Non-Technical Reports

Indonesian reporters may describe issues using non-technical language. Interpret generously:

| What they say | What they likely mean |
|---|---|
| "Peta tidak muncul" / "Map doesn't appear" | Map tiles failed to load, OR JavaScript error preventing render, OR blank container |
| "Tidak bisa vote" / "Can't vote" | Vote button disabled (possibly already voted), OR API error on vote submission, OR network error |
| "Foto hilang" / "Photo missing" | Photo not displaying — check if point is not yet approved (correct behavior) |
| "Loading terus" / "Keeps loading" | Infinite spinner — likely API timeout or Supabase connection issue |
| "Error" (with no details) | They saw an error message or screen. Ask for a screenshot. |
| "Lambat" / "Slow" | Performance issue — ask which page and how many points are visible |

---

## Duplicate Handling

### How to Identify Duplicates

- Search existing issues (open AND closed) by keywords from the new issue.
- Check if the same area of functionality is described.
- Data quality reports: check if the same koperasi point is referenced (by name or approximate location).

### How to Handle Duplicates

1. **Link to the original issue** — use the issue number so GitHub creates a cross-reference.
2. **Explain what the original issue is tracking** — do not just say "duplicate of #X." Say "This is the same issue as #X, which tracks [brief description]. The current status is [open/in progress/etc.]."
3. **Acknowledge the reporter's effort** — "Thank you for reporting this — it confirms the issue is real."
4. **Close the duplicate** with the `duplicate` label.

### What NOT to do

- Never close with just "Duplicate" and no explanation.
- Never close without linking to the original.
- Never make the reporter feel like they wasted time by filing.

---

## Stale Issue Management

### Timeline

- **Day 0**: Issue is filed and triaged.
- **Day 60** (no activity): Add `stale` label. Post a comment:

```
This issue has been open for 60 days without activity. Is it still relevant?

- If yes, please comment with an update or any new information.
- If no, we'll close it in 14 days.

This is an automated housekeeping step — not a judgment on the issue's importance. If it's still valid, just let us know!
```

- **Day 74** (14 days after stale label, still no activity): Close with a comment:

```
Closing this issue after 74 days of inactivity. If the issue is still relevant, please feel free to reopen it or file a new issue with updated context.

Thank you for your original report!
```

### Exceptions to Stale Closure

Do NOT close as stale:

- Issues labeled `critical` — these stay open until resolved.
- Issues labeled `needs-spec` — they are waiting on a decision, not abandoned.
- Issues with active PR references — the work is in progress.
- Data quality reports about fake cooperatives — civic trust issues do not expire.

---

## Triage Checklist

Run through this for every new issue:

```
## Initial Assessment
[ ] Read the full issue (including any screenshots or links)
[ ] Identify the language — respond in the same language (or bilingually)
[ ] Categorize: bug / data-quality / feature-request / ui-copy / documentation / question / out-of-scope

## Labeling
[ ] Apply type label (bug, enhancement, ui-copy, data-quality, documentation, out-of-scope)
[ ] Apply domain label if applicable (api, ui, map, database)
[ ] Apply priority if applicable (critical for data integrity or security issues)
[ ] Apply good-first-issue if the fix is small and self-contained

## Duplicate Check
[ ] Search open issues for similar reports
[ ] Search closed issues for previously resolved versions
[ ] If duplicate: link original, explain, close

## Scope Check
[ ] Check SPEC.md section 10 for out-of-scope items
[ ] If out of scope: use template, close

## Response
[ ] Respond within 3 days
[ ] Use appropriate template (data quality, bug needs-info, out-of-scope, duplicate)
[ ] If bug: request missing information if needed
[ ] If data quality: explain the voting mechanism
[ ] If question: answer directly, close after answering
[ ] If feature request in scope: label enhancement, add needs-spec if complex

## Follow-up
[ ] If information was requested: check back in 7 days
[ ] If stale: follow the stale management timeline
```

---

## Exit Criteria

The issue triage task is complete when:

1. Every open issue has at least one label.
2. Every issue filed in the last 3 days has received a response.
3. No issue has been closed without explanation.
4. All duplicate issues link to their original.
5. All out-of-scope issues have been declined with a soul.md-grounded explanation.
6. Data quality reports have been responded to with the civic-appropriate template.
7. Bug reports with missing information have a clear information request.
8. Stale issues (60+ days) have been labeled and notified.
9. The stale closure process has been followed for issues at 74+ days (with exceptions respected).
10. No issue has been responded to dismissively or with jargon inappropriate for the reporter's apparent skill level.

---

*This skill is governed by soul.md. Every issue — from a senior developer's architectural concern to a village resident's report of a fake cooperative — deserves the same respect and urgency. The map's credibility depends on how we handle data quality reports. The community's health depends on how we handle people.*
