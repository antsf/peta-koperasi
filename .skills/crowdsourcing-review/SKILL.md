# crowdsourcing-review

Review the health and design of the crowdsourced data collection and verification system for the Koperasi Desa Merah Putih Map project.

## When to use

Run this skill when reviewing changes to the voting system, submission flow, anti-spam mechanisms, or data quality processes. Also run periodically to assess the health of the crowdsourcing pipeline: are submissions flowing, getting verified, and reaching approved status at a healthy rate?

## Activation

Trigger: user says "crowdsourcing review", "voting review", "submission review", "data quality review", "anti-spam review", or invokes `/crowdsourcing-review`.

## Instructions

You are reviewing the crowdsourced data collection and verification system for a civic-tech map of Indonesian village cooperatives. The system relies on anonymous submission and community voting — there are no moderators, no admins, no accounts. The community governs itself.

Work through each section below in order. Read the relevant files and data, report findings, and flag violations.

---

### 1. The Anti-Spam Model

This project uses a simple but deliberate anti-spam model:

- **Anonymous submission:** anyone can add a cooperative pin without registering
- **Community voting:** 3 upvotes to approve a pending submission
- **Vote deduplication:** one vote per (point_id, hashed_ip, hashed_fingerprint) combination

**Review the implementation:**

1. Read the vote API handler (`src/app/api/points/[id]/vote/route.ts`). Verify:
   - Vote dedup check is present and uses both IP hash and fingerprint hash
   - The UNIQUE constraint on the votes table is the backstop (database-level defense)
   - Duplicate vote attempts return HTTP 409, not 500
   - Vote type is validated (only 'up' or 'down' accepted)

2. Read the submission API handler (`src/app/api/points/route.ts`). Verify:
   - Zod validation on all required fields
   - Indonesia bounds check on lat/lng
   - IP and fingerprint are hashed before storage (never stored raw)
   - New submissions start with `status = 'pending'`

3. Review the status transition thresholds:
   - `pending -> approved`: 3 upvotes
   - `pending -> flagged`: 3 downvotes
   - `flagged -> removed`: 6 total downvotes
   - `flagged -> approved`: 5 upvotes (community override)

   Verify these thresholds are implemented correctly and match the spec.

**Flag if:**
- Vote dedup is missing or incomplete — **CRITICAL**
- Raw IP or fingerprint stored — **CRITICAL**
- Status transitions do not match the spec — **CRITICAL**
- Vote type not validated — **WARNING**

---

### 2. Approval Threshold Analysis

The current threshold is 3 upvotes to approve. Review whether this is appropriate:

**The cold start problem:**

With zero or few community members, zero votes happen, and zero pins get approved. A submission sitting in "pending" forever is functionally the same as rejection — the contributor sees no result and stops contributing.

**Review:**

1. If database access is available, check:
   - How many points are in `pending` status?
   - What is the average time from submission to reaching 3 votes?
   - What percentage of submissions have received ANY votes?

2. If no database access, review the code for:
   - Is the approval threshold configurable (environment variable or constant)?
   - Where is the threshold defined? Is it hardcoded in multiple places?

**Recommendation framework:**

| Community size | Recommended threshold | Rationale |
|---------------|----------------------|-----------|
| 0-50 submissions | 1 upvote | Bootstrap phase, any verification is better than none |
| 50-500 submissions | 2 upvotes | Growing community, some cross-verification possible |
| 500+ submissions | 3 upvotes | Mature community, full verification model |

**Flag if:**
- Threshold is hardcoded as a magic number in multiple files — **WARNING** (should be a single constant or env var)
- No mechanism exists to adjust threshold without code change — **INFO** (suggest making it an env var like `APPROVAL_THRESHOLD`)
- Submissions are stuck in pending with no votes — **WARNING** (cold start problem is active)

---

### 3. Vote Fraud Detection

The current defense is IP + fingerprint deduplication. Review its sufficiency:

**What the current system catches:**
- Same browser, same network voting twice — caught by (IP + fingerprint) UNIQUE constraint
- Same browser, different network (VPN) — caught by fingerprint match
- Different browser, same network — caught by IP match

**What the current system does NOT catch:**
- Different device, different network — a determined attacker with multiple phones on different networks can vote multiple times
- Browser fingerprint spoofing — sophisticated users can randomize fingerprint
- Organized vote manipulation — a group coordinating to mass-upvote or mass-downvote

**Review the code for additional signals that could improve detection without adding complexity:**

1. **Timing patterns:** Do votes arrive in suspicious bursts? (5 votes on a point within 10 seconds from "different" users is suspicious). Search for any rate limiting or timing analysis.

2. **User agent consistency:** If a "different" fingerprint votes from the same IP with the same user agent, that is suspicious. Check if user agent is part of the fingerprint or checked separately.

3. **Geographic plausibility:** A vote from an IP geolocated in Jakarta on a point in Papua, followed immediately by a vote from the same IP on a different point in Aceh, suggests automated behavior. Check if any geographic analysis exists.

**Flag if:**
- IP or fingerprint dedup is missing — **CRITICAL**
- No rate limiting on vote endpoint — **WARNING** (a script could submit thousands of requests)
- No UNIQUE constraint in database as backstop — **CRITICAL**
- System relies only on application-level checks without database constraint — **WARNING**

---

### 4. Data Completeness

Not all fields on a submission are required. Review what is required vs optional and whether the form encourages completeness:

**Expected required fields:** name, lat, lng (from map pin placement)
**Expected optional fields:** address, kelurahan, kecamatan, kabupaten, provinsi, phone, email, photo

**Review:**

1. Read the submit form component and the Zod validation schema.
2. Check which fields are marked as required in the schema.
3. Check whether the form UI communicates which fields are optional and why they matter:
   - Does the form say something like "Tambahkan nomor telepon agar warga bisa menghubungi koperasi ini" (Add a phone number so residents can contact this cooperative)?
   - Or does it just show empty optional fields with no encouragement?

4. If database access is available, check data completeness rates:
   - What percentage of submissions have phone numbers?
   - What percentage have the full address hierarchy (kelurahan through provinsi)?
   - What percentage have photos?

**Flag if:**
- Required fields are too permissive (lat/lng not required) — **CRITICAL**
- Required fields are too restrictive (phone required, blocking submissions) — **WARNING**
- Form provides no guidance on why optional fields matter — **INFO**
- Address hierarchy fields have no autocomplete or suggestion — **INFO** (future improvement, not v1 blocker)

---

### 5. The Re-Submission Pattern

When a pin is flagged or removed (wrong location, wrong name, duplicate), the correct response is for someone to submit a corrected version.

**Review:**

1. Is there any UI indication that a removed pin can be resubmitted with corrections?
2. When viewing a flagged point (if visible), is there a prompt like "Is this information wrong? Submit a correction"?
3. Does the submission form allow pre-filling from an existing point (to make corrections easier)?

In v1, the answer to #3 is likely "no" — and that is acceptable. But #1 and #2 should be addressed.

**Flag if:**
- No path exists for users to understand that re-submission is the correction mechanism — **WARNING**
- Removed points are completely invisible with no trace — **INFO** (users cannot learn from previous removals)

---

### 6. Contributor Trust Signals

**Current design (v1): no reputation system.** This is intentional.

Review whether anyone has proposed or partially implemented a reputation or trust system:

1. Search for concepts like "karma", "reputation", "trust score", "contributor level", "verified contributor" in code and comments.
2. Search for any database columns or tables that track per-contributor statistics.

A reputation system in a civic-tech project is a double-edged sword:
- PRO: incentivizes quality contributions
- CON: creates power imbalances, gaming incentives, and barriers to new contributors
- CON: requires identity, contradicting the anonymous model

**Flag if:**
- A reputation system has been partially implemented without architect review — **WARNING**
- Database stores per-contributor statistics beyond what is needed for dedup — **WARNING**
- Any feature rewards prolific contributors differently from new ones — **INFO** (review carefully before allowing)

---

### 7. Geographic Coverage Analysis

Crowdsourced data naturally clusters around populated, connected areas. Rural and remote provinces will be underrepresented.

**This is expected and is NOT a technical problem.** It is a community outreach problem.

**Review:**

1. If data is available, check the distribution of points by province. Flag provinces with zero or very few points.
2. Check whether the UI surfaces coverage gaps (e.g., "Belum ada data koperasi di Papua Barat" / "No cooperative data yet for West Papua").
3. Check whether the map's default viewport is appropriately centered on Indonesia (not on a specific island).

**Flag if:**
- Map default viewport is centered on Java only — **WARNING** (biases perception of coverage)
- No indication to users that coverage varies by region — **INFO**
- Technical barriers to submission in certain regions (e.g., geocoding service that does not cover eastern Indonesia) — **WARNING**

---

### 8. Data Integrity Over Time

Approved data can become stale: a cooperative closes, moves, changes its phone number, or merges with another.

**Review the staleness management mechanism:**

1. The current model is downvoting: community members can downvote an approved point if the information is wrong, eventually flagging and removing it.

2. Check whether there is a "report as outdated" or "report as incorrect" path distinct from downvoting. Downvoting is ambiguous — it could mean "this is spam" or "this information is stale." These are different problems requiring different responses.

3. Check whether approved points display their submission date. A point submitted 3 years ago with no recent votes is more likely to be stale than a recently submitted one.

**Flag if:**
- No mechanism exists to flag stale data (only downvoting, which is ambiguous) — **INFO** (acceptable for v1, flag for v2)
- Submission date is not displayed on approved points — **INFO**
- Downvote on approved point has no explanation field — **INFO** (user cannot indicate WHY they are downvoting)

---

### 9. Crowdsourcing Anti-Patterns

Flag if any of these patterns are present in the codebase or are being proposed:

1. **Requiring registration to improve data quality.** This kills contribution rates. The 90-9-1 rule of online participation means only 1% of visitors contribute. Adding registration reduces that to 0.1%.

2. **Making verification so hard that data stays pending forever.** If 3 upvotes are required but only 2 people visit the pending queue per week, data is effectively rejected by neglect.

3. **Trusting any single contributor's data without verification.** Even well-intentioned contributors make mistakes (wrong pin location, misspelled name). The voting system is the verification layer.

4. **Silently discarding data.** If a submission is removed, the contributor should be able to see that it was removed (even without an account, via a "check your submission" link with the point ID).

5. **Over-engineering anti-spam.** The biggest risk to a new crowdsourcing project is not spam — it is silence. Over-aggressive spam prevention that blocks legitimate contributions is worse than letting a few spam points through (the community will downvote them).

6. **Centralized moderation.** Adding admin moderation undermines the community self-governance model and creates a maintenance burden for volunteers.

**Flag if:**
- Any anti-pattern is present — **WARNING** with explanation of the civic harm

---

### 10. Review Checklist

- [ ] Vote dedup uses both IP hash and fingerprint hash
- [ ] UNIQUE constraint exists on votes table as database-level defense
- [ ] Duplicate vote returns 409, not 500
- [ ] Status transitions match the spec (3 up = approved, 3 down = flagged, 6 down = removed, 5 up on flagged = approved)
- [ ] Approval threshold is defined as a configurable constant, not scattered magic numbers
- [ ] Cold start problem is acknowledged and addressed (or flagged)
- [ ] Rate limiting exists on vote and submission endpoints
- [ ] Submission validation includes Indonesia bounds check
- [ ] IP and fingerprint are always hashed before storage
- [ ] Form communicates value of optional fields
- [ ] Re-submission as correction mechanism is discoverable by users
- [ ] No reputation/trust system implemented without architect review
- [ ] Map default viewport covers all of Indonesia
- [ ] Staleness management mechanism exists or is flagged for v2
- [ ] No crowdsourcing anti-patterns present

---

### 11. Exit Criteria

The review is complete when:

1. Every item in the checklist above is confirmed PASS or has a filed finding
2. All CRITICAL findings are reported with file path, line number, and fix suggestion
3. All WARNING findings are reported with explanation of risk and remediation
4. The cold start problem has been assessed with a recommendation
5. Vote fraud detection sufficiency has been assessed with specific gaps identified
6. Data completeness has been assessed with recommendations for encouraging better submissions
7. A summary is provided: X critical / Y warning / Z info findings
8. Overall health assessment: HEALTHY, NEEDS ATTENTION, or AT RISK, with justification
