# ux-review

User experience review from the perspective of the actual users of the Koperasi Desa Merah Putih Map project.

## When to use

Run this skill when reviewing any PR that changes user flows, form fields, navigation, or copy. Also run before any release milestone or when onboarding new contributors who need to understand user expectations.

## Instructions

You are reviewing the UX of a civic-tech crowdsourced map of Indonesian village cooperatives. Your users are:

1. **Village residents** — low tech literacy, budget Android phone, 4G connection, may be first-time web app users
2. **Students and researchers** — moderate tech literacy, looking for cooperative data
3. **NGO volunteers** — moderate-to-high tech literacy, helping cooperatives get listed
4. **Local government officials** — variable tech literacy, checking cooperative presence in their region

Every interaction must be obvious without instructions. If a user needs to "figure out" how something works, that is a UX failure.

Work through every section below. For each item, trace the actual user flow in the code, report PASS or FAIL, and provide a concrete fix when failing.

### 1. The village resident lens

Review the entire app through the eyes of someone who:
- Has never used a web map before
- May not understand what "submit" or "pending" means in a tech context
- Uses a 5-inch screen with large system font size
- Has slow, intermittent connectivity

Check:
- Is the purpose of the app immediately clear on the landing page? (A tagline or brief explanation should be visible without scrolling)
- Are navigation labels simple Indonesian words, not tech jargon?
- Does the map load with a visible Indonesian region by default (not zoomed out to show the whole world)?
- Are there any interactions that require precision tapping (small targets, close-together buttons)?

### 2. The contributor journey

Trace this exact flow in the code and flag where it can break:

1. **Visitor arrives at `/`** — Can they see a "Tambah Koperasi" / "Add Cooperative" button without scrolling?
2. **Visitor taps submit** — Does it navigate to `/submit`? Is there a loading state during navigation?
3. **Visitor sees the form** — Are the most important fields first? Recommended order: cooperative name, location (map pin), province/regency, then optional fields (photo, description, contact).
4. **Visitor drops a pin on the map** — On mobile touch, is the pin-drop interaction obvious? Is there an instruction like "Tap the map to set location"? Can the pin be adjusted after placing?
5. **Visitor fills the form** — Are keyboard types correct? (`type="tel"` for phone, `type="email"` for email, `type="text"` for name). Is there autofill support (`autoComplete` attributes)?
6. **Visitor submits** — Is there a loading state on the submit button? Is double-submit prevented?
7. **Visitor sees confirmation** — After submission, is there a clear success message? Does it explain that the submission is pending review? Is there a way to go back to the map?

### 3. The voter journey

Trace this flow:

1. **Visitor navigates to `/pending`** — Is `/pending` discoverable from the main nav? Is the label clear?
2. **Visitor sees pending submissions** — Does each card explain what voting does? (e.g., "3 votes needed to approve")
3. **Visitor understands community verification** — The concept that "the community verifies submissions" is non-obvious. There must be explanatory text on the `/pending` page, not just a list of cards with vote buttons.
4. **Visitor casts a vote** — Is the vote button clearly labeled (not just an icon)? Is there feedback after voting (count updates, button state changes)?
5. **Visitor sees result** — If the vote causes approval (threshold met), is there celebration or confirmation?

### 4. Language toggle visibility

- The `LanguageToggle` must be in the header, visible on every page, on both mobile and desktop.
- It must not be hidden inside a hamburger menu on mobile.
- It must be recognizable without reading text (flag icon or "ID / EN" pattern).
- Test: if an Indonesian user lands on the English version, can they switch to Indonesian within 2 seconds of looking at the header?

### 5. The "why is my submission pending" problem

- On `/pending`, each card must show a progress indicator: "X of 3 votes received" or similar.
- There should be explanatory text at the top of `/pending` explaining the process.
- On the confirmation page after submission, the message must mention that community votes are needed.
- Check: is there any way for a contributor to find their own submission after submitting? (A link, a search, anything)

### 6. Form UX on mobile

Review `SubmitForm`:
- Field order: most important fields first (name, location), optional fields last
- Input types: `type="tel"` for phone, `type="email"` for email, `inputMode="numeric"` where appropriate
- Map interaction in the form: the embedded map for pin-drop must be tall enough to be usable on mobile (at least 200px / `h-48`)
- Validation timing: prefer on-blur validation over on-submit-only validation (users should know immediately if a field is wrong)
- Required field indicators: every required field must have a visual indicator (asterisk or text)

### 7. Error message language

- All validation error messages must exist in both `id.json` and `en.json`.
- Error messages must use plain language: "Nama koperasi harus diisi" not "Field required" or "Validation error".
- Check that error messages appear near the field, not in a toast or alert at the top of the page.

### 8. Trust signals

- `PointCard` for approved points should show vote count or "Verified by community" badge.
- The footer or about section should explain who maintains the map and how data is verified.
- No point should display without showing its status clearly.

### 9. Anti-patterns to flag

- Submit button hidden in a menu or below the fold
- More than 6 required fields (friction kills contribution)
- No feedback after form submission (user doesn't know if it worked)
- Requiring account creation to submit or vote (this project should be anonymous-friendly)
- Confirmation dialogs for non-destructive actions (don't ask "Are you sure?" for upvoting)
- Pagination on the pending page when there are fewer than 20 items

## Review output format

```
## UX Review — [date]

### Summary
X passes, Y failures, Z warnings

### User journey traces
#### Contributor journey
Step 1: ... PASS/FAIL — [detail]
...

#### Voter journey
Step 1: ... PASS/FAIL — [detail]
...

### Findings
| # | Check | Status | File:Line | Detail |
|---|-------|--------|-----------|--------|
...

### Required fixes (blocking)
1. ...

### Recommended improvements (non-blocking)
1. ...
```

## Exit criteria

The review is complete when:
- Both the contributor journey and voter journey have been traced step-by-step with PASS/FAIL for each step
- Every section of the checklist has been evaluated
- Every FAIL has a concrete, actionable fix described
- No anti-pattern from section 9 is present without being flagged
- The review output is filled in completely
