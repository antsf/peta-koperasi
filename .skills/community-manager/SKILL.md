# Skill: community-manager

Managing the community health of the Koperasi Desa Merah Putih Map project — a civic-tech open-source project in Indonesia where many contributors are motivated by civic impact, not engineering.

---

## Purpose

Maintain a healthy, sustainable, welcoming community around this project. Monitor the signals that indicate whether the community is thriving or struggling. Intervene when dynamics go wrong. Celebrate when they go right. Prevent maintainer burnout. Protect the culture described in soul.md.

This is not a developer community management skill. This is a **civic community** management skill. The contributors include village cooperative members, local government staff, students, casual coders, and professional developers. Managing this community means respecting all of them equally.

---

## When to Invoke

- A contributor is frustrated or aggressive about a decision.
- PR review comments are getting terse, dismissive, or hostile.
- A contribution is being overlooked or undervalued.
- The project is becoming dominated by one or two people.
- Maintainer burnout signals are appearing (slow responses, terse communication, declining PR quality).
- A community health audit is needed.
- A first-time contributor needs recognition.
- A conflict between contributors needs resolution.
- Communication channels are getting confused (feature discussion in issues, bug reports in discussions, etc.).

## When NOT to Invoke

- Triaging a specific issue (use `issue-triager`).
- Reviewing code quality (use `typescript-reviewer`).
- Setting up repository infrastructure (use `github-maintainer`).
- Onboarding a specific contributor (use `contributor-onboarding`).

---

## The Unique Dynamic

### This Is Not a Tech Community

Most open-source projects are developer communities. This one is not — or at least, not exclusively. The people who contribute to this project fall into several groups:

| Group | Motivation | What they contribute | What they need |
|---|---|---|---|
| Village cooperative members | Their koperasi on the map | Map point submissions, data corrections | Simple tools, Indonesian language, no jargon |
| Local government / NGO staff | Civic data for their region | Data quality reports, regional verification | Trust that the data is taken seriously |
| Students | Learning, portfolio, civic interest | Code PRs, translations, documentation | Patience, mentorship, clear good-first-issues |
| Vibe coders | Fun, community, visible impact | Small PRs, translations, UI tweaks | Welcoming tone, quick feedback, visible results |
| Casual developers | Contributing to a meaningful project | Feature PRs, bug fixes, code review | Clear architecture docs, reasonable PR turnaround |
| Serious developers | Building something important, well | Architecture, performance, complex features | Respect for their expertise, autonomy on implementation |

**Manage for the broadest group, not the most vocal.** If the project optimizes for serious developers, it loses everyone else. If it optimizes for non-coders, serious developers leave because nothing gets built. The balance point is: **make contributing easy at every level, and make the contribution path clear.**

---

## Tone and Language

### Guiding Principles

1. **Professional but warm.** Not corporate, not casual. The tone of a respected teacher, not a boss or a buddy.
2. **Bilingual in all public communications.** Every template, every welcome message, every announcement should have both Indonesian and English. Indonesian first (it is the primary community language).
3. **Never condescending.** A village cooperative member asking "what is GitHub?" is not less important than a developer asking about PostGIS query optimization.
4. **Acknowledge the civic mission.** Every interaction should reflect awareness that this project exists to help real communities. Phrases like "this helps keep the map accurate for the communities that depend on it" ground the work.

### Language Templates

**Welcome message for a new contributor (any type):**

```
Selamat datang di proyek Koperasi Desa Merah Putih Map! Terima kasih sudah bergabung.

Welcome to the Koperasi Desa Merah Putih Map project! Thank you for joining.

Every contribution matters — whether it's adding a cooperative to the map, fixing a translation, or writing code. We're glad you're here.

Setiap kontribusi berarti — baik itu menambahkan koperasi ke peta, memperbaiki terjemahan, atau menulis kode. Kami senang Anda ada di sini.
```

**Acknowledgment of a civic contribution (data quality report, map submission):**

```
Thank you for helping keep the map accurate. Reports like yours are what make this project trustworthy for the communities it serves.

Terima kasih telah membantu menjaga keakuratan peta. Laporan seperti ini yang membuat proyek ini dapat dipercaya oleh masyarakat yang dilayaninya.
```

---

## Recognizing Contributions

### All Contributions Count

This is the most important principle. In this project, a translation fix is as valuable as a feature PR. A data quality report is as valuable as a performance optimization. Recognition must reflect this.

### What to Recognize

| Contribution type | Recognition action |
|---|---|
| First PR merged | Welcome message + "thank you for your first contribution!" on the PR |
| Translation addition/fix | Thank them specifically for improving accessibility for Indonesian users |
| Data quality report | Thank them for keeping the map trustworthy |
| Map point submission (via site) | Not visible on GitHub, but acknowledge in release notes if pattern is significant |
| Bug report with good reproduction steps | Thank them for the clear report — it saves debugging time |
| Code review feedback given | Thank reviewers, not just authors — reviewing is contributing |
| Documentation improvement | Call out in release notes |

### Recognition in Release Notes

Every release should have a Contributors section that lists everyone who contributed, not just code authors:

```markdown
### Contributors
Thank you to everyone who contributed to this release:
- @developer1 — region filter implementation
- @translator1 — Indonesian translation improvements
- @reporter1 — data quality reports for Jawa Barat region
- @reviewer1 — thorough code reviews
```

### Recognition Anti-Patterns

- Thanking only code contributors in release notes.
- Using contribution graphs/stats that only count commits (excludes issue reporters, reviewers, translators).
- Creating "contributor of the month" competitions (creates hierarchy, discourages casual contribution).
- Ignoring data quality reporters because their contributions are not PRs.

---

## Conflict Resolution

### Common Conflict Scenarios

**Scenario 1: Contributor angry about feature rejection**

A contributor spent time building something that was rejected as out of scope.

**Response framework:**
1. **Acknowledge their effort explicitly.** "You clearly put significant work into this, and the code quality is strong."
2. **Ground the rejection in soul.md values, not authority.** Not "because we said so" but "because this would make the project harder to maintain for community volunteers" or "because this adds a dependency that costs money, which contradicts our commitment to keeping this free."
3. **Explain the specific soul.md question it fails.** "The decision framework in soul.md asks: 'Does this keep the project simple and runnable by anyone?' For this feature, the answer is no because [specific reason]."
4. **Offer an alternative path.** "If you'd like to explore this idea, you could fork the project and experiment, or open a Discussion to gather community input for a future version."
5. **End warmly.** "We hope this doesn't discourage you from contributing. Your skills are valuable and there are many areas where they would make a real impact."

**Scenario 2: Reviewer being terse or dismissive**

A reviewer is leaving comments like "wrong," "fix this," "why?" without explanation.

**Response framework:**
1. **Address privately first** (if possible via GitHub's direct communication, or via a gentle public comment).
2. **Reference the project's review standards.** "In this project, we explain the 'why' behind every review comment, especially for newer contributors."
3. **Model the behavior.** Rewrite one of their comments as an example: "Instead of 'wrong approach,' something like 'Consider using X because Y — the current approach has Z drawback' helps the contributor learn."
4. **Do not publicly shame.** The goal is behavior change, not punishment.

**Scenario 3: Two contributors disagree about implementation**

Two contributors have different approaches to the same problem.

**Response framework:**
1. **Redirect to the decision framework.** "Let's evaluate both approaches against soul.md: which one keeps the project simpler? Which one is easier for a new contributor to understand?"
2. **If both are valid:** defer to the one that is simpler. Simplicity is a project value.
3. **If it is an architectural question:** invoke the `architect` skill to make a documented decision.
4. **Thank both contributors.** "Having multiple approaches considered makes the project stronger."

---

## Community Health Signals

### Metrics to Monitor

| Signal | Healthy | Warning | Critical |
|---|---|---|---|
| Time to first response on issues | < 3 days | 3-7 days | > 7 days |
| PR review turnaround | < 5 days | 5-14 days | > 14 days |
| Issue close-without-response rate | 0% | < 5% | > 5% |
| PR comment tone | Constructive, explains "why" | Terse but not hostile | Dismissive, condescending |
| Contribution diversity | 3+ active contributors | 2 active contributors | 1 person doing everything |
| First-time contributor retention | Returns for 2nd contribution | Files issue but no PR | Disappears after first interaction |
| Data quality report response | Acknowledged + explained | Acknowledged but no action path | Ignored |
| Language inclusivity | Bilingual responses consistent | Occasional English-only responses to Indonesian issues | Indonesian issues regularly ignored |

### How to Measure

- **Time to first response**: GitHub Insights or manual check of recent issues.
- **PR review turnaround**: check the time between PR opened and first review.
- **Close-without-response**: search for issues closed by bot or maintainer with zero comments.
- **Contribution diversity**: `git shortlog -sn --since="3 months ago"` — if one person has 80%+ of commits, that is a warning.
- **First-time contributor retention**: check if users with the "First-time contributor" badge came back.

---

## Anti-Patterns in Civic Tech Communities

### 1. Gatekeeping Behind Technical Jargon

**Signal**: Non-technical contributors are told to "check the API docs" or "run the linter" without explanation.

**Fix**: Every instruction to a non-technical contributor must include the "how," not just the "what." Instead of "run `npm test`," say "open your terminal, navigate to the project folder, and type `npm test` — this checks that nothing is broken."

### 2. Dismissing "Non-Technical" Contributions

**Signal**: Translation PRs get one-word approvals while code PRs get detailed review and discussion. Data quality reports get closed quickly without follow-up.

**Fix**: Give translation PRs the same attention. Comment on specific improvements. For data quality reports, explain what will happen next and follow up.

### 3. Letting Perfect Be the Enemy of Good

**Signal**: A contributor's PR is blocked for weeks because a reviewer wants "one more test" or "slightly better naming." Meanwhile, the contributor loses motivation.

**Fix**: If CI passes and the logic is correct, merge. File follow-up issues for polish. A merged imperfect PR is better than an abandoned perfect one.

### 4. Invisible Labor Going Unrecognized

**Signal**: The person who triages issues, reviews PRs, and answers questions gets no recognition because they are not authoring code.

**Fix**: Recognize reviewers and triagers in release notes. Thank them publicly. Their work is what keeps the project running.

### 5. English-Only Communication

**Signal**: All issues, PRs, and discussions are in English. Indonesian contributors stop participating.

**Fix**: Enforce bilingual templates. Respond in Indonesian when the contributor writes in Indonesian. Make it clear that Indonesian is a first-class language in this project.

### 6. Founder/Maintainer as Single Point of Failure

**Signal**: One person reviews all PRs, triages all issues, makes all decisions. When they are busy, everything stops.

**Fix**: See the Volunteer Sustainability section below.

---

## Communication Channels

### Keep Channels Separate

| Channel | Purpose | What belongs here | What does NOT belong here |
|---|---|---|---|
| **GitHub Issues** | Bug reports, data quality reports, translation requests, documentation issues | Specific, actionable items with clear scope | Feature discussion, architecture debate, general questions |
| **GitHub Pull Requests** | Code changes, translation changes, documentation changes | Implementation, code review | Feature proposals (open a Discussion first) |
| **GitHub Discussions** | Feature proposals, architecture RFCs, community questions, feedback | Open-ended conversation, brainstorming, community input | Bug reports (file an issue instead) |

### Redirecting Misplaced Communication

If someone posts a feature proposal as an issue:

```
Thank you for this idea! This is a great candidate for a GitHub Discussion, where the community can weigh in before we decide on implementation.

I've moved this to Discussions: [link]. Feel free to continue the conversation there!

Terima kasih atas idenya! Ini cocok untuk didiskusikan di GitHub Discussions. Saya sudah memindahkannya ke: [link].
```

If someone posts a bug report in Discussions:

```
This looks like a bug report — let's track it as an issue so it doesn't get lost.

I've created an issue for this: [link]. You can follow progress there.
```

---

## The Volunteer Sustainability Problem

### The Reality

Most open-source civic projects die from maintainer burnout. The pattern:
1. Enthusiastic founder starts the project.
2. Contributors join, the project grows.
3. The founder handles all reviews, all triage, all decisions.
4. The founder burns out, response times grow.
5. Contributors leave because their PRs sit unreviewed.
6. The project stalls.

### Prevention Strategies

**1. Distribute Ownership by Domain**

Identify contributors who show consistent interest in specific areas and give them explicit ownership:

| Domain | Owner | Responsibility |
|---|---|---|
| Translations | Contributor A | Reviews all translation PRs, maintains i18n quality |
| Data quality | Contributor B | Triages data quality reports, monitors fake entries |
| Map/geo features | Contributor C | Reviews map-related PRs, maintains Leaflet code |
| API/backend | Contributor D | Reviews API PRs, maintains Supabase queries |

Ownership does not mean gatekeeping. It means "this person is the first reviewer for this area, and they can merge without waiting for the founder."

**2. Identify Potential Maintainers**

Look for contributors who:
- Consistently submit quality PRs.
- Review other people's PRs constructively.
- Respond to issues helpfully.
- Understand and reference soul.md values in discussions.
- Say "no" to out-of-scope features with kindness.

These are potential maintainers. Invite them explicitly: "You've been making great contributions. Would you be interested in becoming a maintainer? It would mean having merge access and being a first reviewer for [domain]."

**3. Avoid Single Point of Failure**

- At least 2 people should have merge access to `main`.
- At least 2 people should have access to the Supabase project.
- At least 2 people should have access to the Vercel deployment.
- The `CLAUDE.md` and `soul.md` files should be considered "owned by the community," not by the founder.

**4. Sustainable Review Cadence**

- Set expectations: PRs are reviewed within 5 business days, not immediately.
- It is OK to batch review (review 5 PRs on Saturday) instead of reviewing each one as it arrives.
- It is OK to skip a week. Announce it: "I'll be slower on reviews this week. Thank you for your patience."
- It is NOT OK to go silent. If you are burned out, say so. The community will understand.

**5. Say No to Grow**

The biggest sustainability threat is scope creep. Every feature added is a feature that must be maintained. The soul.md decision framework exists to make "no" easier:

- "No, because this makes the project harder to run for small communities."
- "No, because this adds a paid dependency."
- "No, because this is out of scope for the first version."

Saying no to features is saying yes to sustainability.

---

## Community Health Checklist

Run this checklist monthly (or after any significant community event):

```
## Response Times
[ ] Average time to first response on issues: ___ days (target: < 3)
[ ] Average PR review turnaround: ___ days (target: < 5)
[ ] Issues closed without any response: ___ (target: 0)

## Tone and Inclusivity
[ ] Review 5 recent PR review threads: are comments constructive and explanatory?
[ ] Check recent Indonesian-language issues: were they responded to bilingually?
[ ] Check for "First-time contributor" PRs: were they welcomed warmly?
[ ] Check for data quality reports: were they treated with civic urgency?

## Contribution Diversity
[ ] Number of unique contributors in the last 3 months: ___ (target: 3+)
[ ] Percentage of commits by top contributor: ___% (warning if > 70%)
[ ] Number of non-code contributions (translations, data reports, docs): ___
[ ] Any new contributors who made a 2nd contribution? (retention signal)

## Sustainability
[ ] Number of people with merge access: ___ (target: 2+)
[ ] Number of people with Supabase access: ___ (target: 2+)
[ ] Number of people with Vercel access: ___ (target: 2+)
[ ] Has the primary maintainer taken a break in the last 3 months?
[ ] Are there domain owners for at least 2 areas?

## Communication Hygiene
[ ] Feature discussions are happening in Discussions, not Issues
[ ] Bug reports are in Issues, not Discussions
[ ] No issues are misplaced in the wrong channel without being redirected

## Recognition
[ ] Last release notes included all contributor types (code + non-code)
[ ] First-time contributors were explicitly welcomed
[ ] Reviewers and triagers were thanked
```

---

## Exit Criteria

The community management task is complete when:

1. All community health metrics are in the "healthy" range (see the signals table above).
2. Response times are within target: < 3 days for issues, < 5 days for PRs.
3. No issues have been closed without a response.
4. Bilingual communication is consistent across all public interactions.
5. At least 2 people have merge access, Supabase access, and Vercel access.
6. Domain ownership is established for at least 2 areas.
7. First-time contributors are being welcomed and retained.
8. Non-code contributions (translations, data reports, docs) are being recognized.
9. The monthly community health checklist has been run and all items are addressed.
10. No active conflicts remain unresolved.
11. The primary maintainer has a sustainable review cadence and is not showing burnout signals.

---

*This skill is governed by soul.md. The community IS the project. The map is a tool, but the people who submit data, verify cooperatives, translate the interface, and write the code — they are what makes it real. Manage this community like you are taking care of something that matters, because it does.*
