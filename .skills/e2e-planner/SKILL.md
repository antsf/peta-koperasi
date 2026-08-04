# e2e-planner

Plan end-to-end tests for v2+ and define the manual testing protocol for v1 of the Koperasi Desa Merah Putih Map project.

---

## Why No E2E in v1

E2E tests are explicitly excluded from v1 for these reasons:

1. **Playwright/Cypress setup complexity**: Requires browser binaries, CI configuration, and a running Next.js server. This is 2-4 hours of setup that delays shipping.
2. **Leaflet map interactions are notoriously hard to automate**: Click-on-map, drag, zoom, and marker interactions require coordinate translation between screen pixels and lat/lng. Flaky by nature.
3. **Supabase test environment provisioning**: E2E needs either a dedicated test project, local Supabase via Docker, or complex mocking at the network layer. None are trivial.
4. **Vibe-coder contributors cannot maintain complex E2E suites**: This is an open-source civic-tech project. Contributors are community members, not QA engineers. A broken E2E suite becomes a barrier to contribution.
5. **Unit tests cover the critical logic**: The voting state machine, validation, and PII protection are all testable without a browser. E2E would mainly catch integration glue, which can be verified manually in v1.

---

## V1 Manual Testing Protocol

This replaces E2E tests. Based on SPEC.md section 9 deployment checklist, expanded into a step-by-step QA script that any non-developer community member can follow.

### Preconditions

Before starting manual QA:

- [ ] Application is deployed to the staging/preview URL
- [ ] Supabase project has the latest schema migrations applied
- [ ] At least one test koperasi point exists in the database (or you will create one in Test 1)
- [ ] You have access to 3 different browsers or browser profiles (for multi-voter testing)
- [ ] You have a phone or can resize browser to mobile width (< 640px)

### How to Record a Failure

When a test step fails:

1. Note the **test number** (e.g., "Test 2, Step 3")
2. Take a **screenshot** (use browser built-in: Ctrl+Shift+S on Firefox, Ctrl+Shift+4 on Mac)
3. Note the **URL** you were on and the **expected vs actual result**
4. Open browser DevTools (F12) > Console tab, copy any **red error messages**
5. File as a GitHub issue with title: `[QA] Test X.Y failed: <short description>`

---

### Test 1: Submit a New Koperasi Point

**Goal**: Verify the full submission flow works end-to-end.

1. Open the application at the staging URL
2. Click the "Tambah Koperasi" / "Add Cooperative" button
3. Fill in the form:
   - Name: `QA Test Koperasi [today's date]`
   - Type: Select "Simpan Pinjam"
   - Click on the map to place a pin (anywhere in Indonesia)
   - Description: `Test submission for QA`
   - Photo: Upload any JPG/PNG image under 2MB (optional)
4. Click "Submit" / "Kirim"
5. **Expected**: Success message appears. The point appears on the map as a pending marker (different color/style from approved markers).
6. **Expected**: The point has `status = pending` (verify by clicking on the marker — it should show pending status).

### Test 2: Three-Vote Approval Flow

**Goal**: Verify that 3 upvotes from 3 different voters transitions a point from pending to approved.

**Setup**: Use the pending point from Test 1. Use 3 different browser profiles/browsers.

1. **Browser A**: Open the app, find the pending point from Test 1, click on it
2. Click the upvote button
3. **Expected**: Vote accepted, upvote count shows 1
4. **Browser B**: Open the app in a different browser/profile, find the same point
5. Click the upvote button
6. **Expected**: Vote accepted, upvote count shows 2
7. **Browser C**: Open the app in a third browser/profile, find the same point
8. Click the upvote button
9. **Expected**: Vote accepted, upvote count shows 3. Point status changes to "approved" (marker style changes, status label updates).

### Test 3: Vote Deduplication

**Goal**: Verify the same person cannot vote twice on the same point.

1. Open the app (use Browser A from Test 2)
2. Find any point you already voted on
3. Click the upvote or downvote button again
4. **Expected**: Vote is rejected. An error message indicates you have already voted. Vote count does not change.

### Test 4: Photo Visibility Toggle

**Goal**: Verify photos are hidden before approval and visible after.

**Setup**: Submit a new point WITH a photo (Test 1 flow), or use a known pending point with a photo.

1. Open the app, find a **pending** point that has a photo
2. Click on the marker to view details
3. **Expected**: Photo is NOT displayed (null, placeholder, or explicitly hidden). This protects against spam/inappropriate images before community review.
4. Now find an **approved** point that has a photo (use the point from Test 2 if it had a photo, or use any known approved point)
5. Click on the marker to view details
6. **Expected**: Photo IS displayed correctly.

### Test 5: Region Filter

**Goal**: Verify the region/province filter narrows map results.

1. Open the app at the staging URL
2. Note the total number of visible markers on the map (approximate is fine)
3. Select a specific region/province from the filter dropdown (e.g., "Jawa Barat")
4. **Expected**: Map zooms/pans to the selected region. Only points within that region are visible. Marker count is less than or equal to the total from step 2.
5. Clear the filter / select "Semua" / "All"
6. **Expected**: All markers return to the map.

### Test 6: Language Toggle Persistence

**Goal**: Verify switching between Bahasa Indonesia and English persists across page navigation.

1. Open the app at the staging URL
2. Find the language toggle (ID/EN switch)
3. Switch to English
4. **Expected**: All UI labels change to English
5. Navigate to a different page or click on a point to view details
6. **Expected**: Language is still English (not reset to Indonesian)
7. Close the browser tab, open a new tab, navigate back to the app
8. **Expected**: Language preference is remembered (English persists via localStorage or cookie)
9. Switch back to Indonesian, repeat steps 5-8
10. **Expected**: Indonesian persists the same way

### Test 7: Mobile Responsiveness

**Goal**: Verify core flows work on mobile viewport.

1. Open DevTools (F12), toggle device toolbar (Ctrl+Shift+M), select a mobile device (e.g., iPhone 12)
2. Navigate to the app — map should fill the screen, no horizontal scroll
3. Submit a point (Test 1 flow) — form should be usable without zooming
4. Vote on a point — vote buttons should be tappable (minimum 44x44px touch target)
5. Use the region filter — dropdown should be usable on mobile
6. **Expected**: All interactions work without requiring horizontal scrolling or zooming

### Test 8: Rate Limit

**Goal**: Verify excessive submissions are blocked.

1. Open the app
2. Submit 10 new koperasi points rapidly (use minimal form data each time)
3. Attempt an 11th submission
4. **Expected**: The 11th submission is rejected with a rate limit error message (HTTP 429 or user-friendly equivalent). Previous 10 submissions remain valid.

---

## When E2E Becomes Worth It (V2 Signals)

Add E2E tests to the roadmap when ANY of these conditions are true:

- The submission flow or voting flow breaks in production **more than twice** (indicates unit tests are not catching integration bugs)
- The contributor base grows past **20 active contributors** (manual QA does not scale)
- A **second major feature** is added that interacts with the map (e.g., clustering, search, routing) — combinatorial manual testing becomes impractical
- The project receives **funding or institutional backing** that justifies CI costs
- A **critical bug reaches production** that E2E would have caught but unit tests did not (e.g., form submits to wrong API endpoint, map click handler broken by Leaflet upgrade)

---

## E2E Technology Recommendation: Playwright

When the time comes, use **Playwright** (not Cypress). Reasons:

1. **Better for maps**: Playwright supports precise coordinate-based clicks (`page.click({ position: { x, y } })`) which is essential for Leaflet map interactions.
2. **Better TypeScript support**: First-class TypeScript — no `cy.wrap()` gymnastics.
3. **Free and open source**: No paid dashboard required (Cypress has a paid cloud offering that creates lock-in).
4. **Multiple browser contexts**: Can open 3 isolated browser contexts in one test to simulate 3 different voters — critical for testing the vote approval flow.
5. **Network interception**: `page.route()` is cleaner than Cypress `cy.intercept()` for mocking Supabase responses in integration mode.
6. **Parallel by default**: Tests run in parallel across workers with proper isolation.

---

## E2E Test Priorities When Implemented

Implement in this order (highest impact first):

### Priority 1: Submission Form

```
submit-flow.spec.ts
- Fill form with valid data -> point appears on map
- Submit with missing required field -> validation error shown
- Submit with coordinates outside Indonesia -> rejection
- Submit with photo -> photo uploaded, hidden until approved
```

### Priority 2: Vote Flow (Multi-Session)

```
vote-flow.spec.ts
- Single upvote increments count
- 3 upvotes from 3 contexts -> status changes to approved
- Duplicate vote from same context -> rejected
- Downvote flow to flagged state
- Vote on approved point -> rejected
```

### Priority 3: Region Filter

```
region-filter.spec.ts
- Select province -> map zooms, markers filtered
- Clear filter -> all markers return
- Filter with zero results -> empty state message
```

### Priority 4: Photo Visibility

```
photo-visibility.spec.ts
- Pending point hides photo
- Approved point shows photo
- Transition from pending to approved reveals photo
```

---

## How to Seed Test Data in Supabase for E2E

### Migration File with Test Fixtures

Create a dedicated seed file (NOT a migration — migrations are for schema, seeds are for data):

```sql
-- supabase/seed.test.sql (only run in test/staging environments)

-- Clean slate
DELETE FROM votes WHERE point_id IN (SELECT id FROM koperasi_points WHERE name LIKE 'E2E_%');
DELETE FROM koperasi_points WHERE name LIKE 'E2E_%';

-- Approved point (for photo visibility, vote rejection tests)
INSERT INTO koperasi_points (id, name, koperasi_type, latitude, longitude, status, upvotes, downvotes, photo_url, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'E2E_Approved_Koperasi',
  'simpan_pinjam',
  -6.2, 106.816,
  'approved', 3, 0,
  'https://example.com/test-photo.jpg',
  'Seeded for E2E testing'
);

-- Pending point (for voting flow tests)
INSERT INTO koperasi_points (id, name, koperasi_type, latitude, longitude, status, upvotes, downvotes, photo_url, description)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'E2E_Pending_Koperasi',
  'konsumen',
  -7.25, 112.75,
  'pending', 0, 0,
  'https://example.com/hidden-photo.jpg',
  'Seeded for E2E voting flow'
);

-- Flagged point (for removal and recovery tests)
INSERT INTO koperasi_points (id, name, koperasi_type, latitude, longitude, status, upvotes, downvotes, photo_url, description)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'E2E_Flagged_Koperasi',
  'produsen',
  -8.65, 115.2,
  'flagged', 1, 3,
  NULL,
  'Seeded for E2E flagged recovery'
);
```

### Cleanup Strategy

Each E2E test file must clean up after itself. Use Playwright's `test.afterAll`:

```typescript
import { test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for cleanup
);

test.afterAll(async () => {
  // Delete all E2E-created data (prefixed with E2E_)
  await supabase.from("votes").delete().like("point_id", "00000000-0000-0000-0000-%");
  await supabase.from("koperasi_points").delete().like("name", "E2E_%");
});
```

Also re-seed before each test suite with `test.beforeAll` to ensure deterministic state.

---

## The Multi-Session Vote Challenge

The hardest E2E test to write: proving that 3 votes from 3 different fingerprints approve a point.

### Problem

FingerprintJS generates a `visitorId` per browser. In Playwright, all contexts within the same browser share the same fingerprint canvas, WebGL, and other signals. Three `browser.newContext()` calls may produce the same fingerprint.

### Solution: Three Isolated Browser Instances

```typescript
import { test, chromium, firefox, webkit } from "@playwright/test";

test("3 votes from 3 different browsers approve a pending point", async () => {
  // Launch 3 different browser types for maximum fingerprint isolation
  const browsers = await Promise.all([
    chromium.launch(),
    firefox.launch(),
    webkit.launch(),
  ]);

  const pages = await Promise.all(
    browsers.map(async (browser) => {
      const context = await browser.newContext();
      return context.newPage();
    })
  );

  const pointUrl = `/points/00000000-0000-0000-0000-000000000002`;

  for (const page of pages) {
    await page.goto(pointUrl);
    await page.click('[data-testid="upvote-button"]');
    await page.waitForSelector('[data-testid="vote-success"]');
  }

  // Verify approval on any page
  await pages[0].reload();
  const status = await pages[0].textContent('[data-testid="point-status"]');
  expect(status).toBe("approved");

  // Cleanup
  await Promise.all(browsers.map((b) => b.close()));
});
```

### Alternative: Mock Fingerprint at Network Layer

If browser-level isolation is insufficient, intercept the FingerprintJS API call and inject unique IDs:

```typescript
for (let i = 0; i < 3; i++) {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept FingerprintJS and return a unique visitorId
  await page.addInitScript(`
    window.__FINGERPRINT_OVERRIDE = "e2e-voter-${i}";
  `);

  // Application code checks for override in test mode
  // if (process.env.NODE_ENV === "test" && window.__FINGERPRINT_OVERRIDE) ...
}
```

This approach is less realistic but 100% deterministic.

---

## Checklist: Is the Project Ready for E2E?

All of the following must be true before investing in E2E test infrastructure:

- [ ] Unit test suite passes with 100% of critical-path items covered
- [ ] At least 2 production incidents that E2E would have prevented (justifies the investment)
- [ ] CI/CD pipeline exists and runs unit tests on every PR
- [ ] Supabase local development (`supabase start`) works reliably for all contributors
- [ ] At least one contributor willing to own E2E maintenance
- [ ] Budget for CI minutes (Playwright runs take 2-5 minutes per suite with 3 browsers)
- [ ] The manual QA script from v1 is documented and has been used at least 5 times

---

## Exit Criteria

### V1 Manual Testing Exit Criteria

Manual QA is complete when:

1. All 8 test scenarios above have been executed and pass
2. Results are recorded (pass/fail per test, screenshots for failures)
3. All critical failures (Test 1, 2, 3, 4) are resolved before production deployment
4. Non-critical failures (Test 5, 6, 7) are filed as GitHub issues and triaged

### V2 E2E Exit Criteria

E2E suite is complete when:

1. All 4 priority test files are implemented and pass
2. Tests run in CI on every PR to `main`
3. Tests complete in under 5 minutes
4. No flaky tests (10 consecutive green runs)
5. Test data seeding and cleanup are automated
6. At least one non-author contributor has successfully run the E2E suite locally
